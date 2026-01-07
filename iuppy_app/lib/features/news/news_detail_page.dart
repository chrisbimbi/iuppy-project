import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:cached_network_image/cached_network_image.dart';

import 'package:iuppy_app/features/news/providers/news_providers.dart';
import '../../core/providers.dart';
import './widgets/images_slider.dart';
import './widgets/image_gallery.dart';
import './widgets/web_sheet.dart';
import './widgets/comment_sheet.dart';
import './widgets/avatar.dart';
import './widgets/chips.dart';
import './widgets/html_content.dart';
import './widgets/reaction_action.dart';
import 'package:iuppy_app/features/news/providers/news_interaction_provider.dart';

// Enum para tipar o layout no front
enum NewsLayoutType { articles, media, updates }

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
  bool _ackedNow = false;

  @override
  void initState() {
    super.initState();
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

  // --- LÓGICA DE INTERAÇÃO (Mantida Intacta) ---
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
    final result = await SharePlus.instance.share(
      ShareParams(
          text: [vm.shareText, vm.deeplink]
              .where((s) => s.isNotEmpty)
              .join('\n\n')),
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
        setState(() => _ackedNow = true);
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
    ref
        .read(newsInteractionProvider(widget.id).notifier)
        .sendOpen(meta: {'origin': 'app'});
  }

  @override
  Widget build(BuildContext context) {
    final ctrl = ref.watch(newsDetailControllerProvider(widget.id));
    final vm = ctrl.vm;
    final theme = _NewsTheme(
      background: Colors.white,
      textPrimary: Colors.black87,
      neonAccent: Colors.black,
      glassBorder: Colors.grey.shade200,
    );

    if (ctrl.loading || vm == null) {
      return Scaffold(
          backgroundColor: theme.background,
          body: Center(
              child: CircularProgressIndicator(color: theme.neonAccent)));
    }

    // Inferência de Layout
    NewsLayoutType type = NewsLayoutType.articles;
    final cName =
        vm.channelNames.isNotEmpty ? vm.channelNames.first.toLowerCase() : '';

    if (cName.contains('foto') ||
        cName.contains('galeria') ||
        cName.contains('insta')) {
      type = NewsLayoutType.media;
    } else if (cName.contains('aviso') ||
        cName.contains('urgente') ||
        cName.contains('rh') ||
        cName.contains('updates')) {
      type = NewsLayoutType.updates;
    }

    return VisibilityDetector(
      key: ValueKey('news-${widget.id}'),
      onVisibilityChanged: (info) {
        if (info.visibleFraction >= 0.6) _onVisiblePing();
      },
      child: _buildLayout(context, vm, type, theme),
    );
  }

  Widget _buildLayout(
      BuildContext context, dynamic vm, NewsLayoutType type, dynamic theme) {
    final acknowledged = _ackedNow || vm.acknowledged;
    final showAck = vm.ackRequired;

    // Constrói o Floating Action Button (FAB) que flutua nos layouts ARTICLES e MEDIA
    Widget? buildFab() {
      if (!showAck) return null;
      final ackColor = acknowledged ? Colors.green : theme.neonAccent;

      return FloatingActionButton.extended(
        onPressed: acknowledged ? null : _confirmAck,
        backgroundColor: ackColor,
        foregroundColor: Colors.black,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
            side: BorderSide(color: theme.glassBorder, width: 2)),
        icon: Icon(acknowledged ? Icons.check : Icons.assignment_turned_in),
        label: Text(
          acknowledged ? 'CONFIRMADO' : 'CONFIRMAR LEITURA',
          style: const TextStyle(
              fontFamily: 'Space Mono', fontWeight: FontWeight.bold),
        ),
      );
    }

    switch (type) {
      case NewsLayoutType.media:
        return _MediaLayout(
            vm: vm,
            parent: this,
            acknowledged: acknowledged,
            buildFab: buildFab,
            theme: theme);
      case NewsLayoutType.updates:
        return _UpdatesLayout(
            vm: vm, parent: this, acknowledged: acknowledged, theme: theme);
      case NewsLayoutType.articles:
        return _ArticlesLayout(
            vm: vm,
            parent: this,
            acknowledged: acknowledged,
            buildFab: buildFab,
            theme: theme);
    }
  }
}

// ============================================================================
// 1. LAYOUT ARTICLES (Magazine Style / Sliver)
// ============================================================================
class _ArticlesLayout extends ConsumerWidget {
  final dynamic vm;
  final _NewsDetailPageState parent;
  final bool acknowledged;
  final Widget? Function() buildFab;
  final dynamic theme;

  const _ArticlesLayout(
      {required this.vm,
      required this.parent,
      required this.acknowledged,
      required this.buildFab,
      required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.background,
      floatingActionButton: buildFab(), // FAB flutuante para ACK
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      body: CustomScrollView(
        slivers: [
          // HERO APP BAR COM IMAGEM (PARALLAX)
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            stretch: true,
            backgroundColor: theme.background,
            foregroundColor: theme.textPrimary,
            iconTheme: IconThemeData(color: theme.textPrimary),
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              titlePadding: EdgeInsets.zero,
              centerTitle: false,
              title: Padding(
                padding: const EdgeInsets.only(left: 16, bottom: 8),
                child: Text(
                  vm.title.toString().toUpperCase(),
                  style: t.textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    shadows: [const Shadow(blurRadius: 4, color: Colors.black)],
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Space Mono',
                    letterSpacing: -1.0,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              background: vm.images.isNotEmpty
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        if (vm.images.length == 1)
                          GestureDetector(
                            onTap: () => openImageGalleryDialog(
                                context, vm.images,
                                initialIndex: 0),
                            child: CachedNetworkImage(
                              imageUrl: vm.images.first,
                              fit: BoxFit.cover,
                            ),
                          )
                        else
                          PageView.builder(
                            itemCount: vm.images.length,
                            itemBuilder: (context, index) {
                              return GestureDetector(
                                onTap: () => openImageGalleryDialog(
                                    context, vm.images,
                                    initialIndex: index),
                                child: CachedNetworkImage(
                                  imageUrl: vm.images[index],
                                  fit: BoxFit.cover,
                                ),
                              );
                            },
                          ),
                        // Overlay Gradiente Inferior para Título
                        IgnorePointer(
                          child: Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Colors.black87,
                                ],
                                stops: [0.6, 1.0],
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Container(color: theme.neonAccent.withValues(alpha: 0.1)),
            ),
            // Ações de compartilhamento na AppBar
            actions: [
              IconButton(
                tooltip: vm.isFavorited
                    ? 'Remover dos favoritos'
                    : 'Salvar como favorito',
                icon: Icon(
                  vm.isFavorited ? Icons.bookmark : Icons.bookmark_border,
                  color: vm.isFavorited ? Colors.blue : theme.textPrimary,
                ),
                onPressed: () {
                  debugPrint('[NEWS_DETAIL_PAGE] Favorite button pressed');
                  ref
                      .read(newsDetailControllerProvider(parent.widget.id))
                      .toggleFavorite();
                },
              ),
              if (vm.shareEnabled)
                IconButton(
                  tooltip: 'Compartilhar',
                  icon: Icon(Icons.ios_share_rounded, color: theme.textPrimary),
                  onPressed: parent._share,
                ),
            ],
          ),

          // CONTEÚDO
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    children: [
                      ...vm.channelNames.map((n) => Pill(n, isOutlined: true)),

                      // Hashtags
                      if (vm.hashtags != null &&
                          (vm.hashtags as List).isNotEmpty)
                        ...(vm.hashtags as List).map((tag) => Pill('#$tag',
                            isOutlined: true, color: Colors.purple)),

                      if (vm.ackRequired)
                        Pill(
                          acknowledged ? 'Aceito' : 'Importante',
                          color: acknowledged ? Colors.green : Colors.orange,
                          isOutlined: false,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(vm.title,
                      style: t.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                        letterSpacing: -0.5,
                        fontFamily: 'Space Mono',
                        color: theme.textPrimary,
                      )),
                  if (vm.subtitle.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(vm.subtitle,
                        style: t.textTheme.titleMedium?.copyWith(
                            color: theme.textPrimary.withValues(alpha: 0.7))),
                  ],
                  const SizedBox(height: 24),

                  // 🔥 NOVO POSICIONAMENTO: BARRA DE INTERAÇÕES
                  _InteractionsBar(vm: vm, parent: parent, isDark: false),
                  const SizedBox(height: 24),

                  _AuthorRow(vm: vm, t: t),
                  Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Divider(height: 1, color: theme.glassBorder)),

                  HtmlContent(html: vm.contentHtml),
                  const SizedBox(height: 32),
                  _AttachmentsList(attachments: vm.attachments),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// 2. LAYOUT UPDATES (Social / Micro-blog Style)
// ============================================================================
class _UpdatesLayout extends ConsumerWidget {
  final dynamic vm;
  final _NewsDetailPageState parent;
  final bool acknowledged;
  final dynamic theme;

  const _UpdatesLayout(
      {required this.vm,
      required this.parent,
      required this.acknowledged,
      required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = Theme.of(context);
    final isAcked = acknowledged;

    // Botão de ACK INLINE (não flutuante) para o layout social
    final Widget ackButton = vm.ackRequired
        ? Padding(
            padding: const EdgeInsets.only(top: 24),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: isAcked ? null : parent._confirmAck,
                icon: Icon(isAcked ? Icons.check : Icons.thumb_up_alt_outlined),
                label: Text(
                  isAcked ? 'LEITURA CONFIRMADA' : 'CONFIRMAR CIÊNCIA',
                  style: const TextStyle(
                      fontFamily: 'Space Mono', fontWeight: FontWeight.bold),
                ),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: BorderSide(
                      color: isAcked ? Colors.green : theme.neonAccent,
                      width: 2),
                  foregroundColor: isAcked ? Colors.green : theme.neonAccent,
                  shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.zero),
                ),
              ),
            ),
          )
        : const SizedBox.shrink();

    return Scaffold(
      backgroundColor: theme.background,
      extendBodyBehindAppBar: true, // Permite que o conteúdo passe por baixo
      appBar: AppBar(
        backgroundColor: Colors.transparent, // Transparente para o Glass
        elevation: 0,
        leading: BackButton(color: theme.textPrimary),
        title: Text('ATUALIZAÇÃO',
            style: TextStyle(
                color: theme.textPrimary,
                fontWeight: FontWeight.bold,
                fontFamily: 'Space Mono',
                letterSpacing: 1.5)),
        centerTitle: true,
        flexibleSpace: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                color: theme.background.withValues(alpha: 0.8),
                border: Border(
                  bottom: BorderSide(color: theme.glassBorder),
                ),
              ),
            ),
          ),
        ),
        actions: [
          IconButton(
            tooltip: vm.isFavorited
                ? 'Remover dos favoritos'
                : 'Salvar como favorito',
            icon: Icon(
              vm.isFavorited ? Icons.bookmark : Icons.bookmark_border,
              color: vm.isFavorited ? Colors.blue : theme.textPrimary,
            ),
            onPressed: () {
              debugPrint(
                  '[NEWS_DETAIL_PAGE] UpdatesLayout AppBar Favorite button pressed');
              ref
                  .read(newsDetailControllerProvider(parent.widget.id))
                  .toggleFavorite();
            },
          ),
          if (vm.shareEnabled)
            IconButton(
                icon: Icon(Icons.ios_share_rounded, color: theme.textPrimary),
                onPressed: parent._share),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
            20, 120, 20, 40), // Top padding para compensar AppBar
        children: [
          // Cabeçalho Social
          Row(
            children: [
              Avatar(vm.authorAvatarUrl ?? '',
                  name: vm.authorName ?? 'A', size: 48),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vm.authorName ?? 'Empresa',
                      style: t.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.textPrimary)),
                  Text(vm.createdAtStr ?? '',
                      style: t.textTheme.bodySmall?.copyWith(
                          color: theme.textPrimary.withValues(alpha: 0.6))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // 🔥 NOVO POSICIONAMENTO: BARRA DE INTERAÇÕES
          _InteractionsBar(vm: vm, parent: parent, isDark: false),
          Divider(color: theme.glassBorder),
          const SizedBox(height: 16),

          // Texto Principal
          Text(
            vm.title,
            style: t.textTheme.bodyLarge
                ?.copyWith(fontSize: 18, height: 1.5, color: theme.textPrimary),
          ),

          if (vm.contentHtml.isNotEmpty && vm.contentHtml != vm.title) ...[
            const SizedBox(height: 12),
            HtmlContent(html: vm.contentHtml),
          ],

          if (vm.images.isNotEmpty) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                height: vm.images.length == 1 ? 300 : 250,
                child: vm.images.length == 1
                    ? CachedNetworkImage(
                        imageUrl: vm.images.first,
                        fit: BoxFit.cover,
                        width: double.infinity)
                    : ImagesSlider(
                        urls: vm.images,
                        onTap: (idx) => openImageGalleryDialog(
                            context, vm.images,
                            initialIndex: idx)),
              ),
            ),
          ],

          if (vm.attachments.isNotEmpty) ...[
            const SizedBox(height: 20),
            _AttachmentsList(attachments: vm.attachments),
          ],

          const SizedBox(height: 24),
          ackButton, // Botão de Ack INLINE
        ],
      ),
    );
  }
}

// ============================================================================
// 3. LAYOUT MEDIA (Immersive / Instagram Style)
// ============================================================================
class _MediaLayout extends ConsumerWidget {
  final dynamic vm;
  final _NewsDetailPageState parent;
  final bool acknowledged;
  final Widget? Function() buildFab;
  final dynamic theme;

  const _MediaLayout(
      {required this.vm,
      required this.parent,
      required this.acknowledged,
      required this.buildFab,
      required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bgImage = vm.images.isNotEmpty ? vm.images.first : null;

    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      // FAB Flutuante para ACK
      floatingActionButton: buildFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        // Usamos Glass Buttons para visibilidade no fundo escuro
        leading: _GlassBackBtn(),
        actions: [
          _GlassFavoriteBtn(
            isFavorited: vm.isFavorited,
            onTap: () => ref
                .read(newsDetailControllerProvider(parent.widget.id))
                .toggleFavorite(),
          ),
          if (vm.shareEnabled) _GlassShareBtn(onTap: parent._share),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Imagem de Fundo
          if (bgImage != null)
            CachedNetworkImage(imageUrl: bgImage, fit: BoxFit.cover)
          else
            Container(color: Colors.grey.shade900),

          // Overlay Gradiente (Para texto legível)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.3),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.6),
                    Colors.black.withValues(alpha: 0.9),
                  ],
                  stops: const [0.0, 0.4, 0.7, 1.0],
                ),
              ),
            ),
          ),

          // Conteúdo no Rodapé (Scrollable para não cortar o texto)
          Positioned.fill(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Espaço para descer o conteúdo abaixo da AppBar
                    SizedBox(
                        height: MediaQuery.of(context).padding.top +
                            kToolbarHeight +
                            40),

                    // Tags/Chips
                    Wrap(
                      spacing: 8,
                      children: [
                        ...vm.channelNames
                            .map<Widget>((n) => Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: Colors.white10,
                                      borderRadius: BorderRadius.circular(4)),
                                  child: Text(n,
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold)),
                                ))
                            .toList(),

                        // Hashtags
                        if (vm.hashtags != null &&
                            (vm.hashtags as List).isNotEmpty)
                          ...(vm.hashtags as List)
                              .map<Widget>((tag) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                        color: Colors.purple
                                            .withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4)),
                                    child: Text('#$tag',
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold)),
                                  )),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Título
                    Text(
                      vm.title.toString().toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Space Mono',
                        shadows: [Shadow(blurRadius: 4, color: Colors.black)],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Autor
                    Row(
                      children: [
                        Avatar(vm.authorAvatarUrl ?? '',
                            name: vm.authorName ?? '', size: 24),
                        const SizedBox(width: 8),
                        Text(vm.authorName ?? '',
                            style: const TextStyle(
                                color: Colors.white70,
                                fontWeight: FontWeight.w500)),
                        const SizedBox(width: 16),
                        Text(vm.createdAtStr ?? '',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Conteúdo Adicional HTML
                    if (vm.contentHtml.isNotEmpty)
                      HtmlContent(html: vm.contentHtml),

                    const SizedBox(height: 24),

                    // Ações (Com tema Dark)
                    Theme(
                        data: ThemeData.dark(),
                        child: _InteractionsBar(
                            vm: vm, parent: parent, isDark: true)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// HELPERS & WIDGETS COMUNS
// ============================================================================

class _AttachmentsList extends StatelessWidget {
  final List attachments;
  const _AttachmentsList({required this.attachments});
  @override
  Widget build(BuildContext context) {
    if (attachments.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ANEXOS',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold, fontFamily: 'Space Mono')),
        const SizedBox(height: 12),
        ...attachments.map((att) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.file_present_rounded,
                      color: Colors.blue, size: 20),
                ),
                title: Text(att.name ?? 'Arquivo',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontFamily: 'Space Mono', fontWeight: FontWeight.w500)),
                trailing: const Icon(Icons.download_rounded,
                    size: 20, color: Colors.grey),
                onTap: () => openWebSheet(context, att.url, title: 'Anexo'),
              ),
            )),
      ],
    );
  }
}

class _GlassBackBtn extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        shape: BoxShape.circle,
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
      ),
      child: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
        onPressed: () => context.pop(),
      ),
    );
  }
}

class _GlassFavoriteBtn extends StatelessWidget {
  final bool isFavorited;
  final VoidCallback onTap;
  const _GlassFavoriteBtn({required this.isFavorited, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        shape: BoxShape.circle,
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
      ),
      child: IconButton(
        icon: Icon(
          isFavorited ? Icons.bookmark : Icons.bookmark_border,
          color: isFavorited ? Colors.blue : Colors.white,
          size: 20,
        ),
        onPressed: () {
          debugPrint('[NEWS_DETAIL_PAGE] GlassFavoriteBtn pressed');
          onTap();
        },
      ),
    );
  }
}

class _GlassShareBtn extends StatelessWidget {
  final VoidCallback onTap;
  const _GlassShareBtn({required this.onTap});
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.4),
        shape: BoxShape.circle,
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1),
      ),
      child: IconButton(
        icon: const Icon(Icons.ios_share, color: Colors.white, size: 20),
        onPressed: onTap,
      ),
    );
  }
}

class _AuthorRow extends StatelessWidget {
  final dynamic vm;
  final ThemeData t;
  const _AuthorRow({required this.vm, required this.t});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Avatar(vm.authorAvatarUrl ?? '', name: vm.authorName ?? '', size: 40),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(vm.authorName ?? 'Autor',
                style: t.textTheme.titleSmall
                    ?.copyWith(fontWeight: FontWeight.bold)),
            Text(vm.createdAtStr ?? '',
                style: t.textTheme.bodySmall?.copyWith(color: Colors.grey)),
          ],
        ),
      ],
    );
  }
}

class _InteractionsBar extends ConsumerWidget {
  final dynamic vm;
  final _NewsDetailPageState parent;
  final bool isDark; // Para adaptar cor do ícone

  const _InteractionsBar(
      {required this.vm, required this.parent, this.isDark = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ctrl = ref.read(newsDetailControllerProvider(parent.widget.id));
    final color = isDark ? Colors.white : Colors.black87;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          if (vm.allowReactions)
            ReactionAction(
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

          if (vm.allowComments)
            IconButton(
              icon: Icon(Icons.mode_comment_outlined,
                  color: vm.hasCommented ? Colors.blue : color),
              onPressed: () async {
                await openCommentsSheet(context,
                    previews: (vm.previewComments as List)
                        .map((p) => CommentPreview(
                            name: p.name, avatar: p.avatar, text: p.text))
                        .toList()
                        .cast<CommentPreview>(), onCompose: () async {
                  // Lógica que estava no antigo _NewsDetailPageState
                  final text = await openCommentComposer(context);
                  if (text == null || text.trim().isEmpty) return;
                  try {
                    // Lógica de interação: Salva o comentário
                    await ctrl.comment(text.trim());
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Comentário enviado!')));
                    }
                    // Força a atualização dos contadores na lista
                    ref.read(feedVersionProvider.notifier).state++;
                  } catch (_) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                          content: Text('Falha ao enviar comentário')));
                    }
                  }
                }); // Fim do openCommentsSheet
              },
            ),

          if (vm.shareEnabled)
            IconButton(
              icon: Icon(Icons.ios_share_rounded,
                  color: vm.hasShared ? Colors.blue : color),
              onPressed: parent._share,
            ),

          // Botão de Bookmark (placeholder)
          // Botão de Bookmark
          IconButton(
            tooltip: vm.isFavorited
                ? 'Remover dos favoritos'
                : 'Salvar como favorito',
            icon: Icon(
              vm.isFavorited ? Icons.bookmark : Icons.bookmark_outline,
              color: vm.isFavorited ? Colors.blue : color,
            ),
            onPressed: () {
              debugPrint(
                  '[NEWS_DETAIL_PAGE] InteractionsBar Favorite button pressed');
              ctrl.toggleFavorite();
            },
          ),
        ],
      ),
    );
  }
}

class _CircleActionButtonPlain extends StatelessWidget {
  const _CircleActionButtonPlain({
    required this.icon,
    required this.onTap,
    this.bg,
    required this.iconSize,
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

class _NewsTheme {
  final Color background;
  final Color textPrimary;
  final Color neonAccent;
  final Color glassBorder;

  _NewsTheme({
    required this.background,
    required this.textPrimary,
    required this.neonAccent,
    required this.glassBorder,
  });
}
