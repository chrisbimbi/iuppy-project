import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

Future<void> openWebSheet(BuildContext context, String url,
    {String? title}) async {
  final controller = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted)
    ..setBackgroundColor(Colors.transparent)
    ..setNavigationDelegate(NavigationDelegate(
      onPageStarted: (_) {},
      onPageFinished: (_) {},
    ))
    ..loadRequest(Uri.parse(url));

  bool isLoading = true;

  await showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) {
      return StatefulBuilder(
        builder: (ctx, setState) {
          return ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Scaffold(
              appBar: AppBar(
                title: Text(title ?? Uri.parse(url).host),
                actions: [
                  IconButton(
                    tooltip: 'Compartilhar',
                    icon: const Icon(Icons.ios_share_rounded),
                    onPressed: () => Share.share(url),
                  ),
                  IconButton(
                    tooltip: 'Abrir no navegador',
                    icon: const Icon(Icons.open_in_browser_rounded),
                    onPressed: () => launchUrl(Uri.parse(url),
                        mode: LaunchMode.externalApplication),
                  ),
                ],
              ),
              body: Stack(
                children: [
                  WebViewWidget(
                    controller: controller
                      ..setNavigationDelegate(NavigationDelegate(
                        onPageStarted: (_) => setState(() => isLoading = true),
                        onPageFinished: (_) =>
                            setState(() => isLoading = false),
                      )),
                  ),
                  if (isLoading)
                    const Center(child: CircularProgressIndicator()),
                ],
              ),
            ),
          );
        },
      );
    },
  );
}
