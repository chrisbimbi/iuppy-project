import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart';
import '../../home/providers/news_metrics_provider.dart';
import '../../news/widgets/premium_news_card.dart';

class NewsCarousel extends ConsumerWidget {
  const NewsCarousel({super.key, this.spaceId});
  final String? spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Observa o feed via homeFeedProvider (suporta spaceId)
    final feed = ref.watch(homeFeedProvider(spaceId));

    return feed.when(
      loading: () => const SizedBox(
        height: 380,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, __) => const SizedBox.shrink(),
      data: (list) {
        if (list.isEmpty) {
          return const SizedBox.shrink();
        }

        // Busca as métricas em batch para os cards visíveis
        final batchMetrics = ref.watch(newsBatchMetricsProvider(list));

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Carousel
            SizedBox(
              height: 380,
              child: batchMetrics.when(
                loading: () => ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.only(right: 16, bottom: 8),
                    child: SizedBox(
                      width: 280,
                      child: PremiumNewsCard(
                        news: Map<String, dynamic>.from(list[i]),
                        onTap: () =>
                            GoRouter.of(context).push('/news/article/${list[i]['id']}'),
                      ),
                    ),
                  ),
                ),
                error: (_, __) => ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.only(right: 16, bottom: 8),
                    child: SizedBox(
                      width: 280,
                      child: PremiumNewsCard(
                        news: Map<String, dynamic>.from(list[i]),
                        onTap: () =>
                            GoRouter.of(context).push('/news/article/${list[i]['id']}'),
                      ),
                    ),
                  ),
                ),
                data: (metricsById) => ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => Padding(
                    padding: const EdgeInsets.only(right: 16, bottom: 8),
                    child: SizedBox(
                      width: 300,
                      child: PremiumNewsCard(
                        news: Map<String, dynamic>.from(list[i]),
                        onTap: () =>
                            GoRouter.of(context).push('/news/article/${list[i]['id']}'),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
