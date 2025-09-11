import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart';
import '../../news/widgets/chips.dart';

class NewsCarousel extends ConsumerWidget {
  const NewsCarousel({super.key, this.spaceId});
  final String? spaceId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(newsRepoProvider).homeFeedRemoteFirst(spaceId: spaceId),
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final list = snap.data ?? const [];
        if (list.isEmpty) {
          return const Center(child: Text('Sem notícias por aqui.'));
        }

        return PageView.builder(
          controller: PageController(viewportFraction: .86),
          itemCount: list.length,
          itemBuilder: (_, i) {
            final n = list[i];
            final img = _firstHttpUrl(n['highlightImages']) ??
                'https://iuppy.com.br/wp-content/uploads/2025/05/automacao-fluxos-1.png';
            final title = (n['title'] ?? '').toString();
            final created = _fmtDate(n['createdAt']?.toString());
            final spaceName = (n['spaceName'] ?? '').toString();
            final channelName = (n['channelName'] ?? '').toString();

            return Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Material(
                color: Theme.of(context).colorScheme.surface,
                elevation: 1.5,
                borderRadius: BorderRadius.circular(18),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () =>
                      GoRouter.of(context).push('/news/article/${n['id']}'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (spaceName.isNotEmpty) Pill(spaceName),
                            if (channelName.isNotEmpty) Pill(channelName),
                          ],
                        ),
                      ),
                      AspectRatio(
                        aspectRatio: 16 / 9,
                        child: CachedNetworkImage(
                          imageUrl: img,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              const Center(child: CircularProgressIndicator()),
                          errorWidget: (_, __, ___) => const Center(
                              child: Icon(Icons.broken_image_outlined)),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                        child: Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      if (created != null)
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                          child: Text(
                            created,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(fontWeight: FontWeight.w300),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}

String? _fmtDate(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso)?.toLocal();
  if (dt == null) return null;
  String two(int n) => n < 10 ? '0$n' : '$n';
  final yy = dt.year % 100;
  return '${two(dt.day)}/${two(dt.month)}/${two(yy)} - ${two(dt.hour)}:${two(dt.minute)}';
}

String? _firstHttpUrl(dynamic arr) {
  if (arr == null) return null;
  if (arr is String) return arr.startsWith('http') ? arr : null;
  if (arr is List) {
    for (final e in arr) {
      if (e is String && e.startsWith('http')) return e;
      if (e is Map &&
          e['url'] != null &&
          e['url'].toString().startsWith('http')) {
        return e['url'].toString();
      }
    }
  }
  return null;
}
