import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // For Clipboard
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/chat/chat_service.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ChatRoomPage extends HookConsumerWidget {
  final String conversationId;
  final String? title;

  const ChatRoomPage({
    super.key,
    required this.conversationId,
    this.title,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatService = ref.watch(chatServiceProvider);
    final api = ref.watch(apiClientProvider);
    final user = ref.watch(userProfileProvider).value;

    final messages = useState<List<Map<String, dynamic>>>([]);
    final isLocked = useState(false);
    final isLoading = useState(true);
    final inputCtrl = useTextEditingController();
    final scrollCtrl = useScrollController();
    final hasText = useState(false);

    useEffect(() {
      void listener() => hasText.value = inputCtrl.text.trim().isNotEmpty;
      inputCtrl.addListener(listener);
      return () => inputCtrl.removeListener(listener);
    }, [inputCtrl]);

    // Reply State
    final replyingTo = useState<Map<String, dynamic>?>(null);

    // Attachments State (WhatsApp-style staging)
    final attachments = useState<List<PlatformFile>>([]);

    // Recording State
    final isRecording = useState(false);
    final isStopping = useState(false);
    final recordingStart = useState<DateTime?>(null);
    // Align lifecycle with useEffect
    final audioRecorder = useMemoized(() => AudioRecorder(), [conversationId]);
    final audioPlayer = useMemoized(() => AudioPlayer(), [conversationId]);
    // Audio Playback State
    final playingMessageId = useState<String?>(null);

    useEffect(() {
      chatService.joinRoom(conversationId);
      api.markChatAsRead(conversationId).catchError((e) {
        debugPrint('Failed to mark read: $e');
      });

      Future<void> load() async {
        try {
          final history = await api.getChatMessages(conversationId);
          messages.value = history;
        } catch (e) {
          debugPrint('Failed to load history: $e');
        } finally {
          isLoading.value = false;
        }
      }

      load();

      final sub = chatService.messageStream.listen((data) {
        if (data['conversationId'] != conversationId) return;

        // Handle updates or new messages
        final isUpdate = data['isUpdate'] == true;
        if (isUpdate) {
          messages.value = messages.value.map((m) {
            return (m['id'] == data['id']) ? {...m, ...data} : m;
          }).toList();
        } else {
          // Prevent duplicates
          if (!messages.value.any((m) => m['id'] == data['id'])) {
            messages.value = [data, ...messages.value];
          }
        }
      });

      return () {
        sub.cancel();
        chatService.leaveRoom(conversationId);
      };
    }, [conversationId]);

    // Listen to player completion to reset state and config audio
    useEffect(() {
      audioPlayer.setAudioContext(AudioContext(
        android: const AudioContextAndroid(
          isSpeakerphoneOn: true,
          stayAwake: true,
          contentType: AndroidContentType.music,
          usageType: AndroidUsageType.media,
          audioFocus: AndroidAudioFocus.gain,
        ),
        iOS: AudioContextIOS(
          category: AVAudioSessionCategory.playAndRecord,
          options: const {
            AVAudioSessionOptions.defaultToSpeaker,
            AVAudioSessionOptions.allowBluetooth,
            AVAudioSessionOptions.allowAirPlay
          },
        ),
      ));

      final sub = audioPlayer.onPlayerComplete.listen((_) {
        playingMessageId.value = null;
      });
      return sub.cancel;
    }, [audioPlayer]);

// ... skip to ListView builder

    // Helper Methods

    Future<void> sendMessage(String content, String type,
        {Map<String, dynamic>? metadata}) async {
      if (content.isEmpty) return;

      final tempId = DateTime.now().millisecondsSinceEpoch.toString();
      final replyId = replyingTo.value?['id'];

      // Create Snapshot for optimistic UI
      Map<String, dynamic>? replySnapshot;
      if (replyingTo.value != null) {
        replySnapshot = {
          'id': replyingTo.value!['id'],
          'content': (replyingTo.value!['content']?.length ?? 0) > 100
              ? replyingTo.value!['content']!.substring(0, 100)
              : replyingTo.value!['content'] ?? '',
          'senderName': '...',
        };
      }

      final optimisticMsg = {
        'id': tempId,
        'conversationId': conversationId,
        'senderId': user?.id,
        'content': content,
        'type': type,
        'metadata': metadata,
        'createdAt': DateTime.now().toIso8601String(),
        'isPending': true,
        'replyToId': replyId,
        'replySnapshot': replySnapshot
      };

      messages.value = [optimisticMsg, ...messages.value];
      chatService.sendMessage(conversationId, content,
          type: type, metadata: metadata, replyToId: replyId);
    }

    Future<void> sendAttachments() async {
      if (attachments.value.isEmpty) return;

      final files = List<PlatformFile>.from(attachments.value);
      attachments.value = []; // Clear immediately to update UI
      replyingTo.value = null; // Clear reply context after sending

      for (final file in files) {
        try {
          final bytes = File(file.path!).readAsBytesSync();
          final url = await api.uploadFileBytes(bytes, file.name);
          final msgType = ['jpg', 'jpeg', 'png', 'gif']
                  .contains(file.extension?.toLowerCase())
              ? 'IMAGE'
              : 'FILE';

          await sendMessage(url, msgType,
              metadata: {'fileName': file.name, 'fileSize': file.size});
        } catch (e) {
          debugPrint('Error uploading file ${file.name}: $e');
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Falha ao enviar ${file.name}')));
          }
        }
      }
    }

    Future<void> stopRecording(bool cancel) async {
      // Guard against double stop or if not recording
      if (!isRecording.value || isStopping.value) return;

      isStopping.value = true;
      try {
        final path = await audioRecorder.stop();
        final duration = recordingStart.value != null
            ? DateTime.now().difference(recordingStart.value!).inMilliseconds
            : 0;

        // Reset state after stop succeeds
        isRecording.value = false;
        isLocked.value = false;

        if (!cancel && path != null && duration > 1000) {
          final file = File(path);
          if (await file.exists()) {
            final size = await file.length();
            debugPrint(
                '[Audio] Recording stopped. Path: $path, Size: $size bytes, Duration: ${duration}ms');

            final bytes = await file.readAsBytes();
            final url = await api.uploadFileBytes(bytes, 'voice_message.m4a');
            sendMessage(url, 'VOICE', metadata: {'duration': duration});
            replyingTo.value = null;
          } else {
            debugPrint('[Audio] File not found at path: $path');
          }
        }
      } catch (e) {
        debugPrint('Error stopping recorder: $e');
      } finally {
        isStopping.value = false;
        if (isRecording.value) isRecording.value = false;
        if (isLocked.value) isLocked.value = false;
      }
    }

    Future<void> startRecording() async {
      final status = await Permission.microphone.request();
      if (status.isGranted) {
        final dir = await getTemporaryDirectory();
        final path =
            '${dir.path}/audio_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await audioRecorder
            .start(const RecordConfig(encoder: AudioEncoder.aacLc), path: path);
        isRecording.value = true;
        recordingStart.value = DateTime.now();

        // Auto-stop after 2 mins
        Future.delayed(const Duration(minutes: 2), () {
          if (isRecording.value) stopRecording(false);
        });
      } else {
        debugPrint('[Audio] Permission status: $status');
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Permissão de microfone negada.'),
            action: SnackBarAction(
              label: 'Configurações',
              onPressed: openAppSettings,
            ),
          ));
        }
      }
    }

    void onSend() {
      if (attachments.value.isNotEmpty) {
        sendAttachments();
        if (inputCtrl.text.isNotEmpty) {
          final text = inputCtrl.text.trim();
          sendMessage(text, 'TEXT');
          inputCtrl.clear();
        }
      } else {
        final text = inputCtrl.text.trim();
        if (text.isEmpty) return;
        sendMessage(text, 'TEXT');
        inputCtrl.clear();
        replyingTo.value = null;
      }
    }

    Future<void> pickFile() async {
      final type = await showModalBottomSheet<String>(
          context: context,
          builder: (ctx) => SafeArea(
                  child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                      leading: const Icon(Icons.camera_alt),
                      title: const Text('Câmera'),
                      onTap: () => Navigator.pop(ctx, 'camera')),
                  ListTile(
                      leading: const Icon(Icons.photo_library),
                      title: const Text('Galeria'),
                      onTap: () => Navigator.pop(ctx, 'gallery')),
                  ListTile(
                      leading: const Icon(Icons.insert_drive_file),
                      title: const Text('Arquivo'),
                      onTap: () => Navigator.pop(ctx, 'file')),
                ],
              )));
      if (type == null) return;

      try {
        FilePickerResult? result;
        if (type == 'file') {
          result = await FilePicker.platform
              .pickFiles(allowMultiple: true, type: FileType.any);
        } else {
          Map<String, FileType> map = {
            'gallery': FileType.image,
            'camera': FileType.image
          };
          result = await FilePicker.platform.pickFiles(
              allowMultiple: type == 'gallery',
              type: map[type] ?? FileType.any);
        }

        if (result != null && result.files.isNotEmpty) {
          // Add to attachments
          attachments.value = [...attachments.value, ...result.files];
        }
      } catch (e) {
        debugPrint('Error picking file: $e');
      }
    }

    void onReply(Map<String, dynamic> msg) {
      replyingTo.value = msg;
      // Focus input?
    }

    void onReact(String msgId, String reaction) {
      chatService.sendReaction(conversationId, msgId, reaction);
      // Navigator.pop(context); // REMOVED: Caused double pop
    }

    Future<void> onDelete(String msgId, bool forEveryone) async {
      try {
        final api = ref.read(apiClientProvider);
        await api.deleteMessage(msgId, forEveryone: forEveryone);

        // Manual update for "Delete for Me" since socket might not cover it for sender if not emitted back to self
        // OR if forEveryone is false, we should hide it.
        if (!forEveryone) {
          messages.value =
              messages.value.where((m) => m['id'] != msgId).toList();
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Erro ao apagar: $e')));
        }
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(title ?? 'Chat'),
        actions: [
          IconButton(
              icon: const Icon(Icons.info_outline),
              onPressed: () {
                // Pass title to info page
                final encodedTitle = Uri.encodeComponent(title ?? 'Info');
                context.push('/chat/$conversationId/info?title=$encodedTitle');
              })
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: scrollCtrl,
                    reverse: true,
                    itemCount: messages.value.length,
                    itemBuilder: (context, index) {
                      final msg = messages.value[index];
                      final isMe = msg['senderId'] == user?.id;
                      return _MessageBubble(
                        message: msg,
                        isMe: isMe,
                        currentUserId: user?.id ?? '',
                        player: audioPlayer,
                        playingMessageId: playingMessageId.value,
                        onPlayAudio: (id, url) async {
                          final safeUrl = url ?? '';
                          debugPrint('[Audio] Request for $id, url: $safeUrl');

                          if (safeUrl.isEmpty) {
                            debugPrint('[Audio] URL is empty/null!');
                            return;
                          }
                          try {
                            if (playingMessageId.value == id) {
                              debugPrint('[Audio] Pausing...');
                              await audioPlayer.pause();
                              playingMessageId.value = null;
                            } else {
                              debugPrint('[Audio] Playing...');
                              await audioPlayer.stop();
                              await audioPlayer.play(UrlSource(safeUrl));
                              playingMessageId.value = id;
                            }
                          } catch (e) {
                            debugPrint('[Audio] Error: $e');
                          }
                        },
                        onReply: () => onReply(msg),
                        onReact: (reaction) => onReact(msg['id'], reaction),
                        onDelete: (id, forEveryone) =>
                            onDelete(id, forEveryone),
                        onInfo: () => _showInfo(context, ref, msg['id']),
                      );
                    },
                  ),
          ),
          if (attachments.value.isNotEmpty)
            Container(
              height: 100,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              color: Colors.grey[100],
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: attachments.value.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) {
                  final file = attachments.value[i];
                  final isImage = ['jpg', 'jpeg', 'png', 'gif']
                      .contains(file.extension?.toLowerCase());
                  return Stack(
                    children: [
                      Container(
                        width: 80,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey[300]!),
                          color: Colors.white,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: isImage
                            ? Image.file(File(file.path!), fit: BoxFit.cover)
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.insert_drive_file,
                                      color: Colors.grey),
                                  const SizedBox(height: 4),
                                  Text(file.extension?.toUpperCase() ?? 'FILE',
                                      style: const TextStyle(fontSize: 10))
                                ],
                              ),
                      ),
                      Positioned(
                        top: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: () {
                            final list = [...attachments.value];
                            list.removeAt(i);
                            attachments.value = list;
                          },
                          child: Container(
                            padding: const EdgeInsets.all(2),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close,
                                size: 14, color: Colors.white),
                          ),
                        ),
                      )
                    ],
                  );
                },
              ),
            ),
          if (replyingTo.value != null)
            Container(
              padding: const EdgeInsets.all(8),
              color: Colors.grey[100],
              child: Row(
                children: [
                  const Icon(Icons.reply, color: Colors.blue),
                  const SizedBox(width: 8),
                  Expanded(
                      child: Text(
                          'Respondendo a: ${replyingTo.value!['content'] ?? '...'}')),
                  IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => replyingTo.value = null)
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(color: Colors.white, boxShadow: [
              BoxShadow(
                  color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))
            ]),
            child: SafeArea(
              child: Row(
                children: [
                  // Left Side: Conditional Content
                  Expanded(
                    child: isRecording.value
                        ? _RecordingStatus(
                            startTime: recordingStart.value ?? DateTime.now(),
                            onCancel: () => stopRecording(true),
                            isLocked: isLocked.value,
                          )
                        : Row(
                            children: [
                              IconButton(
                                  icon: const Icon(Icons.attach_file),
                                  onPressed: pickFile),
                              Expanded(
                                child: TextField(
                                  controller: inputCtrl,
                                  decoration: const InputDecoration(
                                      hintText: 'Mensagem...',
                                      border: InputBorder.none),
                                  minLines: 1,
                                  maxLines: 4,
                                ),
                              ),
                            ],
                          ),
                  ),

                  // Right Side: Action Button (Mic or Send)
                  if (hasText.value ||
                      attachments.value.isNotEmpty ||
                      (isLocked.value))
                    IconButton(
                      icon: const Icon(Icons.send, color: Colors.blue),
                      onPressed: () {
                        if (isLocked.value) {
                          stopRecording(false);
                        } else {
                          onSend();
                        }
                      },
                    )
                  else
                    GestureDetector(
                      onTap: () {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(
                          content: Text('Segure para gravar'),
                          duration: Duration(seconds: 1),
                        ));
                      },
                      onLongPressStart: (_) async {
                        debugPrint('[Audio] Long press start');
                        HapticFeedback.mediumImpact();
                        await startRecording();
                      },
                      onLongPressMoveUpdate: (details) {
                        if (!isRecording.value) return;

                        // Slide Left to Cancel
                        // Since Mic is on the right, negative dx is left
                        if (details.offsetFromOrigin.dx < -50) {
                          stopRecording(true);
                        }
                        // Slide Up to Lock
                        // negative dy is up
                        else if (details.offsetFromOrigin.dy < -50) {
                          isLocked.value = true;
                        }
                      },
                      onLongPressEnd: (_) {
                        // If not locked, stop (send)
                        if (isRecording.value && !isLocked.value) {
                          stopRecording(false);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8), // Larger touch target
                        child: Icon(
                            isRecording.value ? Icons.mic : Icons.mic_none,
                            color:
                                isRecording.value ? Colors.red : Colors.blue),
                      ),
                    )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

class _VoiceMessageBubble extends StatefulWidget {
  final String url;
  final int durationMs;
  final bool isPlaying;
  final bool isMe;
  final VoidCallback onPlayPause;
  final AudioPlayer player;

  const _VoiceMessageBubble({
    required this.url,
    required this.durationMs,
    required this.isPlaying,
    required this.isMe,
    required this.onPlayPause,
    required this.player,
  });

  @override
  State<_VoiceMessageBubble> createState() => _VoiceMessageBubbleState();
}

class _VoiceMessageBubbleState extends State<_VoiceMessageBubble> {
  Duration _position = Duration.zero;
  StreamSubscription? _posSub;

  @override
  void initState() {
    super.initState();
    if (widget.isPlaying) {
      _listen();
    }
  }

  @override
  void didUpdateWidget(covariant _VoiceMessageBubble oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isPlaying && !oldWidget.isPlaying) {
      _listen();
    } else if (!widget.isPlaying && oldWidget.isPlaying) {
      _stopListening();
    }
  }

  void _listen() {
    _posSub = widget.player.onPositionChanged.listen((p) {
      if (mounted) setState(() => _position = p);
    });
  }

  void _stopListening() {
    _posSub?.cancel();
    _posSub = null;
    if (mounted) setState(() => _position = Duration.zero);
  }

  @override
  void dispose() {
    _posSub?.cancel();
    super.dispose();
  }

  String _format(Duration d) {
    final m = d.inMinutes.toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final totalDuration = Duration(milliseconds: widget.durationMs);
    final displayTime = widget.isPlaying ? _position : totalDuration;
    final color = widget.isMe ? Colors.white : Colors.black87;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(widget.isPlaying ? Icons.pause : Icons.play_arrow),
          onPressed: widget.onPlayPause,
          color: color,
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Simple progress bar
            Container(
              width: 150,
              height: 4,
              margin: const EdgeInsets.only(bottom: 4),
              child: LinearProgressIndicator(
                value: totalDuration.inMilliseconds > 0
                    ? (_position.inMilliseconds / totalDuration.inMilliseconds)
                        .clamp(0.0, 1.0)
                    : 0,
                backgroundColor: color.withOpacity(0.3),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            Text(
              _format(displayTime),
              style: TextStyle(color: color, fontSize: 12),
            ),
          ],
        )
      ],
    );
  }
}

void _showInfo(BuildContext context, WidgetRef ref, String messageId) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(16),
      height: 400,
      child: FutureBuilder<Map<String, dynamic>>(
        future: ref.read(apiClientProvider).getMessageInfo(messageId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return const Center(child: Text('Erro ao carregar informações'));
          }

          final data = snapshot.data!;
          final readBy = data['readBy'] as List;
          final sentAt = data['sentAt'];

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: const BoxDecoration(
                      color: Colors.grey,
                      borderRadius: BorderRadius.all(Radius.circular(2))),
                ),
              ),
              const Text('Dados da Mensagem',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.access_time),
                title: const Text('Enviada'),
                subtitle: Text(DateFormat('dd/MM/yyyy HH:mm')
                    .format(DateTime.parse(sentAt).toLocal())),
              ),
              const Divider(),
              const Text('Lido por:',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Expanded(
                child: readBy.isEmpty
                    ? const Center(child: Text('Ninguém leu ainda.'))
                    : ListView.builder(
                        itemCount: readBy.length,
                        itemBuilder: (ctx, i) {
                          final item = readBy[i];
                          final u = item['user'];
                          final t = item['readAt'];
                          final avatarUrl = u['avatarUrl'];
                          final hasAvatar = avatarUrl != null &&
                              avatarUrl.toString().isNotEmpty;

                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: hasAvatar
                                  ? CachedNetworkImageProvider(avatarUrl)
                                  : null,
                              child: !hasAvatar
                                  ? Text(u['name']?[0] ?? '?')
                                  : null,
                            ),
                            title: Text(u['name'] ?? 'Usuário'),
                            subtitle: Text(DateFormat('dd/MM HH:mm')
                                .format(DateTime.parse(t).toLocal())),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    ),
  );
}

class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> message;
  final bool isMe;
  final String currentUserId;
  final AudioPlayer player;
  final String? playingMessageId;
  final Function(String, String?) onPlayAudio;
  final VoidCallback onReply;
  final Function(String) onReact;
  final Function(String, bool) onDelete;
  final VoidCallback onInfo;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.currentUserId,
    required this.player,
    required this.playingMessageId,
    required this.onPlayAudio,
    required this.onReply,
    required this.onReact,
    required this.onDelete,
    required this.onInfo,
  });

  void _showMenu(BuildContext context) {
    final messageContent = message['content']?.toString() ?? '';
    final senderId = message['senderId']?.toString() ?? '';
    final messageType = message['type'] ?? 'TEXT';

    showModalBottomSheet(
        context: context,
        builder: (ctx) {
          return SafeArea(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.all(16),
              child: Wrap(
                spacing: 16,
                children: ['👍', '❤️', '😂', '😮', '😢', '😡']
                    .map((e) => GestureDetector(
                          onTap: () {
                            Navigator.pop(ctx);
                            onReact(e);
                          },
                          child: Text(e, style: const TextStyle(fontSize: 32)),
                        ))
                    .toList(),
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.reply),
              title: const Text('Responder'),
              onTap: () {
                Navigator.pop(ctx);
                onReply();
              },
            ),
            if (messageType == 'TEXT' && messageContent.isNotEmpty)
              ListTile(
                leading: const Icon(Icons.copy),
                title: const Text('Copiar'),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: messageContent));
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Mensagem copiada'),
                        duration: Duration(seconds: 1)),
                  );
                },
              ),
            if (isMe)
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('Dados'),
                onTap: () {
                  Navigator.pop(ctx);
                  onInfo();
                },
              ),
            ListTile(
              leading: const Icon(Icons.delete, color: Colors.blueGrey),
              title: const Text('Apagar para mim'),
              onTap: () {
                Navigator.pop(ctx);
                onDelete(message['id'], false);
              },
            ),
            if (senderId == currentUserId)
              ListTile(
                leading: const Icon(Icons.delete_forever, color: Colors.red),
                title: const Text('Apagar para todos',
                    style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(ctx);
                  onDelete(message['id'], true);
                },
              ),
          ]));
        });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final type = message['type'] ?? 'TEXT';
    final content = message['content'];
    final meta = message['metadata'] ?? {};
    final time = message['createdAt'];
    final isPending = message['isPending'] == true;
    final replyTo = message['replySnapshot'];
    final reactions = message['reactions'] as Map<String, dynamic>?;
    final isDeleted = meta['isDeleted'] == true;

    if (isDeleted) {
      return Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!)),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.block, size: 16, color: Colors.grey),
                  SizedBox(width: 8),
                  Text('Mensagem apagada',
                      style: TextStyle(
                          fontStyle: FontStyle.italic, color: Colors.grey)),
                ],
              )));
    }

    Widget body;
    switch (type) {
      case 'IMAGE':
        if (content != null && content.toString().isNotEmpty) {
          body = GestureDetector(
            onTap: () {
              Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (ctx) => _FullScreenImage(imageUrl: content)));
            },
            child: Hero(
              tag: message['id'] ?? content,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(content, width: 200, fit: BoxFit.cover),
              ),
            ),
          );
        } else {
          body = const Row(
              children: [Icon(Icons.broken_image), Text('Imagem inválida')]);
        }
        break;
      case 'VOICE':
        body = _VoiceMessageBubble(
          url: content ?? '',
          durationMs: meta['duration'] ?? 0,
          isPlaying: playingMessageId == message['id'],
          isMe: isMe,
          onPlayPause: () => onPlayAudio(message['id'], content),
          player: player,
        );
        break;
      case 'FILE':
        body = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.insert_drive_file,
                color: isMe ? Colors.white : Colors.black54),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                meta['fileName'] ?? 'Arquivo',
                style: TextStyle(
                    color: isMe ? Colors.white : Colors.black87,
                    decoration: TextDecoration.underline),
              ),
            ),
          ],
        );
        break;
      default:
        body = Text(
          content ?? '',
          style: theme.textTheme.bodyMedium
              ?.copyWith(color: isMe ? Colors.white : Colors.black87),
        );
    }

    return GestureDetector(
      onLongPress: () => _showMenu(context),
      child: Dismissible(
          key: Key('msg_${message['id']}'),
          direction: DismissDirection.horizontal,
          confirmDismiss: (direction) async {
            if (direction == DismissDirection.startToEnd) {
              onReply();
              return false;
            } else {
              // Info
              onInfo();
              return false;
            }
          },
          background: Container(
            alignment: Alignment.centerLeft,
            padding: const EdgeInsets.only(left: 20),
            child: const Icon(Icons.reply, color: Colors.grey),
          ),
          secondaryBackground: Container(
            alignment: Alignment.centerRight,
            padding: const EdgeInsets.only(right: 20),
            child: const Icon(Icons.info_outline, color: Colors.grey),
          ),
          child: Align(
            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Column(
                  crossAxisAlignment:
                      isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isMe
                            ? theme.primaryColor
                            : const Color(
                                0xFFE3F2FD), // Light blue for received
                        borderRadius: BorderRadius.only(
                          topLeft: const Radius.circular(16),
                          topRight: const Radius.circular(16),
                          bottomLeft: isMe
                              ? const Radius.circular(16)
                              : const Radius.circular(0),
                          bottomRight: isMe
                              ? const Radius.circular(0)
                              : const Radius.circular(16),
                        ),
                      ),
                      constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (replyTo != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border(
                                      left: BorderSide(
                                          color: isMe
                                              ? Colors.white
                                              : theme.primaryColor,
                                          width: 3))),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(replyTo['senderName'] ?? 'No Name',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 10,
                                          color: isMe
                                              ? Colors.white70
                                              : Colors.black87)),
                                  Text(replyTo['content'] ?? '',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          fontSize: 12,
                                          color: isMe
                                              ? Colors.white70
                                              : Colors.black87)),
                                ],
                              ),
                            ),
                          body,
                          const SizedBox(height: 4),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              if (time != null)
                                Text(
                                  DateFormat('HH:mm')
                                      .format(DateTime.parse(time)),
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color:
                                        isMe ? Colors.white70 : Colors.black54,
                                    fontSize: 10,
                                  ),
                                ),
                              if (isMe && !isPending) ...[
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.done_all,
                                  size: 14,
                                  color: message['readStatus'] == 'READ'
                                      ? Colors.lightBlueAccent
                                      : Colors.white60,
                                ),
                              ],
                              if (isPending) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.access_time,
                                    size: 10, color: Colors.white70),
                              ]
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (reactions != null && reactions.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Wrap(
                            spacing: 4,
                            children: reactions.entries.map((entry) {
                              final list = entry.value as List;
                              final count = list.length;
                              return GestureDetector(
                                onTap: () {
                                  showModalBottomSheet(
                                      context: context,
                                      builder: (ctx) {
                                        return Container(
                                          padding: const EdgeInsets.all(16),
                                          child: Column(
                                            mainAxisSize: MainAxisSize.min,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                  '${entry.key} Reações ($count)',
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 18)),
                                              const SizedBox(height: 10),
                                              ConstrainedBox(
                                                constraints: BoxConstraints(
                                                    maxHeight:
                                                        MediaQuery.of(context)
                                                                .size
                                                                .height *
                                                            0.4),
                                                child: ListView(
                                                  shrinkWrap: true,
                                                  children: list.map((u) {
                                                    final name = (u is Map)
                                                        ? (u['name'] ??
                                                            'Usuário')
                                                        : 'Usuário';
                                                    return ListTile(
                                                      contentPadding:
                                                          EdgeInsets.zero,
                                                      leading: CircleAvatar(
                                                          child: Text(name[0]
                                                              .toUpperCase())),
                                                      title: Text(name),
                                                    );
                                                  }).toList(),
                                                ),
                                              )
                                            ],
                                          ),
                                        );
                                      });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                      color: Colors.grey.shade200,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                          color: Colors.white, width: 1)),
                                  child: Text('${entry.key} $count',
                                      style: const TextStyle(fontSize: 10)),
                                ),
                              );
                            }).toList()),
                      )
                  ]),
            ),
          )),
    );
  }
}

class _FullScreenImage extends StatelessWidget {
  final String imageUrl;

  const _FullScreenImage({required this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(
        child: InteractiveViewer(
          panEnabled: true,
          minScale: 0.5,
          maxScale: 4.0,
          child: Image.network(imageUrl),
        ),
      ),
    );
  }
}

class _RecordingStatus extends StatefulWidget {
  final DateTime startTime;
  final VoidCallback onCancel;
  final bool isLocked;

  const _RecordingStatus({
    required this.startTime,
    required this.onCancel,
    required this.isLocked,
  });

  @override
  State<_RecordingStatus> createState() => _RecordingStatusState();
}

class _RecordingStatusState extends State<_RecordingStatus>
    with SingleTickerProviderStateMixin {
  late Timer _timer;
  Duration _duration = Duration.zero;
  late AnimationController _blinkCtrl;

  @override
  void initState() {
    super.initState();
    _duration = DateTime.now().difference(widget.startTime);
    _startTimer();
    _blinkCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500))
      ..repeat(reverse: true);
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(milliseconds: 500), (t) {
      if (mounted) {
        setState(() {
          _duration = DateTime.now().difference(widget.startTime);
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    _blinkCtrl.dispose();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isLocked) {
      return Expanded(
          child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        height: 50,
        color: Colors.white,
        child: Row(
          children: [
            FadeTransition(
              opacity: _blinkCtrl,
              child: const Icon(Icons.mic, color: Colors.red),
            ),
            const SizedBox(width: 12),
            Text(_formatDuration(_duration),
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const Spacer(),
            TextButton(
                onPressed: widget.onCancel,
                child: const Text('Cancelar',
                    style: TextStyle(color: Colors.red))),
          ],
        ),
      ));
    }

    // Normal Recording Mode
    return Expanded(
        child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      height: 50,
      color: Colors.white,
      child: Row(
        children: [
          FadeTransition(
            opacity: _blinkCtrl,
            child: const Icon(Icons.mic, color: Colors.red),
          ),
          const SizedBox(width: 12),
          Text(_formatDuration(_duration),
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const Spacer(),
          const Icon(Icons.chevron_left, color: Colors.grey),
          const Text('Deslize para cancelar',
              style: TextStyle(color: Colors.grey)),
          const SizedBox(width: 8), // Reduced space to prevent overflow
        ],
      ),
    ));
  }
}
