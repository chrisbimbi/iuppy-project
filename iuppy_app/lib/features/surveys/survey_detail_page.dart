import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';
import 'survey_providers.dart';
import 'widgets/question_widgets.dart';

class SurveyDetailPage extends ConsumerStatefulWidget {
  final String id;
  const SurveyDetailPage({super.key, required this.id});

  @override
  ConsumerState<SurveyDetailPage> createState() => _SurveyDetailPageState();
}

class _SurveyDetailPageState extends ConsumerState<SurveyDetailPage> {
  final _formKey = GlobalKey<FormState>();

  /// respostas em memória: questionId -> dynamic
  /// text => String
  /// single => String
  /// multi => Set<String>
  /// stars => int
  /// nps => int
  final Map<String, dynamic> _answers = {};

  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    final surveyAsync = ref.watch(surveyDetailProvider(widget.id));

    return surveyAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
            tooltip: 'Voltar',
          ),
          title: const Text('Carregando...'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () =>
                context.canPop() ? context.pop() : context.go('/home'),
            tooltip: 'Voltar',
          ),
          title: const Text('Enquete'),
        ),
        body: Center(child: Text('Erro ao carregar: $e')),
      ),
      data: (survey) {
        final title = (survey['title'] ?? '').toString();
        final description = (survey['description'] ?? '').toString();
        final List qs = (survey['questions'] as List? ?? []).toList();

        // ordena por "order"
        qs.sort((a, b) {
          final ao = (a['order'] ?? 0) as int;
          final bo = (b['order'] ?? 0) as int;
          return ao.compareTo(bo);
        });

        return Scaffold(
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () =>
                  context.canPop() ? context.pop() : context.go('/home'),
              tooltip: 'Voltar',
            ),
            title: Tooltip(
              message: title.isEmpty ? 'Enquete' : title,
              child: Text(
                title.isEmpty ? 'Enquete' : title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
          body: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              children: [
                if (description.isNotEmpty) ...[
                  Text(description),
                  const SizedBox(height: 12),
                ],
                for (final q in qs) _buildQuestionCard(q),
                const SizedBox(height: 24),
                SafeArea(
                  top: false,
                  child: FilledButton.icon(
                    onPressed: _sending ? null : () => _onSubmit(survey),
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.send_rounded),
                    label: Text(_sending ? 'Enviando...' : 'Enviar'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> q) {
    final qid = (q['id'] ?? '').toString();
    final type = (q['type'] ?? '').toString().toLowerCase().trim();
    final txt = (q['questionText'] ?? '').toString();
    final desc = (q['description'] ?? '').toString();
    final required = (q['isRequired'] ?? false) == true;
    final List<String> options =
        (q['options'] as List?)?.map((e) => e.toString()).toList() ?? const [];

    Widget input;

    switch (type) {
      case 'single':
        final current = (_answers[qid] as String?) ?? '';
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: options.map((opt) {
            return RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              title: Text(opt),
              value: opt,
              groupValue: current,
              onChanged: (v) {
                setState(() => _answers[qid] = v ?? '');
              },
            );
          }).toList(),
        );
        break;

      case 'multi':
        final current = (_answers[qid] as Set<String>?) ?? <String>{};
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: options.map((opt) {
            final checked = current.contains(opt);
            return CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(opt),
              value: checked,
              onChanged: (v) {
                setState(() {
                  final set = <String>{...current};
                  if (v == true) {
                    set.add(opt);
                  } else {
                    set.remove(opt);
                  }
                  _answers[qid] = set;
                });
              },
            );
          }).toList(),
        );
        break;

      case 'text':
        final controller =
            TextEditingController(text: (_answers[qid] as String?) ?? '');
        input = TextFormField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Digite sua resposta',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _answers[qid] = v,
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Este campo é obrigatório';
            }
            return null;
          },
        );
        break;

      case 'stars':
        final val = (_answers[qid] as int?) ?? 0;
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StarRating(
              value: val,
              onChanged: (v) => setState(() => _answers[qid] = v),
            ),
            if (required && val == 0)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Selecione uma quantidade de estrelas',
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
          ],
        );
        break;

      case 'nps': // 0..10
        final val = (_answers[qid] as int?) ?? 0;
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            NpsSlider(
              value: val,
              onChanged: (v) => setState(() => _answers[qid] = v),
            ),
            if (required && val < 0)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text(
                  'Escolha um valor entre 0 e 10',
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
          ],
        );
        break;

      default:
        input = Text('Tipo não suportado: $type');
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Flexible(
                  child: Text(
                    txt.isEmpty ? 'Pergunta' : txt,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (required)
                  const Padding(
                    padding: EdgeInsets.only(left: 6),
                    child: Text('*', style: TextStyle(color: Colors.red)),
                  ),
              ],
            ),
            if (desc.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(desc, style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: 12),
            input,
          ],
        ),
      ),
    );
  }

  Future<void> _onSubmit(Map<String, dynamic> survey) async {
    // valida todos obrigatórios
    final List qs = (survey['questions'] as List? ?? []);
    bool hasError = false;

    for (final q in qs) {
      final qid = (q['id'] ?? '').toString();
      final type = (q['type'] ?? '').toString().toLowerCase().trim();
      final required = (q['isRequired'] ?? false) == true;
      final ans = _answers[qid];

      if (required) {
        if (type == 'text') {
          if (ans == null || (ans as String).trim().isEmpty) {
            hasError = true;
          }
        } else if (type == 'single') {
          if (ans == null || (ans as String).isEmpty) hasError = true;
        } else if (type == 'multi') {
          if (ans == null || (ans as Set).isEmpty) hasError = true;
        } else if (type == 'stars') {
          if (ans == null || (ans as int) <= 0) hasError = true;
        } else if (type == 'nps') {
          if (ans == null) hasError = true;
        }
      }
    }

    if (!(_formKey.currentState?.validate() ?? true)) {
      hasError = true;
    }

    if (hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha os campos obrigatórios.')),
      );
      return;
    }

    // monta answers (sem "surveyId" aqui; passamos no método)
    final answers = <Map<String, dynamic>>[];
    for (final q in qs) {
      final qid = (q['id'] ?? '').toString();
      if (!_answers.containsKey(qid)) continue;
      final val = _answers[qid];
      if (val is Set<String>) {
        answers.add({'questionId': qid, 'answer': val.toList()});
      } else {
        answers.add({'questionId': qid, 'answer': val});
      }
    }

    setState(() => _sending = true);
    try {
      await ref.read(surveysRepoProvider).sendResponse(
            surveyId: (survey['id'] ?? '').toString(),
            answers: answers,
            // userId: <se tiver depois>,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Resposta enviada! Obrigado 🙌')),
      );
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/home');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Falha ao enviar: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
