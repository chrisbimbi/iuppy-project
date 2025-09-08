// lib/features/surveys/survey_detail_page.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';

import '../../core/providers.dart';

class SurveyDetailPage extends ConsumerWidget {
  const SurveyDetailPage({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.read(surveysRepoProvider);

    return FutureBuilder<Map<String, dynamic>>(
      future: repo.getById(id),
      builder: (context, snap) {
        final hasData =
            snap.connectionState == ConnectionState.done && snap.hasData;
        final data = (hasData ? snap.data : null);
        final title = (data?['title'] as String?)?.trim();
        final description = (data?['description'] as String?)?.trim();

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
            title: Text(title?.isNotEmpty == true ? title! : 'Enquete'),
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
                    'Falha ao carregar a enquete.\n${snap.error}',
                    style: const TextStyle(color: Colors.red),
                  ),
                );
              }

              final theme = Theme.of(context);

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if ((description ?? '').isNotEmpty)
                    HtmlWidget(
                      description!,
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
                              'line-height': '1.4'
                            };
                          case 'ul':
                          case 'ol':
                            return {'margin': '0 0 12px 24px'};
                        }
                        return null;
                      },
                    ),
                  const Divider(height: 24),
                  Text('Perguntas', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ..._buildQuestionsPreview(data, theme),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Responder (implementar fluxo)'),
                        ),
                      );
                    },
                    child: const Text('Responder'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  List<Widget> _buildQuestionsPreview(
      Map<String, dynamic>? data, ThemeData theme) {
    final List qs = (data?['questions'] as List?) ?? const [];
    if (qs.isEmpty) return [const Text('Nenhuma pergunta.')];

    return qs.map((e) {
      final m = Map<String, dynamic>.from(e as Map);
      final q = (m['questionText'] as String?) ?? (m['label'] as String?) ?? '';
      final t = (m['type'] as String?) ?? 'text';
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.help_outline),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '$q\n(tipo: $t)',
                style: theme.textTheme.bodyMedium?.copyWith(height: 1.3),
              ),
            ),
          ],
        ),
      );
    }).toList();
  }
}
