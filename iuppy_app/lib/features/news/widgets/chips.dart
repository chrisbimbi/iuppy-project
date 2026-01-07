// lib/features/news/widgets/chips.dart
import 'package:flutter/material.dart';

// O Chip de Categoria (Pill Style)
class Pill extends StatelessWidget {
  // 🔥 Parâmetro isOutlined é necessário para a compilação.
  const Pill(this.text, {super.key, this.color, required this.isOutlined});
  final String text;
  final Color? color;
  final bool isOutlined; // Necessário para a outra parte do código

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.primary;

    // Define o estilo visual
    const double borderThickness = 1.0;
    // Se for outlined, o fundo é mais suave
    final Color backgroundColor =
        isOutlined ? c.withValues(alpha: 0.05) : c.withValues(alpha: .12);
    final Color borderColor =
        isOutlined ? c.withValues(alpha: .6) : c.withValues(alpha: .35);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      margin: const EdgeInsets.only(right: 6),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8), // Brutalist: menos arredondado
        border: Border.all(
          color: borderColor,
          width: borderThickness,
        ),
      ),
      child: Text(text.toUpperCase(),
          style: TextStyle(
              color: c,
              fontSize: 11,
              fontFamily: 'Space Mono',
              fontWeight: FontWeight.bold)),
    );
  }
}

// Widget auxiliar para os Chips de Notificação (Usado na NewsDetailPage)
class SimpleChip extends StatelessWidget {
  const SimpleChip(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: c,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
