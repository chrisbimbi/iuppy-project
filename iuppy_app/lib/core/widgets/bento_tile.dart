import 'package:flutter/material.dart';
import 'simple_glass.dart';
import 'brutalist_box.dart';

/// Bento Tile - Combined glass + brutalist container
/// Main building block for Crystalline Brutalism UI
class BentoTile extends StatelessWidget {
  final Widget child;
  final Color? backgroundColor;
  final Color? borderColor;
  final double borderWidth;
  final bool useGlass;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;

  const BentoTile({
    super.key,
    required this.child,
    this.onTap,
    this.backgroundColor,
    this.borderColor,
    this.borderWidth = 1.0,
    this.useGlass = false,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    // Content with padding
    Widget innerContent = Padding(
      padding: padding ?? const EdgeInsets.all(16),
      child: child,
    );

    Widget content = BrutalistBox(
      borderColor: borderColor ?? Colors.black,
      borderWidth: borderWidth,
      backgroundColor: backgroundColor ?? const Color(0xFF0A0A0A),
      child: innerContent,
    );

    if (useGlass) {
      content = SimpleGlass(
        blur: 10.0,
        tint: Colors.white,
        opacity: 0.05,
        child: content,
      );
    }

    if (onTap != null) {
      content = GestureDetector(
        onTap: onTap,
        child: content,
      );
    }

    return content;
  }
}
