import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../news/widgets/web_sheet.dart';

class QuickAccessRow extends StatelessWidget {
  const QuickAccessRow({super.key});

  @override
  Widget build(BuildContext context) {
    final items = const [
      (_Quick(Icons.language, 'Nosso site', 'https://iuppy.com.br')),
      (_Quick(Icons.camera_alt_outlined, 'Instagram', 'https://instagram.com')),
      (_Quick(
          Icons.class_outlined, 'Classroom', 'https://classroom.google.com')),
      (_Quick(Icons.map_outlined, 'Mapa', 'https://maps.google.com')),
    ];

    return SizedBox(
      height: 104,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => _GlassSquare(item: items[i]),
      ),
    );
  }
}

class _Quick {
  final IconData icon;
  final String label;
  final String url;
  const _Quick(this.icon, this.label, this.url);
}

class _GlassSquare extends StatelessWidget {
  const _GlassSquare({required this.item});
  final _Quick item;

  @override
  Widget build(BuildContext context) {
    final surface = Colors.white.withOpacity(.08); // BEEM suave
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Material(
          color: surface,
          child: InkWell(
            onTap: () => openWebSheet(context, item.url, title: item.label),
            child: Container(
              width: 120,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(.16)),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(item.icon),
                  const SizedBox(height: 8),
                  Text(
                    item.label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
