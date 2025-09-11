import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';

class GlassSearchAndSpaces extends ConsumerWidget {
  const GlassSearchAndSpaces({
    super.key,
    this.hintText = 'Buscar (em cache)',
    this.onQueryChanged,
    required this.selectedSpaceId,
    required this.onSpaceChanged,
  });

  final String hintText;
  final ValueChanged<String>? onQueryChanged;
  final String? selectedSpaceId;
  final ValueChanged<String?> onSpaceChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        _GlassSearchField(
          hintText: hintText,
          onChanged: onQueryChanged,
        ),
        const SizedBox(height: 12),
        _SpacesChips(
          selected: selectedSpaceId,
          onSelect: onSpaceChanged,
        ),
      ],
    );
  }
}

class _GlassSearchField extends StatelessWidget {
  const _GlassSearchField({required this.hintText, this.onChanged});
  final String hintText;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(14);
    return ClipRRect(
      borderRadius: radius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: radius,
            color: Colors.grey.shade200,
            border: Border.all(
              color: Colors.grey.shade200,
              width: 1,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              const Icon(Icons.search),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  onChanged: onChanged,
                  decoration: InputDecoration(
                    hintText: hintText,
                    border: InputBorder.none,
                  ),
                ),
              ),
              // botão extra (ex.: limpar)
              // IconButton(icon: const Icon(Icons.close), onPressed: () {})
            ],
          ),
        ),
      ),
    );
  }
}

class _SpacesChips extends ConsumerWidget {
  const _SpacesChips({required this.selected, required this.onSelect});
  final String? selected;
  final ValueChanged<String?> onSelect;

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
        return Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Todos'),
              selected: selected == null,
              onSelected: (_) => onSelect(null),
            ),
            ...list.map(
              (s) => ChoiceChip(
                label: Text((s['name'] ?? 'Space').toString()),
                selected: selected == (s['id'] ?? '').toString(),
                onSelected: (_) => onSelect((s['id'] ?? '').toString()),
              ),
            ),
          ],
        );
      },
    );
  }
}
