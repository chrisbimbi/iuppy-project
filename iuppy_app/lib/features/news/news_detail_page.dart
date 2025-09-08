import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';

class NewsDetailPage extends ConsumerWidget {
  final String id;
  const NewsDetailPage({required this.id, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
          tooltip: 'Voltar',
        ),
        title: const Text('Notícia'),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: ref.read(newsRepoProvider).getById(id),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Erro: ${snap.error}'));
          }
          final n = snap.data ?? const <String, dynamic>{};
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(n['title'] as String? ?? '',
                    style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 8),
                Text((n['createdAt'] as String? ?? '').toString(),
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 16),
                Expanded(
                  child: SingleChildScrollView(
                    child: Text(n['content'] as String? ?? ''),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
