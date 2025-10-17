import 'package:flutter/material.dart';

class HeaderOval extends StatelessWidget {
  const HeaderOval({
    super.key,
    required this.color,
    required this.title, // esperado: "Bom dia, Fulano"
    this.trailing,
    this.height = 224, // ↑ um pouco mais alto
  });

  final Color color;
  final String title; // use "Bom dia, Fulano" (1 linha)
  final Widget? trailing;
  final double height;

  @override
  Widget build(BuildContext context) {
    final displayName =
        _extractName(title); // tenta pegar o nome após a vírgula
    final initials = _initials(displayName);

    return Stack(
      children: [
        Container(
          height: height,
          decoration: const BoxDecoration(
            // curva oval
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.elliptical(420, 120),
              bottomRight: Radius.elliptical(420, 120),
            ),
          ),
          foregroundDecoration: BoxDecoration(
            color: color, // cor por cima para manter a curva
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.elliptical(420, 120),
              bottomRight: Radius.elliptical(420, 120),
            ),
          ),
        ),
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 22, 12, 0),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: Colors.white.withOpacity(.25),
                  child: initials.isEmpty
                      ? const Icon(Icons.person, color: Colors.white)
                      : Text(
                          initials,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title, // “Bom dia, Fulano”
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    // “fonte igual e um pouco menor”
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: (Theme.of(context)
                                      .textTheme
                                      .titleLarge
                                      ?.fontSize ??
                                  22) -
                              2,
                        ),
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _extractName(String s) {
    final i = s.indexOf(',');
    if (i >= 0 && i + 1 < s.length) return s.substring(i + 1).trim();
    return s.trim();
  }

  String _initials(String name) {
    final parts =
        name.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    final first = parts.first.substring(0, 1);
    final last = parts.length > 1 ? parts.last.substring(0, 1) : '';
    return (first + last).toUpperCase();
  }
}
