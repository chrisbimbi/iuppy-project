import 'package:flutter/material.dart';

import '../../news/widgets/web_sheet.dart';

class QuickAccessRow extends StatelessWidget {
  const QuickAccessRow({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      (const _Quick(Icons.language, 'Nosso site', 'https://iuppy.com.br')),
      (const _Quick(
          Icons.camera_alt_outlined, 'Instagram', 'https://instagram.com')),
      (const _Quick(
          Icons.class_outlined, 'Classroom', 'https://classroom.google.com')),
      (const _Quick(Icons.map_outlined, 'Mapa', 'https://maps.google.com')),
    ];

    return SizedBox(
      height: 104,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => _QuickTile(item: items[i]),
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

class _QuickTile extends StatelessWidget {
  const _QuickTile({required this.item});
  final _Quick item;

  @override
  Widget build(BuildContext context) {
    const theme = null;

    return SizedBox(
      width: 120,
      child: Card(
        clipBehavior: Clip.hardEdge,
        child: InkWell(
          onTap: () => openWebSheet(context, item.url, title: item.label),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(item.icon, color: theme.textPrimary),
                const SizedBox(height: 8),
                Text(
                  item.label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        fontFamily: 'Space Mono',
                        color: theme.textPrimary,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
