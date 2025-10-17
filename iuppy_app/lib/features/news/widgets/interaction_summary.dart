import 'package:flutter/material.dart';
import 'avatar_pile.dart';
import 'reactions_meta.dart';

class InteractionSummary extends StatelessWidget {
  const InteractionSummary({
    super.key,
    required this.reactsByType,
    required this.totalReacts,
    required this.comments,
    required this.shares,
    required this.reactorsSample,
    this.myReaction,
    this.onTapReactions,
    this.onTapComments,
    this.onTapShares,
  });

  final Map<String, int> reactsByType;
  final int totalReacts;
  final int comments;
  final int shares;

  // record nomeado
  final List<({String name, String avatar})> reactorsSample;
  final String? myReaction;

  final VoidCallback? onTapReactions;
  final VoidCallback? onTapComments;
  final VoidCallback? onTapShares;

  @override
  Widget build(BuildContext context) {
    // Top 3 reações
    final top = reactsByType.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    var topKinds = top.take(3).map((e) => e.key).toList();

    // não repetir minha própria reação
    if (myReaction != null && myReaction!.isNotEmpty) {
      topKinds = topKinds.where((k) => k != myReaction).toList();
    }

    // extrai avatares (até 5)
    final avatars =
        reactorsSample.map((r) => r.avatar).where((s) => s.isNotEmpty).toList();
    // caso seu AvatarPile aceite items:
    // final items = reactorsSample;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        children: [
          // Avatares agrupados
          AvatarPile(
            // items: items, // se a sua versão aceitar items
            avatars: avatars,
            size: 28,
            maxShown: 5,
            onTap: onTapReactions,
          ),
          const SizedBox(width: 12),

          // Mini-ícones das reações mais usadas (esconde se vazio)
          if (topKinds.isNotEmpty) _TopReactionsIcons(kinds: topKinds),

          const Spacer(),

          // Contadores compactos
          _IconCount(
            icon: Icons.favorite_border_rounded,
            count: totalReacts,
            onTap: onTapReactions,
            tooltip: 'Reações',
          ),
          const SizedBox(width: 14),
          _IconCount(
            icon: Icons.mode_comment_outlined,
            count: comments,
            onTap: onTapComments,
            tooltip: 'Comentários',
          ),
          const SizedBox(width: 14),
          _IconCount(
            icon: Icons.ios_share_rounded,
            count: shares,
            onTap: onTapShares,
            tooltip: 'Compartilhamentos',
          ),
        ],
      ),
    );
  }
}

class _TopReactionsIcons extends StatelessWidget {
  const _TopReactionsIcons({required this.kinds});
  final List<String> kinds;

  @override
  Widget build(BuildContext context) {
    const double size = 18;
    final overlap = size * 0.45;
    final total = kinds.length;
    final width = total <= 0 ? 0.0 : size + (total - 1) * (size - overlap);

    return SizedBox(
      width: width,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          for (int i = 0; i < kinds.length; i++)
            Positioned(
              left: i * (size - overlap),
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    width: 1.5,
                  ),
                ),
                child: Icon(reactionIcon(kinds[i]), size: size * 0.72),
              ),
            ),
        ],
      ),
    );
  }
}

class _IconCount extends StatelessWidget {
  const _IconCount({
    required this.icon,
    required this.count,
    this.onTap,
    this.tooltip,
  });

  final IconData icon;
  final int count;
  final VoidCallback? onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final text = _compact(count);
    final t = Theme.of(context);
    return Semantics(
      button: onTap != null,
      label: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18),
              const SizedBox(width: 6),
              Text(
                text,
                style: t.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _compact(int n) {
    if (n >= 1000000) {
      final v = n / 1000000;
      return '${v.truncateToDouble() == v ? v.toStringAsFixed(0) : v.toStringAsFixed(1)} mi';
    }
    if (n >= 1000) {
      final v = n / 1000;
      return '${v.truncateToDouble() == v ? v.toStringAsFixed(0) : v.toStringAsFixed(1)} mil';
    }
    return n.toString();
  }
}
