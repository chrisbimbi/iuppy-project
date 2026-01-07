import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as socket_io;
import 'package:iuppy_app/core/providers.dart';

class ChatService {
  final String _baseUrl;
  final String _token;
  final String _userId;
  socket_io.Socket? _socket;

  // Stream controllers for real-time events
  final _messageCtrl = StreamController<Map<String, dynamic>>.broadcast();
  final _typingCtrl = StreamController<Map<String, dynamic>>.broadcast();

  ChatService(this._baseUrl, this._token, this._userId);

  Stream<Map<String, dynamic>> get messageStream => _messageCtrl.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingCtrl.stream;

  void connect() {
    if (_socket != null && _socket!.connected) return;

    final uri = '$_baseUrl/chat';
    debugPrint('[ChatService] Connecting to $uri as $_userId');

    _socket = socket_io.io(
        uri,
        socket_io.OptionBuilder()
            .setTransports(['websocket'])
            .setExtraHeaders(
                {'Authorization': 'Bearer $_token', 'x-user-id': _userId})
            .disableAutoConnect()
            .build());

    _socket!.io.options?['extraHeaders'] = {
      'Authorization': 'Bearer $_token',
      'x-user-id': _userId
    };

    _socket!.onConnect((_) {
      debugPrint('[ChatService] Connected');
    });

    _socket!.onDisconnect((_) {
      debugPrint('[ChatService] Disconnected');
    });

    _socket!.on('newMessage', (data) {
      debugPrint('[ChatService] New Message: $data');
      _messageCtrl.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('userTyping', (data) {
      _typingCtrl.add(Map<String, dynamic>.from(data));
    });

    _socket!.on('messageUpdated', (data) {
      debugPrint('[ChatService] Message Updated: $data');
      _messageCtrl.add(Map<String, dynamic>.from(data)..['isUpdate'] = true);
    });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void joinRoom(String conversationId) {
    _socket?.emit('joinRoom', conversationId);
  }

  void leaveRoom(String conversationId) {
    _socket?.emit('leaveRoom', conversationId);
  }

  void sendMessage(String conversationId, String content,
      {String type = 'TEXT',
      Map<String, dynamic>? metadata,
      String? replyToId}) {
    _socket?.emit('sendMessage', {
      'conversationId': conversationId,
      'content': content,
      'type': type,
      'metadata': metadata,
      'replyToId': replyToId,
    });
  }

  void sendReaction(String conversationId, String messageId, String reaction) {
    _socket?.emit('reaction', {
      'conversationId': conversationId,
      'messageId': messageId,
      'reaction': reaction,
    });
  }

  void sendTyping(String conversationId) {
    _socket?.emit('typing', conversationId);
  }
}

final chatServiceProvider = Provider<ChatService>((ref) {
  final env = ref.watch(envProvider);
  final auth = ref.watch(authControllerProvider);
  final user = ref.watch(userProfileProvider).value;

  final token = auth.accessToken ?? '';
  final userId = user?.id ?? '';

  final service = ChatService(env.apiBaseUrl, token, userId);

  if (token.isNotEmpty && userId.isNotEmpty) {
    service.connect();
  }

  ref.onDispose(() => service.disconnect());

  return service;
});

final chatConversationsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getChatConversations();
});

final unreadCountProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getUnreadCount();
});

final chatBadgeProvider = Provider.autoDispose<AsyncValue<int>>((ref) {
  final countAsync = ref.watch(unreadCountProvider);
  return countAsync.whenData((data) => (data['total'] as num?)?.toInt() ?? 0);
});
