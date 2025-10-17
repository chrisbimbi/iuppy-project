import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';

class SpaceFilterChips extends ConsumerWidget {
  const SpaceFilterChips(
      {super.key, required this.selected, required this.onChanged});
  final String? selected;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: () async {
        final cached = await ref.read(spacesRepoProvider).getCached();
        if (cached.isNotEmpty) return cached;
        return ref.read(spacesRepoProvider).fetchAndCache();
      }(),
      builder: (ctx, snap) {
        final list = snap.data ?? const <Map<String, dynamic>>[];
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              ChoiceChip(
                label: const Text('Todos'),
                selected: selected == null,
                onSelected: (_) => onChanged(null),
              ),
              const SizedBox(width: 8),
              ...list.map((s) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(s['name'] as String? ?? 'Space'),
                      selected: selected == s['id'],
                      onSelected: (_) => onChanged(s['id'] as String),
                    ),
                  )),
            ],
          ),
        );
      },
    );
  }
}
