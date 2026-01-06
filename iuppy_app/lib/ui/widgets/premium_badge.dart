import 'package:flutter/material.dart';

class PremiumBadge extends StatelessWidget {
  final int count;
  final bool
      isCompact; // True para usar em ícones (sino), False para Menu (Pill)

  const PremiumBadge({
    super.key,
    required this.count,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();

    // Modo Compacto (Bolinha no ícone)
    if (isCompact) {
      return Positioned(
        top: 8,
        right: 8,
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFE53935), // Vermelho Alerta
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 1.5),
          ),
          constraints: const BoxConstraints(
            minWidth: 10,
            minHeight: 10,
          ),
        ),
      );
    }

    // Modo Full (Pill Shape para Menu Lateral)
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFE53935),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 2,
            offset: const Offset(0, 1),
          )
        ],
      ),
      constraints: const BoxConstraints(minWidth: 20),
      child: Center(
        widthFactor: 1.0,
        child: Text(
          count > 99 ? '99+' : count.toString(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            height: 1.1,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
