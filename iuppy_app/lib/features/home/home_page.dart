// lib/features/home/home_page.dart
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

// Indica rapidamente se há alguma notícia no cache local (para clamping de badges)
final _hasAnyNewsCachedProvider = FutureProvider<bool>((ref) async {
  final db = ref.read(dbProvider);
  final items = await db.getNews(limit: 1);
  return items.isNotEmpty;
});

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

  // guarda um container estável para leituras assíncronas
  late final ProviderContainer _c;
  bool _alive = true;

  @override
  void initState() {
    super.initState();
    _c = ProviderScope.containerOf(context, listen: false);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_alive) return;
      _bootstrap();
    });
  }

  @override
  void dispose() {
    _alive = false;
    super.dispose();
  }

  Future<void> _bootstrap() async {
    try {
      await Future.wait([
        _c.read(spacesRepoProvider).fetchAndCache(),
        _c.read(channelsRepoProvider).fetchAndCache(),
        _c.read(companySettingsProvider.future),
      ]);

      if (!_alive || !mounted) return;

      await _refreshLatestNewsAndBadges();

      if (!_alive || !mounted) return;
      setState(() {});
    } catch (e) {
      // log se quiser
    }
  }

  Future<void> _refreshLatestNewsAndBadges() async {
    if (!_alive) return;
    try {
      final api = _c.read(apiClientProvider);
      final remote = await api.getNews();
      if (!_alive) return;
      if (remote.isEmpty) {
        final cachedAll = await _c.read(dbProvider).getNews(limit: 2000);
        final ids = cachedAll
            .map((e) => (e['id'] ?? '').toString())
            .where((id) => id.isNotEmpty)
            .toList();
        if (ids.isNotEmpty) {
          await _c.read(localNewsStoreProvider).markManyRead(ids);
        }
      }
    } catch (_) {}

    await _c.read(newsRepoProvider).homeFeedRemoteFirst(maxItems: 24);
    if (!_alive) return;

    // Invalida para forçar recálculo dos badges
    _c.invalidate(unreadCountersProvider);
    _c.invalidate(formsBadgesProvider);

    _c.read(feedVersionProvider.notifier).state++;
  }

  @override
  Widget build(BuildContext context) {
    final branding = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d.branding,
          orElse: () => null,
        );
    final name = ref.watch(authControllerProvider).userName ?? 'usuário';

    // badges "cached" (fallback)
    final badges = ref.watch(homeBadgesProvider);
    final hasAnyNews = ref.watch(_hasAnyNewsCachedProvider).maybeWhen(
          data: (v) => v,
          orElse: () => true,
        );

    // badge vivo de news
    var unreadNews = ref.watch(unreadCountersProvider).maybeWhen(
          data: (d) => d.total,
          orElse: () => badges.newsNew,
        );
    if (!hasAnyNews) unreadNews = 0;

    // 🔥 BADGE DE FORMS: Pega do provider global que já soma (Novos + Respostas)
    final unreadForms = ref.watch(formsBadgesProvider).maybeWhen(
          data: (v) => v,
          orElse: () => badges.formsNew,
        );

    // 🔥 TOTAL: News + Forms
    final totalAlerts = unreadNews + unreadForms;

    return Scaffold(
      key: _scaffoldKey,
      drawer: const MenuDrawer(), // Agora o MenuDrawer tem o badge!
      bottomNavigationBar: CurvedNavBar(
        selectedIndex: _navIndex,
        onSelected: (i) {
          setState(() => _navIndex = i);
          switch (i) {
            case 0:
              break;
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
        badges: {
          2: totalAlerts, // 🔥 Mostra o total no sininho
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _refreshLatestNewsAndBadges();
          if (!mounted) return;
          setState(() {});
        },
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: _HeaderWithQuickAccess(
                color: Color(branding?.primary ?? 0xFF22B4FF),
                title: _greeting(name),
              ),
            ),
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
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Últimas notícias',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
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
                height: 300,
                child: NewsCarousel(spaceId: _selectedSpaceId),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Comece agora!',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    TextButton(
                      onPressed: () => GoRouter.of(context).push('/modules'),
                      child: const Text('Ver todos'),
                    ),
                  ],
                ),
              ),
            ),
            const ModulesGrid(),
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

class _HeaderWithQuickAccess extends StatelessWidget {
  const _HeaderWithQuickAccess({
    required this.color,
    required this.title,
  });

  final Color color;
  final String title;

  @override
  Widget build(BuildContext context) {
    const headerH = 232.0;
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
