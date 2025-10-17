import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart';

class ModulesGrid extends ConsumerWidget {
  const ModulesGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d,
          orElse: () => null,
        );
    final enabled = settings?.enabledModules ?? {};
    final badges = ref.watch(homeBadgesProvider);

    final items = <_Module>[
      _Module('surveys', 'Enquetes', Icons.poll_outlined, '/surveys',
          badge: badges.surveysPending),
      _Module(
          'activities', 'Atividades', Icons.assignment_outlined, '/activities'),
      _Module('news', 'Comunicados', Icons.campaign_outlined, '/news',
          badge: badges.newsNew),
    ].where((m) => enabled.contains(m.key)).toList();

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: .98,
        ),
        delegate: SliverChildBuilderDelegate(
          (ctx, i) => _GlassModuleCard(mod: items[i]),
          childCount: items.length,
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

class _GlassModuleCard extends StatelessWidget {
  const _GlassModuleCard({required this.mod});
  final _Module mod;

  @override
  Widget build(BuildContext context) {
    final surface = Colors.white.withOpacity(.08);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Material(
          color: surface,
          child: InkWell(
            onTap: () => GoRouter.of(context).push(mod.route),
            child: Stack(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.white.withOpacity(.16)),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(mod.icon),
                      const SizedBox(height: 8),
                      Text(mod.label, textAlign: TextAlign.center),
                    ],
                  ),
                ),
                if (mod.badge > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.error,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        mod.badge > 99 ? '99+' : '${mod.badge}',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 11),
                      ),
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
