import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';

import '../../core/providers.dart';

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
        final data = (hasData ? snap.data : null);
        final title =
            ((data?['title'] ?? data?['headline']) as String?)?.trim();
        final content = (data?['content'] as String?)?.trim();

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
            title: Tooltip(
              message: (title?.isNotEmpty == true) ? title! : 'Notícia',
              child: Text(
                (title?.isNotEmpty == true) ? title! : 'Notícia',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
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
                  if ((content ?? '').isNotEmpty)
                    HtmlWidget(
                      content!,
                      textStyle: theme.textTheme.bodyMedium,
                      renderMode: RenderMode.column,
                      customStylesBuilder: (element) {
                        switch (element.localName) {
                          case 'h1':
                          case 'h2':
                          case 'h3':
                            return {'margin': '0 0 8px 0'};
                          case 'p':
                            return {
                              'margin': '0 0 12px 0',
                              'line-height': '1.5',
                            };
                          case 'ul':
                          case 'ol':
                            return {'margin': '0 0 12px 24px'};
                          case 'img':
                            return {'margin': '8px 0'};
                        }
                        return null;
                      },
                    )
                  else
                    const Text('Sem conteúdo.'),
                ],
              );
            },
          ),
        );
      },
    );
  }
}
