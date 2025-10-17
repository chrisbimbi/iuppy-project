import 'package:flutter/material.dart';
import 'avatar.dart';

class CommentPreview {
  final String text;
  final String name;
  final String avatar;
  CommentPreview(
      {required this.text, required this.name, required this.avatar});
}

/// Lista os comentários aprovados (prévia) + botão para escrever
Future<void> openCommentsSheet(
  BuildContext context, {
  required List<CommentPreview> previews,
  required Future<void> Function() onCompose,
}) async {
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (ctx) {
      final insets = MediaQuery.of(ctx).viewInsets.bottom;
      return Padding(
        padding: EdgeInsets.fromLTRB(16, 12, 16, insets + 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text('Comentários', style: Theme.of(ctx).textTheme.titleMedium),
                const Spacer(),
                TextButton.icon(
                  onPressed: onCompose,
                  icon: const Icon(Icons.add_comment_outlined),
                  label: const Text('Escrever'),
                ),
              ],
            ),
            const SizedBox(height: 6),
            if (previews.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Ainda não há comentários aprovados.'),
              )
            else
              ...previews.map(
                (c) => ListTile(
                  leading: Avatar(c.avatar, name: c.name),
                  title: Text(c.name,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(c.text,
                      maxLines: 4, overflow: TextOverflow.ellipsis),
                ),
              ),
          ],
        ),
      );
    },
  );
}

/// Apenas o composer de novo comentário
Future<String?> openCommentComposer(BuildContext context) async {
  final ctrl = TextEditingController();
  String? result;
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    builder: (ctx) {
      final insets = MediaQuery.of(ctx).viewInsets.bottom;
      return Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, insets + 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Novo comentário',
                style: Theme.of(ctx)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Escreva seu comentário...',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Spacer(),
                FilledButton(
                  onPressed: () {
                    result = ctrl.text;
                    Navigator.of(ctx).pop();
                  },
                  child: const Text('Enviar'),
                ),
              ],
            ),
          ],
        ),
      );
    },
  );
  return result;
}
