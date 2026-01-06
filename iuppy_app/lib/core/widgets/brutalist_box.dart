import 'package:flutter/material.dart';

/// Brutalist container with thick borders and hard shadows
/// Core component of Crystalline Brutalism design
class BrutalistBox extends StatelessWidget {
  final Widget child;
  final Color borderColor;
  final double borderWidth;
  final Color? backgroundColor;
  final EdgeInsetsGeometry padding;
  final double shadowOffset;

  const BrutalistBox({
    super.key,
    required this.child,
    this.borderColor = Colors.black,
    this.borderWidth = 3.0,
    this.backgroundColor,
    this.padding = const EdgeInsets.all(16),
    this.shadowOffset = 4.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.transparent,
        boxShadow: [
          BoxShadow(
            color: borderColor,
            offset: Offset(shadowOffset, shadowOffset),
            blurRadius: 0, // Hard shadow, no blur
          ),
        ],
      ),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: backgroundColor ?? const Color(0xFF0A0A0A),
          border: Border.all(
            color: borderColor,
            width: borderWidth,
          ),
        ),
        child: child,
      ),
    );
  }
}
