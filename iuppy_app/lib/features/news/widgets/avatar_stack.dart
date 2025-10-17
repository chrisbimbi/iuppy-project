import 'package:flutter/material.dart';
import 'avatar.dart';

/// items: lista de ({name, avatar})
class AvatarStack extends StatelessWidget {
  const AvatarStack({
    super.key,
    required this.items,
    this.size = 20,
    this.maxShown = 3,
    this.totalCount, // total de interações p/ a etiqueta
    this.showCounter = true,
    this.onTap,
  });

  final List<({String name, String avatar})> items;
  final double size;
  final int maxShown;
  final int? totalCount;
  final bool showCounter;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final shown = items.take(maxShown).toList();
    final overlap = size * 0.45;
    final totalShown = shown.length;
    final stackWidth =
        totalShown <= 0 ? size : size + (totalShown - 1) * (size - overlap);

    // Regra: se total <= maxShown → número real; senão → "+x"
    String? label;
    if (showCounter && totalCount != null) {
      final tot = totalCount!.clamp(0, 1 << 31);
      if (tot <= maxShown) {
        label = '$tot';
      } else {
        final hidden = tot - maxShown;
        label = '+$hidden';
      }
    }

    final avatarStack = SizedBox(
      width: stackWidth,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (int i = 0; i < shown.length; i++)
            Positioned(
              left: i * (size - overlap),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    width: 1.5,
                  ),
                ),
                child: Avatar(
                  shown[i].avatar,
                  name: shown[i].name,
                  size: size,
                ),
              ),
            ),
        ],
      ),
    );

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        avatarStack,
        if (label != null) ...[
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium,
            overflow: TextOverflow.fade,
            softWrap: false,
          ),
        ],
      ],
    );

    if (onTap == null) return content;

    return Semantics(
      button: true,
      label: 'Ver lista',
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(size),
        child: content,
      ),
    );
  }
}
