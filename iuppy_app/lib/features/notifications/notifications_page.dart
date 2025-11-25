import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'notifications_provider.dart';
import '../forms/local_form_store.dart';
import '../../core/providers.dart';

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncItems = ref.watch(notificationsListProvider);

    return Scaffold(
      backgroundColor: const Color(0xfff4f6f8),
      appBar: AppBar(
        title: const Text('Notificações',
            style: TextStyle(fontWeight: FontWeight.w600)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: asyncItems.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro ao carregar: $e')),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none,
                      size: 64, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text('Nenhuma notificação.',
                      style:
                          TextStyle(color: Colors.grey.shade500, fontSize: 16)),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              return _NotificationCard(item: items[index]);
            },
          );
        },
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  final NotificationItem item;
  const _NotificationCard({required this.item});

  void _handleTap(BuildContext context, WidgetRef ref) {
    switch (item.type) {
      case NotificationType.news:
        final newsId = item.payload['newsId'];
        if (newsId != null) {
          ref.read(localNewsStoreProvider).markRead(newsId);
          ref.read(newsSeenVersionProvider.notifier).state++;
          context.push('/news/article/$newsId');
        }
        break;
      case NotificationType.formNew:
        final formId = item.payload['formId'];
        if (formId != null) {
          ref.read(localFormStoreProvider).markAsSeen(formId);
          ref.read(formsSeenVersionProvider.notifier).state++;
          context.push('/forms/$formId');
        }
        break;
      case NotificationType.formReply:
        final fid = item.payload['formId'];
        final sid = item.payload['submissionId'];
        if (fid != null && sid != null) {
          // 🔥 ROTEAMENTO INTELIGENTE
          final action = (item.subtype == 'approve' || item.subtype == 'reject')
              ? 'details'
              : 'chat';
          context.push('/forms/$fid/submissions/$sid?action=$action');
        }
        break;
      case NotificationType.survey:
        final sid = item.payload['surveyId'];
        if (sid != null) {
          context.push('/surveys/$sid');
        }
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Formata título para "Nova mensagem em {Formulário}" se for chat
    String displayTitle = item.title;
    if (item.type == NotificationType.formReply && item.subtype == 'chat') {
      displayTitle = 'Nova mensagem em ${item.title}';
    } else if (item.type == NotificationType.formReply) {
      displayTitle = item.title; // "Formulário Tal"
    }

    return Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      color: item.isRead ? Colors.white : Colors.blue.shade50.withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: item.isRead ? Colors.grey.shade200 : Colors.blue.shade100,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _handleTap(context, ref),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  _buildIcon(context),
                  if (!item.isRead)
                    Positioned(
                      top: -2,
                      right: -2,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            displayTitle,
                            style: TextStyle(
                              fontWeight: item.isRead
                                  ? FontWeight.w600
                                  : FontWeight.w800,
                              fontSize: 15,
                              color: Colors.black87,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _timeAgo(item.date),
                          style: TextStyle(
                            fontSize: 11,
                            color: item.isRead
                                ? Colors.grey.shade500
                                : Colors.blue.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (item.subtitle != null)
                      Text(
                        item.subtitle!,
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 13,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIcon(BuildContext context) {
    IconData icon;
    Color color;
    Color bg;

    switch (item.type) {
      case NotificationType.news:
        icon = Icons.article_rounded;
        color = Colors.blue.shade600;
        bg = Colors.blue.shade50;
        break;
      case NotificationType.formNew:
        icon = Icons.assignment_add;
        color = Colors.purple.shade600;
        bg = Colors.purple.shade50;
        break;
      case NotificationType.formReply:
        if (item.subtype == 'approve') {
          icon = Icons.check_circle_rounded;
          color = Colors.green.shade600;
          bg = Colors.green.shade50;
        } else if (item.subtype == 'reject') {
          icon = Icons.cancel_rounded;
          color = Colors.red.shade600;
          bg = Colors.red.shade50;
        } else {
          // chat
          icon = Icons.chat_bubble_rounded;
          color = Colors.indigo.shade600;
          bg = Colors.indigo.shade50;
        }
        break;
      case NotificationType.survey:
        icon = Icons.poll_rounded;
        color = Colors.orange.shade600;
        bg = Colors.orange.shade50;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 22),
    );
  }

  String _timeAgo(DateTime d) {
    final now = DateTime.now();
    final diff = now.difference(d);

    if (diff.inDays > 30) {
      return '${d.day}/${d.month}';
    } else if (diff.inDays >= 1) {
      return 'há ${diff.inDays} d';
    } else if (diff.inHours >= 1) {
      return 'há ${diff.inHours} h';
    } else if (diff.inMinutes >= 1) {
      return 'há ${diff.inMinutes} m';
    } else {
      return 'agora';
    }
  }
}
