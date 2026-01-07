import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import 'widgets/premium_news_card.dart';

final _favoritesRefreshProvider = StateProvider.autoDispose<int>((ref) => 0);

final _favoritesListProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(_favoritesRefreshProvider);
  final repo = ref.read(newsRepoProvider);
  return repo.getFavorites();
});

class FavoritesPage extends ConsumerWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncFavorites = ref.watch(_favoritesListProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // LISTA
          RefreshIndicator(
            color: Colors.black,
            onRefresh: () async {
              ref.read(_favoritesRefreshProvider.notifier).state++;
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: asyncFavorites.when(
              data: (favorites) {
                if (favorites.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.bookmark_border,
                            size: 64, color: Colors.grey.shade300),
                        const SizedBox(height: 16),
                        Text('Você ainda não tem favoritos.',
                            style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 16,
                                fontFamily: 'Space Mono')),
                      ],
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 120, 16, 40),
                  itemCount: favorites.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 24),
                  itemBuilder: (context, i) {
                    final n = favorites[i];
                    return PremiumNewsCard(
                      news: n,
                      onTap: () async {
                        await context.push('/news/article/${n['id']}');
                        ref.read(_favoritesRefreshProvider.notifier).state++;
                      },
                    );
                  },
                );
              },
              error: (err, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 48, color: Colors.red.shade300),
                    const SizedBox(height: 16),
                    Text('Falha ao carregar favoritos',
                        style: TextStyle(
                            color: Colors.grey[600], fontFamily: 'Space Mono')),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () =>
                          ref.read(_favoritesRefreshProvider.notifier).state++,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Tentar novamente',
                          style: TextStyle(fontFamily: 'Space Mono')),
                    )
                  ],
                ),
              ),
              loading: () => const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.black,
                ),
              ),
            ),
          ),

          // GLASS HEADER
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 100,
                  padding: const EdgeInsets.fromLTRB(8, 48, 16, 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.8),
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey.shade200,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back,
                            color: Colors.black87),
                        onPressed: () {
                          if (Navigator.of(context).canPop()) {
                            Navigator.of(context).pop();
                          } else {
                            context.go('/home');
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'FAVORITOS',
                          style: TextStyle(
                            fontFamily: 'Space Mono',
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -1.0,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
