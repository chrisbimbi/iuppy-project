// lib/features/menu/menu_drawer.dart
import 'package:flutter/foundation.dart'; // kDebugMode
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

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

    // contadores (total/por space/por canal)
    final unread = ref.watch(unreadCountersProvider).maybeWhen(
          data: (d) => d,
          orElse: () =>
              const UnreadCounters(total: 0, bySpace: {}, byChannel: {}),
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

          if (enabled.contains('news')) _NewsTree(unread: unread),

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

          // ---------------------------
          // DEBUG ONLY: marcar todas lidas
          // ---------------------------
          // if (kDebugMode)
          //   ListTile(
          //     leading: const Icon(Icons.done_all),
          //     title:
          //         const Text('Marcar TODAS as notícias (em cache) como lidas'),
          //     onTap: () async {
          //       final db = ref.read(dbProvider);
          //       final cached = await db.getNews(limit: 2000);

          //       // só as publicadas
          //       final ids = cached
          //           .where((n) => (n['isPublished'] ?? true) == true)
          //           .map((n) => (n['id'] ?? '').toString());

          //       await ref.read(localNewsStoreProvider).markManyRead(ids);

          //       // Atualiza badges (Home + Drawer)
          //       ref.read(homeBadgesProvider.notifier).state =
          //           const HomeBadges(newsNew: 0, surveysPending: 0);
          //       ref.invalidate(unreadCountersProvider);

          //       if (context.mounted) {
          //         Navigator.of(context).pop(); // fecha o drawer
          //         ScaffoldMessenger.of(context).showSnackBar(
          //           const SnackBar(
          //             content: Text('Todas as notícias marcadas como lidas ✅'),
          //           ),
          //         );
          //       }
          //     },
          //   ),

          // const Divider(),

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
  const _NewsTree({required this.unread});
  final UnreadCounters unread;

  @override
  ConsumerState<_NewsTree> createState() => _NewsTreeState();
}

class _NewsTreeState extends ConsumerState<_NewsTree> {
  Map<String, bool> _expanded = {};

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      leading: const Icon(Icons.article),
      title: Row(
        children: [
          const Text('News'),
          const SizedBox(width: 8),
          if (widget.unread.total > 0) _badge(context, widget.unread.total),
        ],
      ),
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
            if (spaces.isEmpty) {
              return const ListTile(title: Text('Sem espaços visíveis'));
            }
            return Column(
              children: spaces.map((s) {
                final sid = (s['id'] ?? '').toString();
                final expanded = _expanded[sid] ?? false;
                final spaceBadge = widget.unread.bySpace[sid] ?? 0;

                return ExpansionTile(
                  title: Row(
                    children: [
                      Text((s['name'] ?? 'Space').toString()),
                      const SizedBox(width: 8),
                      if (spaceBadge > 0) _badge(context, spaceBadge),
                    ],
                  ),
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
                        if (channels.isEmpty) {
                          return const ListTile(
                              title: Text('Sem canais visíveis'));
                        }
                        return Column(
                          children: channels.map((c) {
                            final cid = (c['id'] ?? '').toString();
                            final unread = widget.unread.byChannel[cid] ?? 0;
                            return ListTile(
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      (c['name'] ?? 'Canal').toString(),
                                    ),
                                  ),
                                  if (unread > 0) _badge(context, unread),
                                ],
                              ),
                              onTap: () => GoRouter.of(context)
                                  .push('/news/channel/$cid'),
                            );
                          }).toList(),
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

  Widget _badge(BuildContext context, int n) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: c.secondaryContainer,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$n',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: c.onSecondaryContainer, fontWeight: FontWeight.w700),
      ),
    );
  }
}
