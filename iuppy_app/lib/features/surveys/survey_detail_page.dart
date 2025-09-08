import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';

class SurveyDetailPage extends ConsumerStatefulWidget {
  final String id;
  const SurveyDetailPage({required this.id, super.key});

  @override
  ConsumerState<SurveyDetailPage> createState() => _SurveyDetailPageState();
}

class _SurveyDetailPageState extends ConsumerState<SurveyDetailPage> {
  final Map<String, dynamic> _answers = {};
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
          tooltip: 'Voltar',
        ),
        title: const Text('Enquete'),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: ref.read(surveysRepoProvider).getById(widget.id),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Erro: ${snap.error}'));
          }
          final survey = snap.data ?? const <String, dynamic>{};
          final List questions = (survey['questions'] as List?) ?? const [];

          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    survey['title'] as String? ?? '',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.separated(
                    itemCount: questions.length,
                    separatorBuilder: (_, __) => const Divider(height: 24),
                    itemBuilder: (_, i) {
                      final q = Map<String, dynamic>.from(questions[i] as Map);
                      final qid = q['id'] as String;
                      final qtype = (q['type'] as String?) ?? 'text';
                      final qlabel = (q['text'] as String?) ?? 'Pergunta';
                      final List options = (q['options'] as List?) ?? const [];

                      switch (qtype) {
                        case 'single_choice':
                          return _SingleChoice(
                            label: qlabel,
                            options: options.cast<String>(),
                            value: _answers[qid] as String?,
                            onChanged: (v) => setState(() => _answers[qid] = v),
                          );
                        case 'multiple_choice':
                          final sel =
                              (_answers[qid] as List?)?.cast<String>() ??
                                  <String>[];
                          return _MultiChoice(
                            label: qlabel,
                            options: options.cast<String>(),
                            values: sel,
                            onChanged: (list) =>
                                setState(() => _answers[qid] = list),
                          );
                        case 'text':
                        default:
                          return _TextAnswer(
                            label: qlabel,
                            value: (_answers[qid] as String?) ?? '',
                            onChanged: (v) => _answers[qid] = v,
                          );
                      }
                    },
                  ),
                ),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: _sending
                      ? null
                      : () async {
                          setState(() => _sending = true);
                          try {
                            // formato genérico: { answers: [{questionId, value}] }
                            final body = {
                              'answers': _answers.entries
                                  .map((e) => {
                                        'questionId': e.key,
                                        'value': e.value,
                                      })
                                  .toList(),
                            };
                            await ref
                                .read(surveysRepoProvider)
                                .sendResponse(widget.id, body);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('Resposta enviada!')),
                              );
                              context.pop();
                            }
                          } catch (e) {
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Erro ao enviar: $e')),
                              );
                            }
                          } finally {
                            if (mounted) setState(() => _sending = false);
                          }
                        },
                  icon: _sending
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send),
                  label: const Text('Enviar resposta'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _TextAnswer extends StatelessWidget {
  final String label;
  final String value;
  final ValueChanged<String> onChanged;
  const _TextAnswer(
      {required this.label, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        TextField(
          controller: TextEditingController(text: value),
          onChanged: onChanged,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Sua resposta...'),
        ),
      ],
    );
  }
}

class _SingleChoice extends StatelessWidget {
  final String label;
  final List<String> options;
  final String? value;
  final ValueChanged<String?> onChanged;
  const _SingleChoice({
    required this.label,
    required this.options,
    required this.value,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...options.map((o) => RadioListTile<String>(
              title: Text(o),
              value: o,
              groupValue: value,
              onChanged: onChanged,
            )),
      ],
    );
  }
}

class _MultiChoice extends StatelessWidget {
  final String label;
  final List<String> options;
  final List<String> values;
  final ValueChanged<List<String>> onChanged;
  const _MultiChoice({
    required this.label,
    required this.options,
    required this.values,
    required this.onChanged,
  });
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...options.map((o) {
          final selected = values.contains(o);
          return CheckboxListTile(
            title: Text(o),
            value: selected,
            onChanged: (v) {
              final next = [...values];
              if (v == true && !next.contains(o)) next.add(o);
              if (v == false) next.remove(o);
              onChanged(next);
            },
          );
        }),
      ],
    );
  }
}
