import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';

class CrystallineModulesGrid extends ConsumerWidget {
  const CrystallineModulesGrid({super.key});

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
      _Module('journeys', 'Jornadas', Icons.map_outlined, '/journeys'),
    ].where((m) => enabled.contains(m.key)).toList();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.2,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final mod = items[index];

        return GestureDetector(
          onTap: () => GoRouter.of(context).push(mod.route),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 20, bottom: 12),
                      child: Icon(
                        mod.icon,
                        size: 32,
                        color: Colors.grey.shade400, // Icon color from image
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        mod.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                        ),
                      ),
                    ),
                    if (mod.key == 'surveys') ...[
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          '2 não lidos', // Mock data to match image
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade400,
                          ),
                        ),
                      ),
                    ],
                    if (mod.key == 'activities') ...[
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Text(
                          'Solicitações', // Mock data to match image
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade400,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (mod.badge > 0)
                  Positioned(
                    top: 20,
                    right: 20,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444), // Red dot
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Module {
  final String key;
  final String title;
  final IconData icon;
  final String route;
  final int badge;

  _Module(this.key, this.title, this.icon, this.route, {this.badge = 0});
}
