import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';
import '../../core/widgets/brutalist_box.dart';

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
          );
        }
        final bySpace = snap.data ?? const {};
        final theme = ref.watch(appThemeProvider).colors;

        return Scaffold(
          backgroundColor: theme.background,
          appBar: AppBar(
            backgroundColor: theme.background,
            title: Text(
              'NOTÍCIAS',
              style: TextStyle(
                fontFamily: 'Space Mono',
                fontWeight: FontWeight.bold,
                color: theme.textPrimary,
                letterSpacing: 1.5,
              ),
            ),
            iconTheme: IconThemeData(color: theme.textPrimary),
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: bySpace.entries.map((entry) {
              final spaceName = entry.key;
              final channels = entry.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Card(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        spaceName.toUpperCase(),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontFamily: 'Space Mono',
                                  fontWeight: FontWeight.bold,
                                  color: theme.textPrimary,
                                ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: channels.map((c) {
                          final name = (c['name'] ?? 'Canal').toString();
                          return GestureDetector(
                            onTap: () =>
                                context.push('/news/channel/${c['id']}'),
                            child: BrutalistBox(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 8),
                              backgroundColor:
                                  theme.neonAccent.withOpacity(0.1),
                              borderColor: theme.neonAccent,
                              borderWidth: 1,
                              shadowOffset: 2,
                              child: Text(
                                name.toUpperCase(),
                                style: TextStyle(
                                  fontFamily: 'Space Mono',
                                  fontSize: 12,
                                  color: theme.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
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
