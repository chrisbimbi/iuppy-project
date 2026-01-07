import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/chat/chat_service.dart';
import 'package:iuppy_app/push_service.dart';
import 'package:cached_network_image/cached_network_image.dart';

import 'package:go_router/go_router.dart';
import 'package:iuppy_app/features/menu/team_page.dart'; // for teamListProvider

class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  @override
  Widget build(BuildContext context) {
    ref.listen(unreadCountProvider, (prev, next) {
      if (next.hasValue) {
        final total = next.value?['total'] ?? 0;
        PushService.instance.updateBadge(total as int);
      }
    });

    final conversationsAsync = ref.watch(chatConversationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mensagens'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: () {
              _showUserPicker(context);
            },
          ),
        ],
      ),
      body: conversationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Erro: $e')),
        data: (conversations) {
          final unreadAsync = ref.watch(unreadCountProvider);
          final unreadMap = unreadAsync.value?['byConversation'] ?? {};

          if (conversations.isEmpty) {
            return const Center(
                child: Text(
                    'Nenhuma conversa iniciada. Clique no + para começar.'));
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemCount: conversations.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final conv = conversations[index];
              final type = conv['type'];
              final participants = (conv['participants'] as List?) ?? [];
              final unread = unreadMap[conv['id']] ?? 0;

              // Resolve Name
              String title = conv['name'] ?? 'Chat';
              String? avatarUrl;

              if (type == 'DIRECT') {
                final currentUser = ref.read(userProfileProvider).value;
                final other = participants.firstWhere(
                    (p) => p['user']?['id'] != currentUser?.id,
                    orElse: () => null);
                if (other != null) {
                  title = other['user']['name'] ?? 'Usuário';
                  avatarUrl = other['user']['avatarUrl'];
                }
              }

              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                        color: Colors.black12,
                        blurRadius: 8,
                        offset: Offset(0, 2))
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () async {
                      // Mark as read immediately
                      final api = ref.read(apiClientProvider);
                      try {
                        await api.markChatAsRead(conv['id']);
                      } catch (e) {
                        debugPrint('Error marking as read: $e');
                      }

                      if (!context.mounted) return;
                      context
                          .push(
                              '/chat/${conv['id']}?title=${Uri.encodeComponent(title)}')
                          .then((_) {
                        ref.invalidate(chatConversationsProvider);
                        ref.invalidate(unreadCountProvider);
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          // Avatar
                          Badge(
                            isLabelVisible: unread > 0,
                            label: Text('$unread',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold)),
                            backgroundColor: Theme.of(context).primaryColor,
                            offset: const Offset(0, 0),
                            child: CircleAvatar(
                              radius: 28,
                              backgroundColor: Colors.grey.shade100,
                              backgroundImage: avatarUrl != null
                                  ? CachedNetworkImageProvider(avatarUrl)
                                  : null,
                              child: avatarUrl == null
                                  ? Icon(
                                      type == 'GROUP'
                                          ? Icons.groups
                                          : Icons.person,
                                      color: Colors.grey.shade400,
                                      size: 28)
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          // Content - WhatsApp Style
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: TextStyle(
                                      fontWeight: unread > 0
                                          ? FontWeight.bold
                                          : FontWeight.w600,
                                      fontSize: 16,
                                      color: Colors.black87),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    // Read receipt ticks (placeholder - needs backend data)
                                    // ✓ = sent, ✓✓ = delivered, ✓✓ blue = read
                                    if (conv['lastMessage'] != null &&
                                        conv['lastMessage']['senderId'] ==
                                            ref
                                                .read(userProfileProvider)
                                                .value
                                                ?.id)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(right: 4),
                                        child: Icon(
                                          Icons.done_all,
                                          size: 16,
                                          color: conv['lastMessage']
                                                      ['readStatus'] ==
                                                  'READ'
                                              ? Colors.blue
                                              : Colors.grey,
                                        ),
                                      ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        conv['lastMessage']?['type'] == 'IMAGE'
                                            ? '📷 Foto'
                                            : conv['lastMessage']?['type'] ==
                                                    'VOICE'
                                                ? '🎤 Áudio'
                                                : conv['lastMessage']
                                                            ?['type'] ==
                                                        'FILE'
                                                    ? '📄 Arquivo'
                                                    : conv['lastMessage']
                                                            ?['content'] ??
                                                        'Mensagem',
                                        style: TextStyle(
                                            fontWeight: unread > 0
                                                ? FontWeight.w600
                                                : FontWeight.normal,
                                            color: unread > 0
                                                ? Colors.black87
                                                : Colors.grey.shade500,
                                            fontSize: 13),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Timestamp (trailing - WhatsApp style)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                conv['lastMessageAt'] != null
                                    ? _formatDate(conv['lastMessageAt'])
                                    : '',
                                style: TextStyle(
                                    color: Colors.grey.shade500, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      final now = DateTime.now();
      if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
        return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      }
      return '${dt.day}/${dt.month} ${dt.hour}:${dt.minute}';
    } catch (_) {
      return iso;
    }
  }

  void _showUserPicker(BuildContext context) {
    showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => DraggableScrollableSheet(
            initialChildSize: 0.9,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollCtrl) {
              return _UserPickerModal(scrollController: scrollCtrl);
            }));
  }
}

class _UserPickerModal extends ConsumerStatefulWidget {
  final ScrollController scrollController;
  const _UserPickerModal({required this.scrollController});

  @override
  ConsumerState<_UserPickerModal> createState() => _UserPickerModalState();
}

class _UserPickerModalState extends ConsumerState<_UserPickerModal> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final teamAsync = ref.watch(teamListProvider(_query));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              const Text('Nova Conversa',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context))
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Buscar pessoa...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none),
            ),
            onChanged: (v) => setState(() => _query = v),
          ),
        ),
        const SizedBox(height: 10),
        Expanded(
            child: teamAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => Center(child: Text('Erro: $e')),
                data: (users) {
                  final currentUser = ref.watch(userProfileProvider).value;
                  final filtered =
                      users.where((u) => u['id'] != currentUser?.id).toList();
                  if (filtered.isEmpty) {
                    return const Center(child: Text('Ninguém encontrado'));
                  }

                  return ListView.builder(
                    controller: widget.scrollController,
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final user = filtered[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundImage: user['avatarUrl'] != null
                              ? CachedNetworkImageProvider(user['avatarUrl'])
                              : null,
                          child: user['avatarUrl'] == null
                              ? Text(user['name']?[0] ?? '?')
                              : null,
                        ),
                        title: Text(user['name'] ?? 'Sem nome'),
                        subtitle:
                            Text(user['jobTitle'] ?? user['department'] ?? ''),
                        onTap: () async {
                          Navigator.pop(context); // Close modal
                          try {
                            final api = ref.read(apiClientProvider);
                            final conv =
                                await api.createDirectConversation(user['id']);
                            if (context.mounted) {
                              await context.push(
                                  '/chat/${conv['id']}?title=${Uri.encodeComponent(user['name'] ?? '')}');
                              ref.invalidate(chatConversationsProvider);
                              ref.invalidate(unreadCountProvider);
                            }
                          } catch (e) {
                            debugPrint('Create chat error: $e');
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                      content: Text('Erro ao criar chat: $e')));
                            }
                          }
                        },
                      );
                    },
                  );
                }))
      ],
    );
  }
}

// Providers moved to chat_service.dart
