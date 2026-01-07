import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import '../widgets/web_sheet.dart';
import '../widgets/image_gallery.dart';
import '../widgets/video_dialog.dart';

class HtmlContent extends StatelessWidget {
  const HtmlContent({super.key, required this.html});
  final String html;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return HtmlWidget(
      html,
      textStyle: theme.textTheme.bodyMedium!.copyWith(color: Colors.black),
      renderMode: RenderMode.column,
      onTapUrl: (url) {
        openWebSheet(context, url);
        return true;
      },
      customWidgetBuilder: (element) {
        // 1. Tratamento de Imagens
        if (element.localName == 'img') {
          final src = element.attributes['src'];
          if (src != null && src.isNotEmpty) {
            final parentIsLink = element.parent?.localName == 'a';
            final linkUrl =
                parentIsLink ? element.parent?.attributes['href'] : null;

            return GestureDetector(
              onTap: () {
                if (linkUrl != null) {
                  // Tem link: Mostra BottomSheet
                  showModalBottomSheet(
                    context: context,
                    builder: (ctx) => SafeArea(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ListTile(
                            leading: const Icon(Icons.image),
                            title: const Text('Abrir imagem'),
                            onTap: () {
                              Navigator.pop(ctx);
                              openImageGalleryDialog(context, [src],
                                  initialIndex: 0);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.link),
                            title: const Text('Abrir link'),
                            subtitle: Text(linkUrl,
                                maxLines: 1, overflow: TextOverflow.ellipsis),
                            onTap: () async {
                              Navigator.pop(ctx);
                              // Pequeno delay para garantir que o BottomSheet feche
                              await Future.delayed(
                                  const Duration(milliseconds: 200));

                              if (context.mounted) {
                                var url = linkUrl.trim();
                                if (!url.startsWith('http')) {
                                  url = 'https://$url';
                                }
                                openWebSheet(context, url);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                } else {
                  // Sem link: Abre galeria direto
                  openImageGalleryDialog(context, [src], initialIndex: 0);
                }
              },
              child: Image.network(src,
                  fit: BoxFit
                      .cover), // Simples por enquanto, ideal seria CachedNetworkImage
            );
          }
        }

        // 2. Tratamento de IFrames (Youtube)
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
                      child: const Icon(Icons.play_circle_fill, size: 64),
                    ),
                    Positioned.fill(
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                            onTap: () => openYoutubeDialog(context, id)),
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
    );
  }
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
