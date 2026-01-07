import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/journeys/journey_providers.dart';

class ModulesPage extends ConsumerWidget {
  const ModulesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d,
          orElse: () => null,
        );
    final enabled = settings?.enabledModules ?? {};
    final badges = ref.watch(homeBadgesProvider);

    final journeyProgress =
        ref.watch(journeyProgressProvider).asData?.value ?? [];
    final hasJourneys = journeyProgress.isNotEmpty;

    // Define all possible modules
    final allModules = [
      _ModuleItem(
        key: 'news',
        label: 'Comunicados',
        icon: Icons.campaign_outlined,
        route: '/news',
        badge: badges.newsNew,
        color: Colors.blue,
      ),
      _ModuleItem(
        key: 'surveys',
        label: 'Enquetes',
        icon: Icons.poll_outlined,
        route: '/surveys',
        badge: badges.surveysPending,
        color: Colors.purple,
      ),
      _ModuleItem(
        key: 'forms',
        label: 'Formulários',
        icon: Icons.assignment_outlined,
        route: '/forms',
        badge: badges.formsNew,
        color: Colors.orange,
      ),
      if (hasJourneys)
        _ModuleItem(
          key: 'journeys',
          label: 'Jornadas',
          icon: Icons.map_outlined,
          route: '/journeys',
          badge: journeyProgress
              .where((j) => ((j['progress'] as num?)?.toDouble() ?? 0.0) < 1.0)
              .length, // Incomplete journeys count

          color: Colors.green,
        ),
      _ModuleItem(
        key: 'activities', // Placeholder key if Activities is separate
        label: 'Atividades',
        icon: Icons.task_alt,
        route: '/activities', // Make sure this route exists or points somewhere
        badge: 0,
        color: Colors.teal,
      ),
      _ModuleItem(
        key: 'nr1',
        label: 'NR-1',
        icon: Icons.security,
        route: '/modules/nr1', // Ensure this route matches router
        badge: 0,
        color: Colors.redAccent,
      ),
      // Add other modules here as they become available
    ];

    final visibleModules = allModules
        .where((m) =>
            enabled.contains(m.key) ||
            m.key == 'activities' && enabled.contains('activities'))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Todos os Módulos'),
      ),
      body: visibleModules.isEmpty
          ? const Center(child: Text('Nenhum módulo habilitado.'))
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.1,
              ),
              itemCount: visibleModules.length,
              itemBuilder: (context, index) {
                final module = visibleModules[index];
                return _ModuleCard(module: module);
              },
            ),
    );
  }
}

class _ModuleItem {
  final String key;
  final String label;
  final IconData icon;
  final String route;
  final int badge;
  final Color color;

  _ModuleItem({
    required this.key,
    required this.label,
    required this.icon,
    required this.route,
    required this.badge,
    required this.color,
  });
}

class _ModuleCard extends StatelessWidget {
  final _ModuleItem module;

  const _ModuleCard({required this.module});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => context.push(module.route),
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: module.color.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      module.icon,
                      size: 32,
                      color: module.color,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    module.label,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            if (module.badge > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${module.badge}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
