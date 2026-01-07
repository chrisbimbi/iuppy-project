import 'package:flutter/material.dart';
import 'package:iuppy_app/features/news/widgets/avatar.dart';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../gamification_providers.dart';
import 'gamification_timeline_item.dart';

class AchievementsPage extends ConsumerWidget {
  const AchievementsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final statsAsync = ref.watch(userStatsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: DefaultTabController(
        length: 3,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) {
            return [
              SliverAppBar(
                title: const Text('Minhas Conquistas'),
                centerTitle: true,
                pinned: true,
                forceElevated: innerBoxIsScrolled,
                backgroundColor: Colors.white,
                surfaceTintColor: Colors.white,
              ),
              SliverToBoxAdapter(
                child: statsAsync.when(
                  data: (stats) => _DashboardHeader(stats: stats),
                  loading: () => const _LoadingHeader(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ),
              SliverPersistentHeader(
                delegate: _SliverTabBarDelegate(
                  TabBar(
                    labelColor: theme.primaryColor,
                    unselectedLabelColor: Colors.grey,
                    indicatorColor: theme.primaryColor,
                    indicatorWeight: 3,
                    tabs: const [
                      Tab(text: 'Histórico'),
                      Tab(text: 'Ranking'),
                      Tab(text: 'Medalhas'),
                    ],
                  ),
                ),
                pinned: true,
              ),
            ];
          },
          body: const TabBarView(
            children: [
              _HistoryTab(),
              _RankingTab(),
              _BadgesTab(),
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardHeader extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _DashboardHeader({required this.stats});

  @override
  Widget build(BuildContext context) {
    // stats: { totalXP, level, nextLevelXP, progress, currentLevelName }
    final level = stats['level'] ?? 1;
    final totalXP = stats['totalXP'] ?? 0;
    final nextXP = stats['nextLevelXP'] ?? 100;
    final progress = (stats['progress'] ?? 0.0).toDouble();
    // final levelName = stats['currentLevelName'] ?? 'Novato';

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.indigo.shade600, Colors.indigo.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Avatar with smart image/initials
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: Avatar(
                  stats['avatarUrl'], // Assuming stats has it, or use fallback
                  name: stats['name'],
                  size: 64, // 32 radius * 2
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Nível $level',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Space Grotesk', // If available
                      ),
                    ),
                    Text(
                      '$totalXP XP Total', // 'Mestre Jedi' ?
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor: Colors.black12,
              valueColor: const AlwaysStoppedAnimation(Colors.limeAccent),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '0 XP',
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6), fontSize: 12),
              ),
              Text(
                'Próximo: $nextXP XP',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingHeader extends StatelessWidget {
  const _LoadingHeader();
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _HistoryTab extends ConsumerWidget {
  const _HistoryTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(xpHistoryProvider);

    return historyAsync.when(
      data: (history) {
        if (history.isEmpty) {
          return const Center(child: Text('Nenhuma atividade recente.'));
        }
        return ListView.builder(
          padding: const EdgeInsets.all(24),
          itemCount: history.length,
          itemBuilder: (context, index) {
            final item = history[index];
            return GamificationTimelineItem(
              item: item,
              isLast: index == history.length - 1,
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
    );
  }
}

class _RankingTab extends ConsumerWidget {
  const _RankingTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return leaderboardAsync.when(
      data: (users) {
        if (users.isEmpty) return const Center(child: Text('Sem ranking.'));
        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: users.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final u = users[index];
            final rank = index + 1;

            final name = u['displayName']?.toString().isNotEmpty == true
                ? u['displayName']
                : u['name'] ?? 'Usuário';

            return ListTile(
              leading: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _RankBadge(rank: rank),
                  const SizedBox(width: 12),
                  Avatar(
                    u['avatarUrl'],
                    name: name,
                    size: 40,
                  ),
                ],
              ),
              title: Text(
                name,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text('Nível ${(u['level'] ?? 1)}'),
              trailing: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                    color: Colors.indigo.shade50,
                    borderRadius: BorderRadius.circular(20)),
                child: Text(
                  '${u['xp'] ?? 0} XP',
                  style: TextStyle(
                      color: Colors.indigo.shade700,
                      fontWeight: FontWeight.bold),
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
    );
  }
}

class _BadgesTab extends ConsumerWidget {
  const _BadgesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgesAsync = ref.watch(badgesProvider);

    return badgesAsync.when(
      data: (badges) {
        if (badges.isEmpty) {
          return const Center(child: Text('Nenhuma medalha disponível.'));
        }
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.7,
          ),
          itemCount: badges.length,
          itemBuilder: (context, index) {
            return _BadgeItem(badge: badges[index]);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
    );
  }
}

class _BadgeItem extends StatelessWidget {
  final Map<String, dynamic> badge;
  const _BadgeItem({required this.badge});

  @override
  Widget build(BuildContext context) {
    // badge: { name, description, iconUrl, earned: bool, earnedAt: string? }
    final earned = badge['earned'] == true;
    final name = badge['name'] ?? '';
    final url = badge['iconUrl'] ?? '';

    return Column(
      children: [
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: earned ? Colors.amber.shade50 : Colors.grey.shade100,
              boxShadow: earned
                  ? [
                      BoxShadow(
                          color: Colors.amber.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4))
                    ]
                  : [],
              border: Border.all(
                color: earned ? Colors.amber : Colors.grey.shade300,
                width: 2,
              ),
            ),
            child: Opacity(
              opacity: earned ? 1.0 : 0.4,
              child: Center(
                child: url.isNotEmpty
                    ? Image.network(url,
                        width: 48,
                        height: 48,
                        errorBuilder: (_, __, ___) => const Icon(Icons.shield))
                    : const Icon(Icons.shield, size: 48, color: Colors.grey),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          name,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: earned ? Colors.black87 : Colors.grey,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

class _RankBadge extends StatelessWidget {
  final int rank;
  const _RankBadge({required this.rank});

  @override
  Widget build(BuildContext context) {
    Color color;
    if (rank == 1)
      color = Colors.amber;
    else if (rank == 2)
      color = Colors.grey.shade400;
    else if (rank == 3)
      color = Colors.brown.shade300;
    else
      return SizedBox(
          width: 40,
          child: Center(
              child: Text('#$rank',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.grey))));

    return Container(
      width: 40,
      height: 40,
      alignment: Alignment.center,
      child: Icon(Icons.emoji_events, color: color, size: 32),
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;
  _SliverTabBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverTabBarDelegate oldDelegate) {
    return false;
  }
}
