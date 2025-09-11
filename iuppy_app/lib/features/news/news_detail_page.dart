import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';
import 'widgets/chips.dart';
import 'widgets/web_sheet.dart';
import 'widgets/video_dialog.dart';
import 'widgets/image_gallery.dart';

class NewsDetailPage extends ConsumerWidget {
  const NewsDetailPage({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(newsRepoProvider);

    return FutureBuilder<Map<String, dynamic>>(
      future: repo.getById(id),
      builder: (context, snap) {
        final hasData =
            snap.connectionState == ConnectionState.done && snap.hasData;
        final data =
            hasData ? (snap.data ?? const {}) : const <String, dynamic>{};

        // ---- SIDE EFFECT: marcou como lida (+ atualiza badges/drawer) ----
        if (hasData) {
          Future.microtask(() async {
            await ref.read(localNewsStoreProvider).markRead(id);

            // Home badge
            final cached = await ref.read(dbProvider).getNews(limit: 200);
            final ids = cached
                .where((n) => (n['isPublished'] ?? true) == true)
                .map((e) => (e['id'] ?? '').toString());
            final unread =
                await ref.read(localNewsStoreProvider).countUnread(ids);
            ref.read(homeBadgesProvider.notifier).state =
                HomeBadges(newsNew: unread, surveysPending: 0);

            // Drawer counters
            ref.invalidate(unreadCountersProvider);
          });
        }
        // ------------------------------------------------------------

        final title = (data['title'] as String?)?.trim() ?? '';
        final subtitle = (data['subtitle'] as String?)?.trim() ?? '';
        final content = (data['content'] as String?)?.trim() ?? '';

        // datas
        final createdAt = _fmtDate(data['createdAt']?.toString());
        final updatedAt = _fmtDate(data['updatedAt']?.toString());

        // settings / flags
        final settings = (data['settings'] as Map?) ?? const {};
        final allowReactions = (settings['allowReactions'] ?? false) == true;
        final acknowledgementRequired =
            (settings['acknowledgementRequired'] ?? false) == true;

        // nomes enriquecidos
        final spaceName = (data['spaceName'] as String?)?.trim();
        final channelName = (data['channelName'] as String?)?.trim();
        final channelNames = _extractChannelNames(data,
            fallbackSingle: channelName != null && channelName.isNotEmpty
                ? [channelName]
                : const []);

        // imagens
        final rawImages = (data['highlightImages'] as List?) ?? const [];
        final images = rawImages
            .map((e) {
              if (e is String) return e;
              if (e is Map && e['url'] != null) return e['url'].toString();
              return '';
            })
            .where((u) => u.startsWith('http'))
            .toList();

        // anexos
        final attachments = ((data['attachments'] as List?) ?? const [])
            .map((e) {
              if (e is String) {
                return (
                  name: Uri.tryParse(e)?.pathSegments.last ?? 'arquivo',
                  url: e
                );
              } else if (e is Map) {
                final url = (e['url'] ?? '').toString();
                final name =
                    (e['name'] ?? Uri.tryParse(url)?.pathSegments.last ?? '')
                        .toString();
                return (name: name, url: url);
              }
              return (name: 'arquivo', url: '');
            })
            .where((t) => t.url.startsWith('http'))
            .toList();

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              tooltip: 'Voltar',
              onPressed: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go('/home');
                }
              },
            ),
            title: Text(
              title.isEmpty ? 'Notícia' : title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          bottomNavigationBar: acknowledgementRequired
              ? SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: FilledButton(
                      onPressed: () async {
                        try {
                          await ref.read(apiClientProvider).ackNews(id);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Leitura confirmada ✅'),
                              ),
                            );
                          }
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Falha ao confirmar'),
                              ),
                            );
                          }
                        }
                      },
                      child: const Text('Confirmar leitura'),
                    ),
                  ),
                )
              : null,
          body: Builder(
            builder: (_) {
              if (snap.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snap.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Falha ao carregar a notícia.\n${snap.error}',
                    style: const TextStyle(color: Colors.red),
                  ),
                );
              }

              final theme = Theme.of(context);

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // chips de contexto
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      if (spaceName != null && spaceName.isNotEmpty)
                        Pill(spaceName),
                      if (channelNames.isNotEmpty)
                        ...channelNames.map((n) => Pill(n)),
                      if (acknowledgementRequired)
                        Pill('Para aceite', color: theme.colorScheme.tertiary),
                      if (attachments.isNotEmpty)
                        Pill('Anexos (${attachments.length})',
                            color: theme.colorScheme.primary),
                      if (allowReactions)
                        Pill('Reações', color: theme.colorScheme.secondary),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // datas
                  if (createdAt != null) ...[
                    Row(
                      children: [
                        const Icon(Icons.event, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          createdAt,
                          style: theme.textTheme.bodySmall,
                        ),
                        if (updatedAt != null && updatedAt != createdAt) ...[
                          const SizedBox(width: 10),
                          const Icon(Icons.edit_calendar, size: 16),
                          const SizedBox(width: 6),
                          Text('Atualizada $updatedAt',
                              style: theme.textTheme.bodySmall),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],

                  // título + subtítulo
                  Text(
                    title,
                    style: theme.textTheme.headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),

                  // imagens (slider se >1)
                  if (images.isNotEmpty) ...[
                    _ImagesSlider(
                      urls: images,
                      onTap: (idx) => openImageGalleryDialog(
                        context,
                        images,
                        initialIndex: idx,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // conteúdo HTML
                  if (content.isNotEmpty)
                    HtmlWidget(
                      content,
                      textStyle: theme.textTheme.bodyMedium,
                      renderMode: RenderMode.column,
                      onTapUrl: (url) {
                        openWebSheet(context, url);
                        return true;
                      },
                      customWidgetBuilder: (element) {
                        if (element.localName == 'iframe') {
                          final src = element.attributes['src'] ?? '';
                          final id = _tryExtractYoutubeId(src);
                          if (id != null) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: AspectRatio(
                                aspectRatio: 16 / 9,
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.black12,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      alignment: Alignment.center,
                                      child: const Icon(
                                        Icons.play_circle_fill,
                                        size: 64,
                                      ),
                                    ),
                                    Positioned.fill(
                                      child: Material(
                                        color: Colors.transparent,
                                        child: InkWell(
                                          onTap: () =>
                                              openYoutubeDialog(context, id),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                        }
                        return null;
                      },
                    )
                  else
                    const Text('Sem conteúdo.'),

                  // anexos
                  if (attachments.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Text(
                      'Anexos',
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    ...attachments.map(
                      (t) => Card(
                        child: ListTile(
                          leading: const Icon(Icons.attachment_outlined),
                          title: Text(
                            t.name.isEmpty
                                ? Uri.parse(t.url).pathSegments.last
                                : t.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded),
                          onTap: () =>
                              openWebSheet(context, t.url, title: 'Anexo'),
                        ),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        );
      },
    );
  }
}

// ---------------------------
// Helpers
// ---------------------------

String? _fmtDate(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso)?.toLocal();
  if (dt == null) return null;
  String two(int n) => n < 10 ? '0$n' : '$n';
  final yy = dt.year % 100;
  return '${two(dt.day)}/${two(dt.month)}/${two(yy)} - ${two(dt.hour)}:${two(dt.minute)}';
}

List<String> _extractChannelNames(Map<String, dynamic> data,
    {List<String> fallbackSingle = const []}) {
  final ch = data['channels'];
  if (ch is List) {
    final names = ch
        .map((e) {
          if (e is String) return e;
          if (e is Map && e['name'] != null) return e['name'].toString();
          return '';
        })
        .where((s) => s.trim().isNotEmpty)
        .cast<String>()
        .toList();
    if (names.isNotEmpty) return names;
  }
  return fallbackSingle;
}

String? _tryExtractYoutubeId(String url) {
  final u = Uri.tryParse(url);
  if (u == null) return null;
  if (u.host.contains('youtu.be') && u.pathSegments.isNotEmpty) {
    return u.pathSegments.first;
  }
  if (u.pathSegments.contains('embed') && u.pathSegments.length >= 2) {
    return u.pathSegments[u.pathSegments.indexOf('embed') + 1];
  }
  final v = u.queryParameters['v'];
  return (v != null && v.isNotEmpty) ? v : null;
}

// ---------------------------
// Slider de imagens
// ---------------------------

class _ImagesSlider extends StatefulWidget {
  const _ImagesSlider({required this.urls, required this.onTap});
  final List<String> urls;
  final void Function(int index) onTap;

  @override
  State<_ImagesSlider> createState() => _ImagesSliderState();
}

class _ImagesSliderState extends State<_ImagesSlider> {
  final _ctrl = PageController();
  int _index = 0;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dots = List.generate(widget.urls.length, (i) => i);

    return Column(
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              fit: StackFit.expand,
              children: [
                PageView.builder(
                  controller: _ctrl,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemCount: widget.urls.length,
                  itemBuilder: (_, i) {
                    final u = widget.urls[i];
                    return InkWell(
                      onTap: () => widget.onTap(i),
                      child: CachedNetworkImage(
                        imageUrl: u,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    );
                  },
                ),
                if (widget.urls.length > 1)
                  Positioned(
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: dots.map((i) {
                        final selected = i == _index;
                        return Container(
                          width: selected ? 8 : 6,
                          height: selected ? 8 : 6,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color:
                                Colors.white.withOpacity(selected ? .95 : .55),
                            shape: BoxShape.circle,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
