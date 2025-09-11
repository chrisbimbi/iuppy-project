import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/home/widgets/glass_search_and_spaces.dart';

import '../../core/providers.dart';
import '../menu/menu_drawer.dart';

// widgets existentes
import 'widgets/header_oval.dart';
import 'widgets/quick_access_row.dart';
import 'widgets/news_carousel.dart';
import 'widgets/modules_grid.dart';
import 'widgets/curved_navbar.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});
  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  int _navIndex = 0;
  String? _selectedSpaceId;
  String _query = '';

  @override
  void initState() {
    super.initState();
    // pré-carrega (visível para o usuário) e badges
    Future.microtask(() async {
      await ref.read(spacesRepoProvider).fetchAndCache();
      await ref.read(channelsRepoProvider).fetchAndCache();
      await _refreshLatestNewsAndBadges();
      setState(() {});
    });
  }

  Future<void> _refreshLatestNewsAndBadges() async {
    // atualiza feed (remote-first) e cache (já filtrado por canais permitidos)
    await ref.read(newsRepoProvider).homeFeedRemoteFirst(maxItems: 24);

    // calcula não lidas a partir do cache + store
    final cached = await ref.read(dbProvider).getNews(limit: 500);
    final published =
        cached.where((n) => (n['isPublished'] ?? true) == true).toList();
    final ids = published.map((e) => (e['id'] ?? '').toString());
    final unread = await ref.read(localNewsStoreProvider).countUnread(ids);

    ref.read(homeBadgesProvider.notifier).state =
        HomeBadges(newsNew: unread, surveysPending: 0);

    // atualiza contadores do Drawer
    ref.invalidate(unreadCountersProvider);
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d.branding,
          orElse: () => null,
        );
    final name = ref.watch(authControllerProvider).userName ?? 'usuário';
    final badges = ref.watch(homeBadgesProvider);

    return Scaffold(
      key: _scaffoldKey,
      drawer: const MenuDrawer(),
      bottomNavigationBar: CurvedNavBar(
        selectedIndex: _navIndex,
        onSelected: (i) {
          setState(() => _navIndex = i);
          switch (i) {
            case 0:
              break; // Início
            case 1:
              GoRouter.of(context).push('/favorites');
              break;
            case 2:
              GoRouter.of(context).push('/notifications');
              break;
            case 3:
              GoRouter.of(context).push('/settings');
              break;
            case 4:
              _scaffoldKey.currentState?.openDrawer();
              break;
          }
        },
        // badge só em "Alertas"
        badges: {2: badges.newsNew},
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _refreshLatestNewsAndBadges();
          setState(() {});
        },
        child: CustomScrollView(
          slivers: [
            // Header com curva + quick access por cima
            SliverToBoxAdapter(
              child: _HeaderWithQuickAccess(
                color: Color(branding?.primary ?? 0xFF22B4FF),
                title: _greeting(name),
              ),
            ),

            // Busca + filtros de spaces
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Column(
                  children: [
                    GlassSearchAndSpaces(
                      selectedSpaceId: _selectedSpaceId,
                      onSpaceChanged: (id) =>
                          setState(() => _selectedSpaceId = id),
                      onQueryChanged: (q) => setState(() => _query = q),
                    ),
                  ],
                ),
              ),
            ),

            // Últimas notícias
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Últimas notícias',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    TextButton(
                      onPressed: () => GoRouter.of(context).push('/news'),
                      child: const Text('Ver todas'),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 308,
                child: NewsCarousel(spaceId: _selectedSpaceId),
              ),
            ),

            // Módulos
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Comece agora!',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    TextButton(
                      onPressed: () => GoRouter.of(context).push('/modules'),
                      child: const Text('Ver todos'),
                    ),
                  ],
                ),
              ),
            ),
            const ModulesGrid(),

            // respiro p/ a TabBar curva
            SliverToBoxAdapter(
              child: SizedBox(
                height: MediaQuery.of(context).padding.bottom + 16,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Header com a curva + QuickAccess por cima (sem padding negativo)
class _HeaderWithQuickAccess extends StatelessWidget {
  const _HeaderWithQuickAccess({
    required this.color,
    required this.title,
  });

  final Color color;
  final String title;

  @override
  Widget build(BuildContext context) {
    const headerH = 232.0; // altura maior p/ ficar longe do QuickAccess
    const rowH = 112.0;

    return SizedBox(
      height: headerH + rowH / 2 + 8,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned.fill(
            child: HeaderOval(
              color: color,
              title: title,
              trailing: IconButton(
                onPressed: () => GoRouter.of(context).push('/settings'),
                icon: const Icon(Icons.settings, color: Colors.white),
              ),
            ),
          ),
          const Positioned(
            left: 16,
            right: 16,
            top: headerH - rowH / 2,
            child: QuickAccessRow(),
          ),
        ],
      ),
    );
  }
}

String _greeting(String name) {
  final h = DateTime.now().hour;
  final hi = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
  return '$hi, $name';
}
