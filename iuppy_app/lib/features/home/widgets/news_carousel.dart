import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart';
import '../../news/widgets/chips.dart';
import '../../news/widgets/avatar_stack.dart';
import '../providers/news_metrics_provider.dart';

/// -------- Helpers --------

int _asInt(dynamic v, [int d = 0]) {
  if (v is num) return v.toInt();
  if (v == null) return d;
  return int.tryParse(v.toString()) ?? d;
}

String _c(int n) {
  if (n >= 1000000) {
    final v = n / 1000000;
    return '${v.truncateToDouble() == v ? v.toStringAsFixed(0) : v.toStringAsFixed(1)} mi';
  }
  if (n >= 1000) {
    final v = n / 1000;
    return '${v.truncateToDouble() == v ? v.toStringAsFixed(0) : v.toStringAsFixed(1)} mil';
  }
  return '$n';
}

String? _fmtDate(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso)?.toLocal();
  if (dt == null) return null;
  String two(int n) => n < 10 ? '0$n' : '$n';
  final yy = dt.year % 100;
  return '${two(dt.day)}/${two(dt.month)}/${two(yy)} - ${two(dt.hour)}:${two(dt.minute)}';
}

String? _firstHttpUrl(dynamic arr) {
  if (arr == null) return null;
  if (arr is String) return arr.startsWith('http') ? arr : null;
  if (arr is List) {
    for (final e in arr) {
      if (e is String && e.startsWith('http')) return e;
      if (e is Map &&
          e['url'] != null &&
          e['url'].toString().startsWith('http')) {
        return e['url'].toString();
      }
    }
  }
  return null;
}

class NewsCarousel extends ConsumerWidget {
  const NewsCarousel({super.key, this.spaceId});
  final String? spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Observa o feed via homeFeedProvider; é recalculado quando [feedVersionProvider] muda.
    final feed = ref.watch(homeFeedProvider(spaceId));

    return feed.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) =>
          const Center(child: Text('Falha ao carregar notícias.')),
      data: (list) {
        if (list.isEmpty) {
          return const Center(child: Text('Sem notícias por aqui.'));
        }

        // Busca as métricas em batch para os cards visíveis
        final batchMetrics = ref.watch(newsBatchMetricsProvider(list));

        return batchMetrics.when(
          loading: () => PageView.builder(
            controller: PageController(viewportFraction: .86),
            itemCount: list.length,
            itemBuilder: (_, i) => _NewsCard.skeleton(),
          ),
          error: (_, __) => PageView.builder(
            controller: PageController(viewportFraction: .86),
            itemCount: list.length,
            itemBuilder: (_, i) {
              // se der erro no batch, ainda renderizamos com os fallbacks do /news
              return _NewsCard(
                item: list[i],
                metricsById: const {},
              );
            },
          ),
          data: (metricsById) => PageView.builder(
            controller: PageController(viewportFraction: .86),
            itemCount: list.length,
            itemBuilder: (_, i) => _NewsCard(
              item: list[i],
              metricsById: metricsById,
            ),
          ),
        );
      },
    );
  }
}

class _NewsCard extends StatelessWidget {
  const _NewsCard({
    required this.item,
    required this.metricsById,
  });

  final Map item;
  final Map<String, Map<String, dynamic>> metricsById;

  static Widget skeleton() {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Material(
        color: Colors.grey.shade200,
        elevation: 1.5,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: const SizedBox(height: 308),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final n = item;

    final img = _firstHttpUrl(n['highlightImages']) ??
        'https://iuppy.com.br/wp-content/uploads/2025/05/automacao-fluxos-1.png';
    final title = (n['title'] ?? '').toString();
    final created = _fmtDate(n['createdAt']?.toString());
    final spaceName = (n['spaceName'] ?? '').toString();
    final channelName = (n['channelName'] ?? '').toString();

    // 1) tenta pegar métricas do batch (por id)
    final m = metricsById[(n['id'] ?? '').toString()] ?? const {};

    // 2) fallback: aceita tanto legacy quanto v2 embutidos no /news (se existirem)
    final legacyMetrics = (n['metrics'] as Map?) ?? const {};

    final reacts = _asInt(
      m['reactionsTotal'] ??
          legacyMetrics['totalReactions'] ??
          n['totalReactions'],
    );
    final comments = _asInt(
      m['commentsTotal'] ??
          legacyMetrics['commentsTotal'] ??
          n['commentsTotal'],
    );
    final shares = _asInt(
      m['sharesTotal'] ?? legacyMetrics['sharesTotal'] ?? n['sharesTotal'],
    );
    // Alguns backends ainda não fornecem a contagem de salvamentos (bookmarks).
    final saves = _asInt(
      legacyMetrics['savesTotal'] ?? n['savesTotal'],
    );

    final reactorsSample = ((n['reactorsSample'] as List?) ?? const [])
        .whereType<Map>()
        .map((m) => (
              name: (m['name'] ?? '').toString(),
              avatar: (m['avatarUrl'] ?? '').toString(),
            ))
        .toList();

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        elevation: 1.5,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => GoRouter.of(context).push('/news/article/${n['id']}'),
          child: SizedBox(
            height: 308,
            child: Column(
              children: [
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: img,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) => const Center(
                            child: Icon(Icons.broken_image_outlined)),
                      ),
                      Positioned(
                        left: 8,
                        right: 8,
                        top: 8,
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (spaceName.isNotEmpty) Pill(spaceName),
                            if (channelName.isNotEmpty) Pill(channelName),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      if (created != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            created,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(fontWeight: FontWeight.w300),
                          ),
                        ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Reações
                          const Icon(Icons.favorite_border_rounded, size: 16),
                          const SizedBox(width: 6),
                          Text(_c(reacts)),
                          const SizedBox(width: 14),
                          // Comentários
                          const Icon(Icons.mode_comment_outlined, size: 16),
                          const SizedBox(width: 6),
                          Text(_c(comments)),
                          const SizedBox(width: 14),
                          // Compartilhamentos
                          const Icon(Icons.ios_share_rounded, size: 16),
                          const SizedBox(width: 6),
                          Text(_c(shares)),
                          const SizedBox(width: 14),
                          // Salvamentos/Bookmarks (quando disponível)
                          const Icon(Icons.bookmark_outline, size: 16),
                          const SizedBox(width: 6),
                          Text(_c(saves)),
                          const Spacer(),
                          AvatarStack(items: reactorsSample, size: 20),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
