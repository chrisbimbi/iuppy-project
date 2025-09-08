import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';
import '../menu/menu_drawer.dart';
import '../../app/theme/theme.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});
  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  String? _selectedSpace;
  String _query = '';

  @override
  void initState() {
    super.initState();
    // warm caches
    Future.microtask(() async {
      await ref.read(spacesRepoProvider).fetchAndCache();
      await ref.read(channelsRepoProvider).fetchAndCache();
      await ref.read(surveysRepoProvider).list(limit: 3);
    });
  }

  @override
  Widget build(BuildContext context) {
    final userName = ref.watch(authControllerProvider).userName ?? 'usuário';
    final settings = ref.watch(companySettingsProvider).maybeWhen(
          data: (d) => d,
          orElse: () => null,
        );

    return Scaffold(
      appBar: AppBar(
        title: Text('Olá, $userName'),
        actions: [
          IconButton(
              onPressed: () => context.push('/favorites'),
              icon: const Icon(Icons.star)),
          IconButton(
              onPressed: () => context.push('/groups'),
              icon: const Icon(Icons.group)),
          IconButton(
              onPressed: () => context.push('/settings'),
              icon: const Icon(Icons.settings)),
          IconButton(
              onPressed: () => context.push('/notifications'),
              icon: const Icon(Icons.notifications)),
        ],
      ),
      drawer: const MenuDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FrostedGlass(
              child: Row(
                children: [
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(settings?.branding.appTitle ?? 'Iuppy',
                            style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 4),
                        Text(settings?.branding.appSubtitle ??
                            'Comunicação Inteligente™'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              decoration: const InputDecoration(
                hintText: 'Buscar (em cache)',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
            ),
            const SizedBox(height: 12),
            _SpacesChips(
              selected: _selectedSpace,
              onSelect: (id) => setState(() => _selectedSpace = id),
            ),
            const SizedBox(height: 16),
            _SectionTitle(title: 'Últimas notícias', onTap: null),
            _LatestNews(spaceId: _selectedSpace, query: _query),
            const SizedBox(height: 16),
            _SectionTitle(
                title: 'Enquetes', onTap: () => context.push('/surveys')),
            _LatestSurveys(query: _query),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final VoidCallback? onTap;
  const _SectionTitle({required this.title, this.onTap});
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleMedium),
        if (onTap != null)
          TextButton(onPressed: onTap, child: const Text('Ver todas')),
      ],
    );
  }
}

class _SpacesChips extends ConsumerWidget {
  final String? selected;
  final ValueChanged<String?> onSelect;
  const _SpacesChips({required this.selected, required this.onSelect});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: () async {
        final cached = await ref.read(spacesRepoProvider).getCached();
        if (cached.isNotEmpty) return cached;
        return ref.read(spacesRepoProvider).fetchAndCache();
      }(),
      builder: (ctx, snap) {
        final list = snap.data ?? const <Map<String, dynamic>>[];
        return Wrap(
          spacing: 8,
          children: [
            ChoiceChip(
              label: const Text('Todos'),
              selected: selected == null,
              onSelected: (v) => onSelect(null),
            ),
            ...list.map((s) => ChoiceChip(
                  label: Text(s['name'] as String? ?? 'Space'),
                  selected: selected == s['id'],
                  onSelected: (_) => onSelect(s['id'] as String),
                )),
          ],
        );
      },
    );
  }
}

class _LatestNews extends ConsumerWidget {
  final String? spaceId;
  final String query;
  const _LatestNews({this.spaceId, required this.query});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: () async {
        final channels =
            await ref.read(channelsRepoProvider).getCached(spaceId: spaceId);
        final chan = channels.take(4).toList();
        final repo = ref.read(newsRepoProvider);
        for (final c in chan) {
          await repo.listByChannel(c['id'] as String);
        }
        return ref.read(dbProvider).getNews(limit: 50);
      }(),
      builder: (ctx, snap) {
        final list = (snap.data ?? const <Map<String, dynamic>>[])
            .where((e) =>
                (e['title'] as String? ?? '').toLowerCase().contains(query))
            .take(3)
            .toList();
        if (list.isEmpty) return const Text('Sem notícias por aqui.');
        return Column(
          children: list
              .map((n) => ListTile(
                    title: Text(n['title'] as String? ?? ''),
                    subtitle: Text((n['createdAt'] as String? ?? '')
                        .replaceAll('T', ' ')
                        .split('.')
                        .first),
                    onTap: () => context.push('/news/article/${n['id']}'),
                  ))
              .toList(),
        );
      },
    );
  }
}

class _LatestSurveys extends ConsumerWidget {
  final String query;
  const _LatestSurveys({required this.query});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(surveysRepoProvider).list(limit: 3),
      builder: (ctx, snap) {
        final list = (snap.data ?? const <Map<String, dynamic>>[])
            .where((e) =>
                (e['title'] as String? ?? '').toLowerCase().contains(query))
            .take(3)
            .toList();
        if (list.isEmpty) return const Text('Sem enquetes no momento.');
        return Column(
          children: list
              .map((s) => ListTile(
                    leading: const Icon(Icons.poll),
                    title: Text(s['title'] as String? ?? ''),
                    onTap: () => context.push('/surveys/${s['id']}'),
                  ))
              .toList(),
        );
      },
    );
  }
}
