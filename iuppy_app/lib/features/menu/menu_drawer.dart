import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';

class MenuDrawer extends ConsumerWidget {
  const MenuDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final company = ref.watch(companySettingsProvider);
    final enabled = company.maybeWhen(
      data: (d) => d.enabledModules,
      orElse: () => <String>{},
    );

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(.1),
            ),
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Text('Menu',
                  style: Theme.of(context).textTheme.headlineSmall),
            ),
          ),
          if (enabled.contains('news')) const _NewsTree(),
          if (enabled.contains('surveys'))
            ListTile(
              leading: const Icon(Icons.poll),
              title: const Text('Surveys'),
              onTap: () => context.push('/surveys'),
            ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Configurações'),
            onTap: () => context.push('/settings'),
          ),
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Sair'),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }
}

class _NewsTree extends ConsumerStatefulWidget {
  const _NewsTree();

  @override
  ConsumerState<_NewsTree> createState() => _NewsTreeState();
}

class _NewsTreeState extends ConsumerState<_NewsTree> {
  Map<String, bool> _expanded = {};

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      leading: const Icon(Icons.article),
      title: const Text('News'),
      children: [
        FutureBuilder<List<Map<String, dynamic>>>(
          future: () async {
            final cached = await ref.read(spacesRepoProvider).getCached();
            if (cached.isNotEmpty) return cached;
            return ref.read(spacesRepoProvider).fetchAndCache();
          }(),
          builder: (ctx, snap) {
            if (snap.connectionState != ConnectionState.done) {
              return const ListTile(title: Text('Carregando espaços...'));
            }
            final spaces = snap.data ?? const <Map<String, dynamic>>[];
            if (spaces.isEmpty)
              return const ListTile(title: Text('Sem espaços visíveis'));
            return Column(
              children: spaces.map((s) {
                final sid = s['id'] as String;
                final expanded = _expanded[sid] ?? false;
                return ExpansionTile(
                  title: Text(s['name'] as String? ?? 'Space'),
                  initiallyExpanded: expanded,
                  onExpansionChanged: (v) => setState(() => _expanded[sid] = v),
                  children: [
                    FutureBuilder<List<Map<String, dynamic>>>(
                      future: () async {
                        final cached = await ref
                            .read(channelsRepoProvider)
                            .getCached(spaceId: sid);
                        if (cached.isNotEmpty) return cached;
                        return ref
                            .read(channelsRepoProvider)
                            .fetchAndCache(spaceId: sid);
                      }(),
                      builder: (ctx, chSnap) {
                        if (chSnap.connectionState != ConnectionState.done) {
                          return const ListTile(
                              title: Text('Carregando canais...'));
                        }
                        final channels =
                            chSnap.data ?? const <Map<String, dynamic>>[];
                        if (channels.isEmpty)
                          return const ListTile(
                              title: Text('Sem canais visíveis'));
                        return Column(
                          children: channels
                              .map((c) => ListTile(
                                    title:
                                        Text(c['name'] as String? ?? 'Canal'),
                                    onTap: () => context
                                        .push('/news/channel/${c['id']}'),
                                  ))
                              .toList(),
                        );
                      },
                    ),
                  ],
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }
}
