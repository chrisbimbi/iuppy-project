import 'package:flutter/material.dart';

class AvatarPile extends StatelessWidget {
  const AvatarPile({
    super.key,
    required this.avatars, // lista de URLs (pode ter vazios)
    this.names = const [], // nomes paralelos (opcional; para iniciais)
    this.size = 28,
    this.maxShown = 5,
    this.onTap,
  });

  final List<String> avatars;
  final List<String> names;
  final double size;
  final int maxShown;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final shown = avatars.take(maxShown).toList();
    return InkWell(
      borderRadius: BorderRadius.circular(size),
      onTap: onTap,
      child: SizedBox(
        height: size,
        width: shown.isEmpty ? 0 : size + (shown.length - 1) * (size * .6),
        child: Stack(
          children: [
            for (int i = 0; i < shown.length; i++)
              Positioned(
                left: i * (size * .6),
                child: _AvatarCircle(
                  url: shown[i],
                  name: i < names.length ? names[i] : '',
                  size: size,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AvatarCircle extends StatelessWidget {
  const _AvatarCircle(
      {required this.url, required this.name, required this.size});
  final String url;
  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initials = _initials(name);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        border: Border.all(
            color: Theme.of(context).scaffoldBackgroundColor, width: 1.5),
        shape: BoxShape.circle,
      ),
      child: ClipOval(
        child: url.isNotEmpty &&
                (url.startsWith('http') || url.startsWith('https'))
            ? Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) {
                  return Container(
                    color: Colors.black12,
                    alignment: Alignment.center,
                    child: Text(
                      initials.isEmpty ? '•' : initials,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: size * 0.42,
                      ),
                    ),
                  );
                },
              )
            : Container(
                color: Colors.black12,
                alignment: Alignment.center,
                child: Text(
                  initials.isEmpty ? '•' : initials,
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: size * 0.42,
                  ),
                ),
              ),
      ),
    );
  }

  String _initials(String name) {
    final parts =
        name.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    final first = parts.first[0];
    final last = parts.length > 1 ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }
}
