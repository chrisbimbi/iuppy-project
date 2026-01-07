// lib/features/home/home_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/home/widgets/glass_search_and_spaces.dart';
import 'package:iuppy_app/features/search/search_bottom_sheet.dart';
import 'package:iuppy_app/push_service.dart';
import 'package:iuppy_app/features/chat/chat_service.dart';

import '../../core/providers.dart';

import '../menu/menu_drawer.dart';

import '../surveys/survey_providers.dart';
import '../journeys/journey_providers.dart';
import 'widgets/home_header.dart';
import 'widgets/circular_quick_access.dart';
import 'widgets/news_carousel.dart';
import 'widgets/home_journeys_slider.dart';

import 'widgets/curved_navbar.dart';
import 'home_loading_provider.dart';

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

  late final ProviderContainer _c;
  bool _alive = true;

  @override
  void initState() {
    super.initState();
    _c = ProviderScope.containerOf(context, listen: false);

    // Register Push Handler one-time
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setupPushHandler();
    });
  }

  void _setupPushHandler() {
    PushService.instance.setNotificationRefreshHandler((message) async {
      if (!_alive) return;

      // Optimized: If chat message, only refresh chat data
      if (message?.data['type'] == 'chat') {
        _c.invalidate(unreadCountProvider);
        try {
          final chatAsync = await _c.read(unreadCountProvider.future);
          final total = chatAsync['total'] ?? 0;
          await PushService.instance.updateBadge(total as int);
        } catch (e) {
          debugPrint('Error updating badge for chat push: $e');
        }
        return;
      }

      // Generic Refresh
      _c.read(homeBootstrapProvider.notifier).refresh();

      // Force refresh chat specifically for non-chat pushes (just in case) or general refresh
      _c.invalidate(unreadCountProvider);

      // Update App Badge
      try {
        final chatAsync = await _c.read(unreadCountProvider.future);
        final total = chatAsync['total'] ?? 0;
        await PushService.instance.updateBadge(total as int);
      } catch (e) {
        debugPrint('Error updating badge: $e');
      }
    });
  }

  @override
  void dispose() {
    _alive = false;
    super.dispose();
  }

  void _openSearch(String query) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SearchBottomSheet(initialQuery: query),
    );
  }

  @override
  Widget build(BuildContext context) {
    // 🔥 Watch the Bootstrap Provider
    final bootstrapState = ref.watch(homeBootstrapProvider);

    // If Loading, show Fake Splash Screen
    if (bootstrapState == HomeStartupState.loading) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Use a standard loader or asset logo if available.
              // Assuming a simple CircularProgressIndicator for now,
              // styled to look like a splash.
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Carregando...', style: TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    if (bootstrapState == HomeStartupState.error) {
      // Consider showing a retry button
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text('Erro ao carregar dados.'),
              TextButton(
                onPressed: () =>
                    ref.read(homeBootstrapProvider.notifier).refresh(),
                child: const Text('Tentar Novamente'),
              )
            ],
          ),
        ),
      );
    }

    // === READY STATE ===

    final badges = ref.watch(homeBadgesProvider);
    final hasAnyNews = ref
        .watch(_hasAnyNewsCachedProvider)
        .maybeWhen(data: (v) => v, orElse: () => true);

    var unreadNews = ref
        .watch(unreadCountersProvider)
        .maybeWhen(data: (d) => d.total, orElse: () => badges.newsNew);
    if (!hasAnyNews) unreadNews = 0;

    final unreadForms = ref
        .watch(formsBadgesProvider)
        .maybeWhen(data: (v) => v, orElse: () => badges.formsNew);
    final unreadSurveys = ref
        .watch(newSurveysCountProvider)
        .maybeWhen(data: (v) => v, orElse: () => 0);

    final unreadJourneys = ref
        .watch(journeyBadgesProvider)
        .maybeWhen(data: (v) => v, orElse: () => 0);

    final totalAlerts =
        unreadNews + unreadForms + unreadSurveys + unreadJourneys;

    // Watch chatBadgeProvider and pass badge to CurvedNavbar.
    final chatCount = ref.watch(chatBadgeProvider).value ?? 0;

    final navBarBadges = <int, int>{};
    if (totalAlerts > 0) {
      navBarBadges[2] = totalAlerts; // Notifications index = 2
    }
    if (chatCount > 0) {
      navBarBadges[3] = chatCount; // Chat index = 3
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: Colors.grey.shade50,
      drawer: const MenuDrawer(),
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
              GoRouter.of(context).push('/chat');
              ref.invalidate(
                  chatBadgeProvider); // Invalidate chat badge when chat is opened
              break;
            case 4:
              _scaffoldKey.currentState?.openDrawer();
              break;
          }
        },
        badges: navBarBadges,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Use the bootstrap notifier to refresh everything properly
          await ref.read(homeBootstrapProvider.notifier).refresh();
        },
        child: ListView(
          children: [
            // Header with avatar, greeting, and XP
            const HomeHeader(),

            // Circular quick access buttons
            const CircularQuickAccess(),

            // Search and Spaces
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: GlassSearchAndSpaces(
                selectedSpaceId: _selectedSpaceId,
                onSpaceChanged: (id) => setState(() => _selectedSpaceId = id),
                onQueryChanged: (q) {},
                onSearch: _openSearch,
              ),
            ),

            const SizedBox(height: 16),

            // News Carousel
            NewsCarousel(spaceId: _selectedSpaceId),

            const SizedBox(height: 16),

            // Journeys progress
            const HomeJourneysSlider(),

            // Modules section
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Comece agora',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton(
                    onPressed: () => GoRouter.of(context).push('/modules'),
                    child: const Text('Ver todos'),
                  ),
                ],
              ),
            ),

            // Modules slider
            Consumer(
              builder: (context, ref, _) {
                final settings = ref.watch(companySettingsProvider).maybeWhen(
                      data: (d) => d,
                      orElse: () => null,
                    );
                final enabled = settings?.enabledModules ?? {};
                final badges = ref.watch(homeBadgesProvider);

                final journeyProgress =
                    ref.watch(journeyProgressProvider).asData?.value ?? [];
                final hasJourneys = journeyProgress.isNotEmpty;

                final items = <_Module>[
                  _Module(
                      'surveys', 'Enquetes', Icons.poll_outlined, '/surveys',
                      badge: badges.surveysPending),
                  _Module('activities', 'Atividades', Icons.assignment_outlined,
                      '/activities'),
                  _Module(
                      'news', 'Comunicados', Icons.campaign_outlined, '/news',
                      badge: badges.newsNew),
                  _Module('forms', 'Formulários', Icons.assignment_outlined,
                      '/forms',
                      badge: badges.formsNew),
                  _Module('vacations', 'Férias', Icons.beach_access_outlined,
                      '/vacations'),
                  _Module('performance', 'Performance',
                      Icons.trending_up_outlined, '/performance'),
                  if (hasJourneys)
                    _Module(
                        'journeys', 'Jornadas', Icons.map_outlined, '/journeys',
                        badge: unreadJourneys),
                  // 🔥 NR-1 Module
                  _Module('nr1', 'NR-1', Icons.security, '/modules/nr1',
                      badge: 0), // Badge logic can be added later
                ].where((m) => enabled.contains(m.key)).toList();

                return SizedBox(
                  height: 120,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final mod = items[index];
                      return Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: SizedBox(
                          width: 140,
                          child: _ModuleCard(module: mod),
                        ),
                      );
                    },
                  ),
                );
              },
            ),

            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }
}

class _Module {
  final String key;
  final String label;
  final IconData icon;
  final String route;
  final int badge;
  _Module(this.key, this.label, this.icon, this.route, {this.badge = 0});
}

class _ModuleCard extends StatelessWidget {
  final _Module module;

  const _ModuleCard({required this.module});

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return GestureDetector(
      onTap: () => GoRouter.of(context).push(module.route),
      child: Container(
        decoration: BoxDecoration(
          color: module.key == 'journeys' ? primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    module.icon,
                    size: 32,
                    color:
                        module.key == 'journeys' ? Colors.white : primaryColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    module.label,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: module.key == 'journeys'
                          ? Colors.white
                          : Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
            if (module.badge > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

String _greeting(String name) {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
