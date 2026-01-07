import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
// reaproveita o mesmo card

class ModulesAllPage extends ConsumerWidget {
  const ModulesAllPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d,
          orElse: () => null,
        );
    final enabled = settings?.enabledModules ?? {};

    final items = <_Item>[
      _Item('surveys', 'Enquetes', Icons.poll_outlined, '/surveys'),
      _Item(
          'activities', 'Atividades', Icons.assignment_outlined, '/activities'),
      _Item('news', 'Comunicados', Icons.campaign_outlined, '/news'),
    ].where((m) => enabled.contains(m.key)).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // GRID
          GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 120, 16, 40),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, // Cards maiores
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.1),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final it = items[i];
              return GestureDetector(
                onTap: () => GoRouter.of(context).push(it.route),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(it.icon, size: 32, color: Colors.black87),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        it.label.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontFamily: 'Space Mono',
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
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
                        icon:
                            const Icon(Icons.arrow_back, color: Colors.black87),
                        onPressed: () {
                          if (Navigator.of(context).canPop()) {
                            Navigator.of(context).pop();
                          } else {
                            context.go('/home');
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'MÓDULOS',
                        style: TextStyle(
                          fontFamily: 'Space Mono',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -1.0,
                          color: Colors.black87,
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

class _Item {
  final String key, label, route;
  final IconData icon;
  _Item(this.key, this.label, this.icon, this.route);
}
