// lib/features/surveys/survey_detail_page.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/surveys/survey_providers.dart';

import '../../core/providers.dart';
import 'widgets/question_widgets.dart';

class SurveyDetailPage extends ConsumerStatefulWidget {
  final String id;
  const SurveyDetailPage({super.key, required this.id});

  @override
  ConsumerState<SurveyDetailPage> createState() => _SurveyDetailPageState();
}

class _SurveyDetailPageState extends ConsumerState<SurveyDetailPage> {
  final _formKey = GlobalKey<FormState>();
  final _scroll = ScrollController();

  // Respostas locais
  final Map<String, dynamic> _answers = {};

  bool _sending = false;
  bool _dirty = false;
  bool _submittedNow = false;

  // Modo Leitura (se já respondeu)
  bool _isReadOnly = false;

  @override
  void initState() {
    super.initState();
    // Recupera respostas do disco
    Future.microtask(() async {
      final store = ref.read(localSurveyStoreProvider);

      // Busca as respostas salvas (JSON)
      final savedAnswers = await store.getSubmissionAnswers(widget.id);

      if (savedAnswers != null && savedAnswers.isNotEmpty) {
        if (mounted) {
          setState(() {
            _isReadOnly = true;
            // Popula o mapa _answers
            for (var item in savedAnswers) {
              if (item is Map) {
                final qId = item['questionId']?.toString();
                final val = item['answer'];
                if (qId != null && val != null) {
                  // Converte lista se for Set
                  if (val is List) {
                    _answers[qId] = val.map((e) => e.toString()).toSet();
                  } else {
                    _answers[qId] = val;
                  }
                }
              }
            }
          });
        }
      }
    });
  }

  Future<bool> _maybeLeave() async {
    if (_isReadOnly || !_dirty || _submittedNow) return true;
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Descartar respostas?',
            style: TextStyle(fontFamily: 'Space Mono')),
        content: const Text(
            'Você fez alterações que ainda não foram enviadas. Tem certeza de que deseja sair?',
            style: TextStyle(fontFamily: 'Space Mono')),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('CONTINUAR',
                  style: TextStyle(fontFamily: 'Space Mono'))),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(backgroundColor: Colors.black),
              child: const Text('DESCARTAR',
                  style: TextStyle(fontFamily: 'Space Mono'))),
        ],
      ),
    );
    return leave ?? false;
  }

  Future<void> _handleBack() async {
    if (await _maybeLeave() && mounted) {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/home');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final repo = ref.watch(surveysRepoProvider);

    return FutureBuilder<Map<String, dynamic>>(
        future: repo.getById(widget.id),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Scaffold(
                backgroundColor: Colors.white,
                appBar: AppBar(
                    leading: IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: _handleBack),
                    title: const Text('Carregando...',
                        style: TextStyle(fontFamily: 'Space Mono'))),
                body: const Center(
                    child: CircularProgressIndicator(color: Colors.black)));
          }
          if (snapshot.hasError) {
            return Scaffold(
                backgroundColor: Colors.white,
                appBar: AppBar(
                    leading: IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: _handleBack),
                    title: const Text('Enquete',
                        style: TextStyle(fontFamily: 'Space Mono'))),
                body: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text('Erro ao carregar: ${snapshot.error}')));
          }

          final survey = snapshot.data ?? {};
          final title = (survey['title'] ?? '').toString();
          final description = (survey['description'] ?? '').toString();
          final List qs = (survey['questions'] as List? ?? []).toList();

          qs.sort((a, b) =>
              ((a['order'] ?? 0) as int).compareTo((b['order'] ?? 0) as int));

          return PopScope(
            canPop: false,
            onPopInvokedWithResult: (didPop, _) async {
              if (!didPop) await _handleBack();
            },
            child: Scaffold(
              backgroundColor: Colors.white,
              appBar: AppBar(
                leading: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black87),
                    onPressed: _handleBack),
                title: Text(title.isEmpty ? 'Enquete' : title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        color: Colors.black87,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Space Mono')),
                backgroundColor: Colors.transparent,
                elevation: 0,
                flexibleSpace: ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.8),
                        border: Border(
                          bottom: BorderSide(color: Colors.grey.shade200),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              body: Form(
                key: _formKey,
                child: ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 40),
                  children: [
                    if (_isReadOnly)
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green.shade200)),
                        child: Row(children: [
                          Icon(Icons.check_circle,
                              color: Colors.green.shade700),
                          const SizedBox(width: 12),
                          const Expanded(
                              child: Text('Você já respondeu esta enquete.',
                                  style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Space Mono')))
                        ]),
                      ),

                    if (description.isNotEmpty) ...[
                      Text(description,
                          style: TextStyle(
                              color: Colors.grey[700],
                              fontSize: 14,
                              fontFamily: 'Space Mono')),
                      const SizedBox(height: 24)
                    ],

                    // Renderiza perguntas (desabilitadas se readonly)
                    IgnorePointer(
                      ignoring: _isReadOnly,
                      child: Column(
                          children:
                              qs.map((q) => _buildQuestionCard(q)).toList()),
                    ),

                    const SizedBox(height: 32),

                    // Botão Enviar só aparece se NÃO for readonly
                    if (!_isReadOnly)
                      SafeArea(
                        top: false,
                        child: SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton.icon(
                            onPressed:
                                _sending ? null : () => _onSubmit(survey),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              elevation: 4,
                              shadowColor: Colors.black.withValues(alpha: 0.4),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16)),
                            ),
                            icon: _sending
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.send_rounded),
                            label: Text(
                                _sending ? 'ENVIANDO...' : 'ENVIAR RESPOSTA',
                                style: const TextStyle(
                                    fontFamily: 'Space Mono',
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1)),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          );
        });
  }

  Widget _buildQuestionCard(Map<String, dynamic> q) {
    final qid = (q['id'] ?? '').toString();
    final type = (q['type'] ?? '').toString().toLowerCase().trim();
    final txt = (q['questionText'] ?? '').toString();
    final required = (q['isRequired'] ?? false) == true;
    final List<String> options =
        (q['options'] as List?)?.map((e) => e.toString()).toList() ?? const [];

    Widget input;
    // Para visibilidade melhor no read-only, usamos cores mais fortes se selecionado
    final activeColor = _isReadOnly ? Colors.black54 : null;

    switch (type) {
      case 'single':
        final current = (_answers[qid] as String?) ?? '';
        input = Column(
            children: options
                .map((opt) => RadioListTile<String>(
                      contentPadding: EdgeInsets.zero,
                      title: Text(opt,
                          style: TextStyle(
                              color: activeColor, fontFamily: 'Space Mono')),
                      value: opt,
                      groupValue: current,
                      onChanged: (v) => setState(() {
                        _answers[qid] = v ?? '';
                        _dirty = true;
                      }),
                      activeColor: _isReadOnly ? Colors.grey : Colors.black,
                    ))
                .toList());
        break;
      case 'multi':
        final current = (_answers[qid] as Set<String>?) ?? <String>{};
        input = Column(
            children: options
                .map((opt) => CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(opt,
                          style: TextStyle(
                              color: activeColor, fontFamily: 'Space Mono')),
                      value: current.contains(opt),
                      onChanged: (v) => setState(() {
                        final set = <String>{...current};
                        if (v == true) {
                          set.add(opt);
                        } else {
                          set.remove(opt);
                        }
                        _answers[qid] = set;
                        _dirty = true;
                      }),
                      activeColor: _isReadOnly ? Colors.grey : Colors.black,
                    ))
                .toList());
        break;
      case 'text':
        final controller =
            TextEditingController(text: (_answers[qid] as String?) ?? '');
        input = TextFormField(
          controller: controller,
          maxLines: 3,
          style: TextStyle(color: activeColor, fontFamily: 'Space Mono'),
          decoration: InputDecoration(
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.grey.shade300)),
              focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.black)),
              filled: true,
              fillColor: Colors.white),
          onChanged: (v) {
            _answers[qid] = v;
            _dirty = true;
          },
          validator: (v) => (required && (v == null || v.trim().isEmpty))
              ? 'Obrigatório'
              : null,
        );
        break;
      case 'stars':
        input = StarRating(
            value: (_answers[qid] as int?) ?? 0,
            onChanged: (v) => setState(() {
                  _answers[qid] = v;
                  _dirty = true;
                }));
        break;
      case 'nps':
        input = NpsSlider(
            value: (_answers[qid] as int?) ?? 0,
            onChanged: (v) => setState(() {
                  _answers[qid] = v;
                  _dirty = true;
                }));
        break;
      default:
        input = const Text('Tipo não suportado');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _isReadOnly ? Colors.grey.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: _isReadOnly
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Flexible(
                child: Text(txt,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: activeColor,
                        fontFamily: 'Space Mono',
                        fontWeight: FontWeight.bold))),
            if (required && !_isReadOnly)
              const Padding(
                  padding: EdgeInsets.only(left: 6),
                  child: Text('*', style: TextStyle(color: Colors.red)))
          ]),
          const SizedBox(height: 16),
          input,
        ],
      ),
    );
  }

  Future<void> _onSubmit(Map<String, dynamic> survey) async {
    final List qs = (survey['questions'] as List? ?? []);
    bool hasError = false;

    for (final q in qs) {
      final qid = (q['id'] ?? '').toString();
      final type = (q['type'] ?? '').toString().toLowerCase().trim();
      final required = (q['isRequired'] ?? false) == true;
      final ans = _answers[qid];

      if (required) {
        if ((type == 'text' || type == 'single') &&
            (ans == null || (ans as String).isEmpty)) {
          hasError = true;
        }
        if (type == 'multi' && (ans == null || (ans as Set).isEmpty)) {
          hasError = true;
        }
        if ((type == 'stars' || type == 'nps') &&
            (ans == null || (ans as int) <= 0)) {
          hasError = true;
        }
      }
    }

    if (hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preencha os campos obrigatórios.')));
      return;
    }

    final answersPayload = <Map<String, dynamic>>[];
    for (final q in qs) {
      final qid = (q['id'] ?? '').toString();
      if (!_answers.containsKey(qid)) continue;
      final val = _answers[qid];
      answersPayload
          .add({'questionId': qid, 'answer': val is Set ? val.toList() : val});
    }

    setState(() => _sending = true);
    try {
      await ref.read(surveysRepoProvider).sendResponse(
            surveyId: (survey['id'] ?? '').toString(),
            answers: answersPayload,
          );

      // 🔥 SALVA LOCALMENTE O PAYLOAD PARA VISUALIZAÇÃO FUTURA
      await ref.read(localSurveyStoreProvider).markSubmitted(
          (survey['id'] ?? '').toString(),
          answersPayload // <--- Salva as respostas!
          );

      ref.invalidate(surveysListProvider);
      ref.invalidate(newSurveysCountProvider);

      if (!mounted) return;
      _submittedNow = true;
      _dirty = false;

      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Sucesso!',
              style: TextStyle(fontFamily: 'Space Mono')),
          content: const Text('Resposta enviada.',
              style: TextStyle(fontFamily: 'Space Mono')),
          actions: [
            TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/surveys');
                },
                child: const Text('OK',
                    style: TextStyle(
                        fontFamily: 'Space Mono',
                        fontWeight: FontWeight.bold))),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro ao enviar: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
