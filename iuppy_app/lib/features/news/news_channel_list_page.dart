import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import 'widgets/premium_news_card.dart';

// Provider local para controlar o refresh da página
final _channelRefreshProvider = StateProvider.autoDispose<int>((ref) => 0);

class NewsChannelListPage extends ConsumerWidget {
  final String channelId;
  const NewsChannelListPage({required this.channelId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(newsRepoProvider);
    final channelsRepo = ref.read(channelsRepoProvider);

    // Assiste o provider de refresh para reconstruir quando ele mudar
    ref.watch(_channelRefreshProvider);

    // Future combinado para buscar notícias e nome do canal
    final combinedFuture = Future.wait([
      repo.listByChannel(channelId),
      channelsRepo.getCached().then((list) {
        final c = list.firstWhere(
            (e) => (e['id'] ?? '').toString() == channelId,
            orElse: () => {});
        return (c['name'] ?? 'Notícias').toString();
      }),
    ]);

    return FutureBuilder<List<dynamic>>(
      future: combinedFuture,
      builder: (context, snap) {
        // Loading State Elegante
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            backgroundColor: Colors.white,
            body: Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.black,
              ),
            ),
          );
        }

        // Error State
        if (snap.hasError) {
          return Scaffold(
            backgroundColor: Colors.white,
            appBar: AppBar(
              title: const Text('Notícias',
                  style: TextStyle(
                      fontWeight: FontWeight.bold, fontFamily: 'Space Mono')),
              elevation: 0,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black87,
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline,
                      size: 48, color: Colors.red.shade300),
                  const SizedBox(height: 16),
                  Text('Falha ao carregar notícias',
                      style: TextStyle(
                          color: Colors.grey[600], fontFamily: 'Space Mono')),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () =>
                        ref.read(_channelRefreshProvider.notifier).state++,
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
          );
        }

        final newsList = (snap.data?[0] as List<Map<String, dynamic>>?) ?? [];
        final channelName = (snap.data?[1] as String?) ?? 'Notícias';

        // 🔥 ORDENAÇÃO: Pin to Top primeiro
        final sortedList = List<Map<String, dynamic>>.from(newsList);
        sortedList.sort((a, b) {
          final sA = (a['settings'] as Map?) ?? {};
          final sB = (b['settings'] as Map?) ?? {};
          final pinA = (sA['pinToTop'] ?? false) == true;
          final pinB = (sB['pinToTop'] ?? false) == true;

          if (pinA && !pinB) return -1;
          if (!pinA && pinB) return 1;

          // Se ambos pinados ou ambos não pinados, mantém ordem original (data)
          return 0;
        });

        return Scaffold(
          backgroundColor: Colors.white,
          body: Stack(
            children: [
              // LISTA
              RefreshIndicator(
                color: Colors.black,
                onRefresh: () async {
                  ref.read(_channelRefreshProvider.notifier).state++;
                  await Future.delayed(const Duration(milliseconds: 500));
                },
                child: sortedList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.newspaper,
                                size: 64, color: Colors.grey.shade300),
                            const SizedBox(height: 16),
                            Text('Nenhuma notícia neste canal.',
                                style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 16,
                                    fontFamily: 'Space Mono')),
                          ],
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 120, 16, 40),
                        itemCount: sortedList.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 24),
                        itemBuilder: (context, i) {
                          final n = sortedList[i];
                          return PremiumNewsCard(
                            news: n,
                            onTap: () async {
                              await context.push('/news/article/${n['id']}');
                              ref
                                  .read(_channelRefreshProvider.notifier)
                                  .state++;
                            },
                          );
                        },
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
                          Expanded(
                            child: Text(
                              channelName.toUpperCase(),
                              style: const TextStyle(
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
      },
    );
  }
}
