import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../home/widgets/modules_grid.dart'; // reaproveita o mesmo card

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
      appBar: AppBar(title: const Text('Módulos')),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: .98),
        itemCount: items.length,
        itemBuilder: (_, i) {
          final it = items[i];
          return GestureDetector(
            onTap: () => GoRouter.of(context).push(it.route),
            child: Card(
              elevation: 1,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(it.icon),
                  const SizedBox(height: 8),
                  Text(it.label, textAlign: TextAlign.center),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _Item {
  final String key, label, route;
  final IconData icon;
  _Item(this.key, this.label, this.icon, this.route);
}
