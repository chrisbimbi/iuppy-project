import 'dart:ui';
import 'package:flutter/material.dart';

/// Simple glass effect widget using BackdropFilter
/// Provides a frosted glass appearance without custom shaders
class SimpleGlass extends StatelessWidget {
  final Widget child;
  final double blur;
  final Color tint;
  final double opacity;

  const SimpleGlass({
    super.key,
    required this.child,
    this.blur = 10.0,
    this.tint = Colors.white,
    this.opacity = 0.1,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.zero, // Brutalist = no rounded corners
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          decoration: BoxDecoration(
            color: tint.withValues(alpha: opacity),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.2),
              width: 1,
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
