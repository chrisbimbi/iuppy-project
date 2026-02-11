import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';

class GlassSearchAndSpaces extends ConsumerWidget {
  const GlassSearchAndSpaces({
    super.key,
    this.hintText = 'Buscar no app',
    this.onQueryChanged,
    this.onSearch,
    required this.selectedSpaceId,
    required this.onSpaceChanged,
  });

  final String hintText;
  final ValueChanged<String>? onQueryChanged;
  final ValueChanged<String>? onSearch;
  final String? selectedSpaceId;
  final ValueChanged<String?> onSpaceChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        _GlassSearchField(
          hintText: hintText,
          onChanged: onQueryChanged,
          onSubmitted: onSearch,
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

class _GlassSearchField extends HookConsumerWidget {
  const _GlassSearchField(
      {required this.hintText, this.onChanged, this.onSubmitted});
  final String hintText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController();
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
              GestureDetector(
                onTap: () => onSubmitted?.call(controller.text),
                child: const Icon(Icons.search),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: controller,
                  onChanged: (val) {
                    onChanged?.call(val);
                  },
                  onSubmitted: onSubmitted,
                  textInputAction: TextInputAction.search,
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
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _SpaceChip(
                label: 'Todos',
                isSelected: selected == null,
                onTap: () => onSelect(null),
              ),
              ...list.map(
                (s) => Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: _SpaceChip(
                    label: (s['name'] ?? 'Space').toString(),
                    isSelected: selected == (s['id'] ?? '').toString(),
                    onTap: () => onSelect((s['id'] ?? '').toString()),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SpaceChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _SpaceChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).primaryColor;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor : Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: isSelected ? Colors.transparent : Colors.grey.shade200,
            width: 1,
          ),
          boxShadow: [
            if (!isSelected)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            if (isSelected)
              BoxShadow(
                color: primaryColor.withValues(alpha: 0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
          ],
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey.shade600,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
