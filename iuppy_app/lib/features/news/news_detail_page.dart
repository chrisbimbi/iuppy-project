// lib/features/news/news_detail_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:visibility_detector/visibility_detector.dart';

import 'package:iuppy_app/features/news/providers/news_providers.dart';
import '../../core/providers.dart';
import './widgets/images_slider.dart';
import './widgets/image_gallery.dart';
import './widgets/web_sheet.dart';
import './widgets/comment_sheet.dart';
import './widgets/avatar.dart';
import './widgets/avatar_stack.dart';
import './widgets/chips.dart';
import './widgets/html_content.dart';
import './widgets/reaction_action.dart';
import 'package:iuppy_app/features/news/providers/news_interaction_provider.dart';

class NewsDetailPage extends ConsumerStatefulWidget {
  const NewsDetailPage({
    super.key,
    required this.id,
    this.cameFromPush = false,
    this.pushMessageId,
  });

  final String id;
  final bool cameFromPush;
  final String? pushMessageId;

  @override
  ConsumerState<NewsDetailPage> createState() => _NewsDetailPageState();
}

class _NewsDetailPageState extends ConsumerState<NewsDetailPage> {
  bool _ackedNow = false; // marcação local imediata após sucesso

  @override
  void initState() {
    super.initState();
    // primeiro OPEN decidido pela origem do deep link
    Future.microtask(() async {
      final newsInteraction =
          ref.read(newsInteractionProvider(widget.id).notifier);

      if (widget.cameFromPush) {
        await newsInteraction.sendOpen(
          meta: {
            'origin': 'push',
            if (widget.pushMessageId != null &&
                widget.pushMessageId!.isNotEmpty)
              'mid': widget.pushMessageId,
          },
        );
      } else {
        await newsInteraction.sendOpen(meta: {'origin': 'app'});
      }
    });
  }

  // Remove duplicados por (avatar || nome)
  List<({String name, String avatar})> _uniquePeople(
    List<({String name, String avatar})> items,
  ) {
    final seen = <String>{};
    final out = <({String name, String avatar})>[];
    for (final p in items) {
      final key =
          (p.avatar.trim().isNotEmpty ? p.avatar : p.name).trim().toLowerCase();
      if (key.isEmpty || seen.contains(key)) continue;
      seen.add(key);
      out.add(p);
    }
    return out;
  }

  Future<void> _share() async {
    final ctrl = ref.read(newsDetailControllerProvider(widget.id));
    final vm = ctrl.vm!;
    final result = await Share.share(
      [vm.shareText, vm.deeplink].where((s) => s.isNotEmpty).join('\n\n'),
    );
    if (result.status == ShareResultStatus.success) {
      await ctrl.trackShareSuccess(target: 'app');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Compartilhado ✅')),
        );
      }
    }
  }

  Future<void> _confirmAck() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Confirmar aceite?'),
        content: const Text(
          'Ao clicar em "Confirmar aceite", você declara que visualizou e aceitou este conteúdo. Esta ação não poderá ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(c).pop(false),
            child: const Text('Voltar'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(c).pop(true),
            child: const Text('Confirmar aceite'),
          ),
        ],
      ),
    );

    if (ok == true) {
      try {
        final ctrl = ref.read(newsDetailControllerProvider(widget.id));
        await ctrl.acknowledge();

        setState(() {
          _ackedNow = true;
        });

        ref.read(feedVersionProvider.notifier).state++;

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Leitura/aceite confirmado ✅')),
          );
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Falha ao confirmar')),
          );
        }
      }
    }
  }

  void _onVisiblePing() {
    final newsInteraction =
        ref.read(newsInteractionProvider(widget.id).notifier);
    newsInteraction.sendOpen(meta: {'origin': 'app'});
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = ref.watch(newsDetailControllerProvider(widget.id));
    final vm = ctrl.vm;

    if (ctrl.loading || vm == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final t = Theme.of(context);

    final reactorsUnique = _uniquePeople(vm.reactorsSample);
    final commentersUnique = _uniquePeople(vm.commentersSample);
    final sharersUnique = _uniquePeople(vm.sharersSample);

    final bool acknowledged = _ackedNow || vm.acknowledged;
    final bool showAckBar = vm.ackRequired;

    return VisibilityDetector(
      key: ValueKey('news-visible-${widget.id}'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction >= 0.6) _onVisiblePing();
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            tooltip: 'Voltar',
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
          ),
          title: Text(
            vm.title.isEmpty ? 'Notícia' : vm.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          actions: [
            if (vm.shareEnabled)
              IconButton(
                tooltip: 'Compartilhar',
                icon: const Icon(Icons.ios_share_rounded),
                onPressed: _share,
              ),
          ],
        ),
        bottomNavigationBar: showAckBar
            ? SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.amber,
                      foregroundColor: Colors.black,
                    ),
                    onPressed: acknowledged ? null : _confirmAck,
                    child: Text(acknowledged ? 'Aceito' : 'Ler e aceitar'),
                  ),
                ),
              )
            : null,
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (vm.images.isNotEmpty) ...[
              ImagesSlider(
                urls: vm.images,
                onTap: (idx) => openImageGalleryDialog(context, vm.images,
                    initialIndex: idx),
              ),
              const SizedBox(height: 16),
            ],
            Text(
              vm.title,
              style: t.textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            if (vm.subtitle.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                vm.subtitle,
                style: t.textTheme.titleMedium
                    ?.copyWith(color: t.colorScheme.onSurfaceVariant),
              ),
            ],
            if (vm.authorId != null && vm.authorName != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Avatar(vm.authorAvatarUrl ?? '',
                      name: vm.authorName!, size: 28),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Escrito por ${vm.authorName!}',
                      style: t.textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            if (vm.createdAtStr != null) ...[
              Row(children: [
                const Icon(Icons.event, size: 16),
                const SizedBox(width: 6),
                Text(vm.createdAtStr!, style: t.textTheme.bodySmall),
                if (vm.updatedAtStr != null &&
                    vm.updatedAtStr != vm.createdAtStr) ...[
                  const SizedBox(width: 10),
                  const Icon(Icons.edit_calendar, size: 16),
                  const SizedBox(width: 6),
                  Text('Atualizada ${vm.updatedAtStr}',
                      style: t.textTheme.bodySmall),
                ],
              ]),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ...vm.channelNames.map((n) => Pill(n)),
                if (vm.ackRequired)
                  Pill('Ação necessária', color: Colors.amber),
                if (vm.attachments.isNotEmpty)
                  Pill('Anexos (${vm.attachments.length})',
                      color: t.colorScheme.primary),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 24, thickness: 1, color: Colors.black12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                if (vm.allowReactions)
                  Expanded(
                    child: Center(
                      child: ReactionAction(
                        currentKind: vm.myReaction,
                        onReact: (k) async {
                          await ctrl.react(k);
                          ref.read(feedVersionProvider.notifier).state++;
                        },
                        onUnreact: () async {
                          await ctrl.unreact();
                          ref.read(feedVersionProvider.notifier).state++;
                        },
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (vm.allowComments)
                  Expanded(
                    child: Center(
                      child: _CircleActionButtonPlain(
                        icon: Icons.mode_comment_outlined,
                        onTap: () async {
                          await openCommentsSheet(
                            context,
                            previews: vm.previewComments
                                .map((e) => CommentPreview(
                                    text: e.text,
                                    name: e.name,
                                    avatar: e.avatar))
                                .toList(),
                            onCompose: () async {
                              final text = await openCommentComposer(context);
                              if (text == null || text.trim().isEmpty) return;
                              try {
                                final appeared =
                                    await ctrl.comment(text.trim());
                                if (context.mounted) {
                                  final msg = appeared
                                      ? 'Comentário enviado!'
                                      : 'Comentário enviado! Aguardando aprovação do moderador';
                                  await showDialog<void>(
                                    context: context,
                                    builder: (c) => AlertDialog(
                                      content: Text(msg),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.of(c).pop(),
                                          child: const Text('OK'),
                                        ),
                                      ],
                                    ),
                                  );
                                }
                              } catch (_) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Falha ao enviar comentário')),
                                  );
                                }
                              }
                            },
                          );
                        },
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (vm.shareEnabled)
                  Expanded(
                    child: Center(
                      child: _CircleActionButtonPlain(
                        icon: Icons.ios_share_rounded,
                        onTap: _share,
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Expanded(
                  child: Center(
                    child: _CircleActionButtonPlain(
                      icon: Icons.bookmark_outline,
                      onTap: () {}, // TODO
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (vm.allowReactions)
                  Expanded(
                    child: Center(
                      child: reactorsUnique.isEmpty
                          ? const SizedBox(height: 22)
                          : AvatarStack(
                              items: reactorsUnique,
                              size: 22,
                              maxShown: 3,
                              totalCount: vm.totalReacts,
                            ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (vm.allowComments)
                  Expanded(
                    child: Center(
                      child: commentersUnique.isEmpty
                          ? const SizedBox(height: 22)
                          : AvatarStack(
                              items: commentersUnique,
                              size: 22,
                              maxShown: 3,
                              totalCount: vm.commentsShown,
                            ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                if (vm.shareEnabled)
                  Expanded(
                    child: Center(
                      child: sharersUnique.isEmpty
                          ? const SizedBox(height: 22)
                          : AvatarStack(
                              items: sharersUnique,
                              size: 22,
                              maxShown: 3,
                              totalCount: vm.shares,
                            ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                const Expanded(child: SizedBox(height: 22)),
              ],
            ),
            const Divider(height: 24, thickness: 1, color: Colors.black12),
            if (vm.contentHtml.isNotEmpty)
              HtmlContent(html: vm.contentHtml)
            else
              const Text('Sem conteúdo.'),
            if (vm.attachments.isNotEmpty) ...[
              const SizedBox(height: 20),
              Text('Anexos',
                  style: t.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              ...vm.attachments.map(
                (att) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.attachment_outlined),
                    title: Text(
                      att.name.isEmpty
                          ? Uri.parse(att.url).pathSegments.last
                          : att.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => openWebSheet(context, att.url, title: 'Anexo'),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CircleActionButtonPlain extends StatelessWidget {
  const _CircleActionButtonPlain({
    required this.icon,
    required this.onTap,
    this.bg,
    this.iconSize = 22,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color? bg;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
        ),
        alignment: Alignment.center,
        child: Icon(icon, size: iconSize),
      ),
    );
  }
}
