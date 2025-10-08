import 'package:flutter/material.dart';

/// Avatar que mostra a foto quando houver e, do contrário, as iniciais do nome.
/// – name: usado só para gerar iniciais quando avatarUrl estiver vazio.
/// – avatarUrl: URL da foto (se vier no payload).
class Avatar extends StatelessWidget {
  const Avatar(this.avatarUrl, {super.key, this.name, this.size = 20});

  final String? name;
  final String? avatarUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    final hasImg = (avatarUrl ?? '').trim().isNotEmpty;

    return CircleAvatar(
      radius: size / 2,
      backgroundColor: Theme.of(context).colorScheme.secondary.withOpacity(.20),
      backgroundImage: hasImg ? NetworkImage(avatarUrl!) : null,
      child: hasImg
          ? null
          : Text(
              _initials(name ?? ''),
              style: TextStyle(
                fontSize: size * .44,
                fontWeight: FontWeight.w800,
                color: Theme.of(context).colorScheme.onSecondaryContainer,
              ),
            ),
    );
  }

  String _initials(String n) {
    final parts =
        n.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    final first = parts.first.substring(0, 1);
    final last = parts.length > 1 ? parts.last.substring(0, 1) : '';
    return (first + last).toUpperCase();
  }
}
