import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import '../widgets/web_sheet.dart';
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
