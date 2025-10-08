import 'package:flutter/material.dart';
import 'reactions_meta.dart'; // REACTIONS, reactionIcon

class ReactionPalette extends StatelessWidget {
  const ReactionPalette({
    super.key,
    required this.onPick,
    this.currentKind,
  });

  final void Function(String kind) onPick;
  final String? currentKind;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    return Material(
      elevation: 12,
      color: t.colorScheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: REACTIONS.map((r) {
            final k = r.kind;
            final selected = currentKind == k;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: InkWell(
                onTap: () => onPick(k),
                borderRadius: BorderRadius.circular(24),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: selected
                        ? t.colorScheme.primaryContainer
                        : Colors.transparent,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    reactionIcon(k),
                    size: selected ? 26 : 22,
                    color: selected
                        ? t.colorScheme.onPrimaryContainer
                        : t.colorScheme.onSurface,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
