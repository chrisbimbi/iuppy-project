// lib/features/menu/menu_drawer.dart
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

    // Contadores de News
    final unreadNews = ref.watch(unreadCountersProvider).maybeWhen(
          data: (d) => d,
          orElse: () =>
              const UnreadCounters(total: 0, bySpace: {}, byChannel: {}),
        );

    // 🔥 NOVO: Contador de Forms (Novos + Respostas)
    final unreadForms = ref.watch(formsBadgesProvider).maybeWhen(
          data: (val) => val,
          orElse: () => 0,
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

          // News Tree
          if (enabled.contains('news')) _NewsTree(unread: unreadNews),

          // Surveys
          if (enabled.contains('surveys'))
            ListTile(
              leading: const Icon(Icons.poll),
              title: const Text('Surveys'),
              onTap: () => context.push('/surveys'),
            ),

          // 🔥 Formulários com Badge
          if (enabled.contains('forms'))
            ListTile(
              leading: const Icon(Icons.description),
              title: Row(
                children: [
                  const Text('Formulários'),
                  const SizedBox(width: 8),
                  if (unreadForms > 0) _badge(context, unreadForms),
                ],
              ),
              onTap: () => context.push('/forms'),
            ),

          // Configurações
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Configurações'),
            onTap: () => context.push('/settings'),
          ),

          // Logout
          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Sair'),
            onTap: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }

  // Helper visual de badge (reutilizado da árvore de news)
  Widget _badge(BuildContext context, int n) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: c.error, // Cor de erro (vermelho) para destaque
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        '$n',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: c.onError,
              fontWeight: FontWeight.w700,
            ),
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
              color: c.onSecondaryContainer,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}
