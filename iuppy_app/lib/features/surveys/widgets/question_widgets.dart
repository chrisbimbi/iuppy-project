import 'package:flutter/material.dart';

class StarRating extends StatelessWidget {
  final int value; // 1..5
  final ValueChanged<int>? onChanged;
  final int max;
  final double size;
  const StarRating({
    super.key,
    required this.value,
    required this.onChanged,
    this.max = 5,
    this.size = 32,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      children: List.generate(max, (i) {
        final idx = i + 1;
        final filled = idx <= value;
        return InkResponse(
          onTap: onChanged != null ? () => onChanged!(idx) : null,
          child: Icon(
            filled ? Icons.star_rounded : Icons.star_border_rounded,
            size: size,
            color: onChanged == null ? Colors.grey : null,
          ),
        );
      }),
    );
  }
}

/// Escala NPS de 0 a 10
class NpsSlider extends StatelessWidget {
  final int value; // 0..10
  final ValueChanged<int>? onChanged;
  const NpsSlider({super.key, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Slider(
          min: 0,
          max: 10,
          divisions: 10,
          label: '$value',
          value: value.toDouble(),
          onChanged: onChanged != null ? (v) => onChanged!(v.round()) : null,
        ),
        const SizedBox(height: 4),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('0', style: TextStyle(fontSize: 12)),
            Text('5', style: TextStyle(fontSize: 12)),
            Text('10', style: TextStyle(fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
                child: Text('Nada provável', style: TextStyle(fontSize: 12))),
            Flexible(
                child: Text('Extremamente provável',
                    textAlign: TextAlign.right,
                    style: TextStyle(fontSize: 12))),
          ],
        )
      ],
    );
  }
}
