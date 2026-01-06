import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CircularQuickAccess extends StatelessWidget {
  const CircularQuickAccess({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _QuickAccessButton(
            icon: Icons.map_outlined,
            label: 'Jornada',
            onTap: () => context.push('/journeys'),
            borderStyle: _BorderStyle.dashedBlue,
          ),
          _QuickAccessButton(
            icon: Icons.language,
            label: 'Site',
            onTap: () => context.push('/web'),
            borderStyle: _BorderStyle.gradientOrangePink,
          ),
          _QuickAccessButton(
            icon: Icons.camera_alt,
            label: 'Instagram',
            onTap: () {}, // TODO: Add Instagram link
            borderStyle: _BorderStyle.gradientOrangePink,
          ),
          _QuickAccessButton(
            icon: Icons.credit_card,
            label: 'VR Refeição',
            onTap: () => context.push('/benefits'),
            borderStyle: _BorderStyle.gradientOrangePink,
          ),
        ],
      ),
    );
  }
}

enum _BorderStyle {
  dashedBlue,
  gradientOrangePink,
}

class _QuickAccessButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final _BorderStyle borderStyle;

  const _QuickAccessButton({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.borderStyle,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          // Circle with gradient or dashed border
          SizedBox(
            width: 70,
            height: 70,
            child: borderStyle == _BorderStyle.dashedBlue
                ? _DashedBorderCircle(
                    child: Icon(icon, color: Colors.blue, size: 28),
                  )
                : _GradientBorderCircle(
                    child: Icon(icon, color: Colors.grey.shade700, size: 28),
                  ),
          ),
          const SizedBox(height: 8),
          // Label
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade700,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _GradientBorderCircle extends StatelessWidget {
  final Widget child;

  const _GradientBorderCircle({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: [
            Color(0xFFFF6B35), // Orange
            Color(0xFFE91E63), // Pink
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(2), // Thinner border
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _DashedBorderCircle extends StatelessWidget {
  final Widget child;

  const _DashedBorderCircle({required this.child});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DashedCirclePainter(),
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFE3F2FD), // Light blue background
          shape: BoxShape.circle,
        ),
        child: Center(child: child),
      ),
    );
  }
}

class _DashedCirclePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.blue
      ..strokeWidth = 1.5 // Thinner dashed border
      ..style = PaintingStyle.stroke;

    final radius = size.width / 2;
    final center = Offset(radius, radius);

    // Draw dashed circle
    const dashWidth = 5.0;
    const dashSpace = 4.0;
    double startAngle = 0;

    while (startAngle < 360) {
      final endAngle = startAngle + dashWidth;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius - 1.25),
        _degreesToRadians(startAngle),
        _degreesToRadians(dashWidth),
        false,
        paint,
      );
      startAngle = endAngle + dashSpace;
    }
  }

  double _degreesToRadians(double degrees) {
    return degrees * (3.141592653589793 / 180.0);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
