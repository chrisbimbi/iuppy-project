import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BadgeUnlockedDialog extends StatefulWidget {
  final String badgeName;
  final String badgeIconUrl;
  final String badgeDescription;
  final VoidCallback onDismiss;
  final VoidCallback onViewBadges;

  const BadgeUnlockedDialog({
    super.key,
    required this.badgeName,
    required this.badgeIconUrl,
    required this.badgeDescription,
    required this.onDismiss,
    required this.onViewBadges,
  });

  static Future<void> show(
    BuildContext context, {
    required String name,
    required String iconUrl,
    required String description,
  }) async {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => BadgeUnlockedDialog(
        badgeName: name,
        badgeIconUrl: iconUrl,
        badgeDescription: description,
        onDismiss: () => context.pop(),
        onViewBadges: () {
          context.pop();
          context.push('/gamification');
        },
      ),
    );
  }

  @override
  State<BadgeUnlockedDialog> createState() => _BadgeUnlockedDialogState();
}

class _BadgeUnlockedDialogState extends State<BadgeUnlockedDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.elasticOut,
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  shape: BoxShape.circle,
                ),
                child: widget.badgeIconUrl.isNotEmpty
                    ? Image.network(
                        widget.badgeIconUrl,
                        width: 64,
                        height: 64,
                        errorBuilder: (_, __, ___) => const Icon(
                            Icons.emoji_events,
                            size: 64,
                            color: Colors.amber),
                      )
                    : const Icon(Icons.emoji_events,
                        size: 64, color: Colors.amber),
              ),
              const SizedBox(height: 16),
              const Text(
                'NOVA CONQUISTA!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Space Mono',
                  fontWeight: FontWeight.bold,
                  fontSize: 24,
                  letterSpacing: -1,
                  color: Colors.amber,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.badgeName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.badgeDescription,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onViewBadges,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'VER CONQUISTAS',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: widget.onDismiss,
                child:
                    const Text('FECHAR', style: TextStyle(color: Colors.grey)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
