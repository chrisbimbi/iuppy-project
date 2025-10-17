import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';

class NewsHubPage extends ConsumerWidget {
  const NewsHubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<Map<String, List<Map<String, dynamic>>>>(
      future: _fetch(ref),
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return Scaffold(
            appBar: AppBar(title: const Text('Notícias')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final bySpace = snap.data ?? const {};
        return Scaffold(
          appBar: AppBar(title: const Text('Notícias')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: bySpace.entries.map((entry) {
              final spaceName = entry.key;
              final channels = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Card(
                  elevation: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(spaceName,
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: channels.map((c) {
                            final name = (c['name'] ?? 'Canal').toString();
                            return ActionChip(
                              label: Text(name),
                              onPressed: () =>
                                  context.push('/news/channel/${c['id']}'),
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  Future<Map<String, List<Map<String, dynamic>>>> _fetch(WidgetRef ref) async {
    final spaces = await ref.read(spacesRepoProvider).fetchAndCache();
    final channels = await ref.read(channelsRepoProvider).fetchAndCache();

    final spaceById = {for (final s in spaces) (s['id'] ?? '').toString(): s};
    final map = <String, List<Map<String, dynamic>>>{};
    for (final c in channels) {
      final sid = (c['spaceId'] ?? '').toString();
      final spaceName = (spaceById[sid]?['name'] ?? 'Space').toString();
      map.putIfAbsent(spaceName, () => []).add(c);
    }
    return map;
  }
}
