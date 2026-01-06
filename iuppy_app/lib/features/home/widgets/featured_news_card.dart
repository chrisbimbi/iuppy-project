import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';
import '../../../core/widgets/bento_tile.dart';

class FeaturedNewsCard extends ConsumerWidget {
  const FeaturedNewsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newsAsync = ref.watch(_hasAnyNewsCachedProvider);
    final primaryColor = Theme.of(context).primaryColor;

    return newsAsync.when(
      data: (hasNews) {
        if (!hasNews) {
          return const SizedBox.shrink();
        }

        return BentoTile(
          backgroundColor: const Color(0xFF1A1A1A),
          borderColor: Colors.black,
          borderWidth: 3.0,
          useGlass: true,
          onTap: () => context.push('/news'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Category badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: primaryColor,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'CULTURA',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Title
              const Text(
                'Confira as últimas novidades',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  height: 1.3,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),

              // Read more
              Row(
                children: [
                  Text(
                    'VER COMUNICADOS',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: primaryColor,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward,
                    size: 14,
                    color: primaryColor,
                  ),
                ],
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

// Use existing provider from home_page.dart
final _hasAnyNewsCachedProvider = FutureProvider<bool>((ref) async {
  final db = ref.read(dbProvider);
  final news = await db.getNews();
  return news.isNotEmpty;
});
