import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import 'widgets/avatar_stack.dart';

class NewsChannelListPage extends ConsumerWidget {
  final String channelId;
  const NewsChannelListPage({required this.channelId, super.key});

  int _num(dynamic v) {
    if (v is num) return v.toInt();
    if (v == null) return 0;
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(newsRepoProvider);

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: repo.listByChannel(channelId), // remote-first
      builder: (context, snap) {
        final theme = Theme.of(context);

        if (snap.connectionState != ConnectionState.done) {
          return Scaffold(
            appBar: AppBar(title: const Text('Notícias')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (snap.hasError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Notícias')),
            body: Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Falha ao carregar: ${snap.error}',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          );
        }

        final list = snap.data ?? const [];

        return Scaffold(
          appBar: AppBar(title: const Text('Notícias')),
          body: ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) {
              final n = list[i];
              final title = (n['title'] ?? '').toString().trim();
              final when =
                  _fmtDate((n['updatedAt'] ?? n['createdAt'])?.toString());
              final settings = (n['settings'] as Map?) ?? const {};
              final hasAck =
                  (settings['acknowledgementRequired'] ?? false) == true;
              final attachments =
                  ((n['attachments'] as List?) ?? const []).cast<String>();
              final thumb = _firstHttpUrl(n['highlightImages'] as List?);
              final channel = (n['channelName'] ?? '').toString();

              // métricas/estado
              final metrics = (n['metrics'] as Map?) ?? const {};
              final reacts =
                  _num(metrics['reactionsTotal'] ?? n['reactionsTotal']);
              final shares = _num(metrics['sharesTotal'] ?? n['sharesTotal']);

              // comentários (respeita moderação)
              final commentsRequireModeration =
                  (settings['allowComments'] ?? false) == true &&
                      (settings['commentsRequireModeration'] ?? false) == true;

              final approvedFromBackend = _num(
                metrics['commentsApprovedTotal'] ??
                    metrics['commentsApproved'] ??
                    metrics['approvedComments'] ??
                    metrics['comments_approved'] ??
                    metrics['approved'],
              );

              final commentsBackend =
                  _num(metrics['commentsTotal'] ?? n['commentsTotal']);
              final comments = commentsRequireModeration
                  ? approvedFromBackend // ← apenas aprovados contam
                  : commentsBackend;

              // amostra de quem reagiu
              final reactorsSample =
                  ((n['reactorsSample'] as List?) ?? const [])
                      .whereType<Map>()
                      .map((m) => (
                            name: (m['name'] ?? '').toString(),
                            avatar: (m['avatarUrl'] ?? '').toString(),
                          ))
                      .toList();

              return Card(
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => context.push('/news/article/${n['id']}'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (thumb != null)
                            SizedBox(
                              width: 96,
                              height: 96,
                              child: Image.network(thumb, fit: BoxFit.cover),
                            ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    title.isEmpty ? 'Notícia' : title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: theme.textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 6),
                                  Text(when, style: theme.textTheme.labelSmall),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: [
                                      if (channel.isNotEmpty)
                                        _chip(context, channel),
                                      if (hasAck) _chip(context, 'Para aceite'),
                                      if (attachments.isNotEmpty)
                                        _chip(context, 'Anexos'),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      // rodapé de interações
                      if (reacts > 0 || comments > 0 || shares > 0) ...[
                        const Divider(height: 1),
                        Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.favorite_border_rounded,
                                  size: 16),
                              const SizedBox(width: 6),
                              Text('$reacts'),
                              const SizedBox(width: 14),
                              const Icon(Icons.mode_comment_outlined, size: 16),
                              const SizedBox(width: 6),
                              Text('$comments'),
                              const Spacer(),
                              AvatarStack(items: reactorsSample, size: 22),
                            ],
                          ),
                        ),
                        if (shares > 0)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
                            child: Text(
                              '$shares compartilhamentos',
                              style: theme.textTheme.labelSmall,
                            ),
                          ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  static String? _firstHttpUrl(List? arr) {
    if (arr == null) return null;
    for (final e in arr) {
      final s = '$e';
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
    }
    return null;
  }

  static Widget _chip(BuildContext context, String text) {
    final color = Theme.of(context).colorScheme.secondaryContainer;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: Theme.of(context).textTheme.labelSmall),
    );
  }

  static String _fmtDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final d = dt.toLocal();
    String two(int n) => n.toString().padLeft(2, '0');
    final yy = (d.year % 100).toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)}/$yy - ${two(d.hour)}:${two(d.minute)}';
  }
}
