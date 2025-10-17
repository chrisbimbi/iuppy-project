import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

Future<void> openInAppUrl(
  BuildContext context, {
  required String url,
  String? title,
}) async {
  // Em Android 10+ o WebView já é padrão; iOS usa WKWebView por baixo.
  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.92,
        minChildSize: 0.6,
        maxChildSize: 0.98,
        builder: (_, controller) {
          final webController = WebViewController()
            ..setJavaScriptMode(JavaScriptMode.unrestricted)
            ..setBackgroundColor(Colors.transparent)
            ..setNavigationDelegate(
              NavigationDelegate(
                onNavigationRequest: (req) {
                  // permite navegação interna
                  return NavigationDecision.navigate;
                },
              ),
            )
            ..loadRequest(Uri.parse(url));

          return Column(
            children: [
              // Header sheet
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 8, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        (title ?? url),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Fechar',
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              // WebView
              Expanded(
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  child: WebViewWidget(controller: webController),
                ),
              ),
            ],
          );
        },
      );
    },
  );
}

/// Helper para iframes do YouTube (place-holder com "Assistir")
Widget youtubePlaceholder({
  required BuildContext context,
  required String src,
}) {
  return AspectRatio(
    aspectRatio: 16 / 9,
    child: InkWell(
      onTap: () => openInAppUrl(context, url: src, title: 'YouTube'),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // um fundo simples
          Container(color: Colors.black12),
          const Center(child: Icon(Icons.play_circle_fill, size: 64)),
        ],
      ),
    ),
  );
}
