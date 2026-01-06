import 'package:flutter/material.dart';

class Skeleton extends StatefulWidget {
  final double height;
  final double width;
  final double borderRadius;

  const Skeleton({
    super.key, 
    this.height = 16, 
    this.width = double.infinity, 
    this.borderRadius = 8
  });

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                Colors.grey.shade200,
                Colors.grey.shade100,
                Colors.grey.shade200,
              ],
              stops: [
                0.0,
                0.5 + 0.5 * _animation.value, // Move gradient
                1.0,
              ],
              // A simpler shimmer effect using alignment or transform approach is also fine
              // But let's stick to a simple color pulse for stability if gradient calc is tricky
            ),
             // Fallback to simple pulse if gradient is complex to animate perfectly in this snippet
             color: Colors.grey.shade200, 
          ),
          child: Opacity(
              opacity: 0.5 + 0.5 * (0.5 * (1 + _animation.value)).clamp(0.0, 1.0), // Pulse opacity
              child: Container(color: Colors.white.withOpacity(0.5)),
          ),
        );
      },
    );
  }
}
