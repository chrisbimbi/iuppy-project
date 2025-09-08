import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';

class NewsChannelListPage extends ConsumerWidget {
  final String channelId;
  const NewsChannelListPage({required this.channelId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
          tooltip: 'Voltar',
        ),
        title: const Text('Notícias do Canal'),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: ref.read(newsRepoProvider).listByChannel(channelId),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final list = snap.data ?? const <Map<String, dynamic>>[];
          if (list.isEmpty) {
            return const Center(child: Text('Sem notícias neste canal.'));
          }
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final n = list[i];
              return ListTile(
                title: Text(n['title'] as String? ?? ''),
                subtitle: Text((n['createdAt'] as String? ?? '').toString()),
                onTap: () => context.push('/news/article/${n['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
