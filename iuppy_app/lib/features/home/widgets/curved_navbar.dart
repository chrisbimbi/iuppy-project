// lib/features/home/widgets/curved_navbar.dart
import 'package:flutter/material.dart';

class CurvedNavBar extends StatelessWidget {
  const CurvedNavBar({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    this.badges = const {},
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  /// índice -> contagem
  final Map<int, int> badges;

  @override
  Widget build(BuildContext context) {
    final bar = NavigationBar(
      backgroundColor: Colors.transparent,
      indicatorShape: const StadiumBorder(),
      selectedIndex: selectedIndex,
      onDestinationSelected: onSelected,
      destinations: [
        const NavigationDestination(
            icon: Icon(Icons.home_outlined), label: 'Início'),
        const NavigationDestination(
            icon: Icon(Icons.bookmark_border), label: 'Favoritos'),
        NavigationDestination(
          icon: _BadgeIcon(
            show: (badges[2] ?? 0) > 0,
            count: badges[2] ?? 0,
            child: const Icon(Icons.notifications_outlined),
          ),
          label: 'Alertas',
        ),
        NavigationDestination(
            icon: _BadgeIcon(
              show: (badges[3] ?? 0) > 0,
              count: badges[3] ?? 0,
              child: const Icon(Icons.chat_bubble_outline),
            ),
            label: 'Chat'),
        const NavigationDestination(icon: Icon(Icons.menu), label: 'Menu'),
      ],
    );

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
            bottomLeft: Radius.circular(16),
            bottomRight: Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: .05),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: bar,
      ),
    );
  }
}

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon(
      {required this.child, required this.show, required this.count});
  final Widget child;
  final bool show;
  final int count;

  @override
  Widget build(BuildContext context) {
    if (!show) return child;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        child,
        Positioned(
          right: -6,
          top: -4,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.error,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              count > 99 ? '99+' : '$count',
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
          ),
        ),
      ],
    );
  }
}
