import 'package:flutter/material.dart';
import 'package:iuppy_app/features/surveys/widgets/question_widgets.dart';

class SurveyRenderer extends StatefulWidget {
  final Map<String, dynamic> surveyConfig;
  final Function(Map<String, dynamic> answers) onSubmit;
  final bool isReadOnly;
  final Map<String, dynamic>? initialAnswers;

  const SurveyRenderer({
    super.key,
    required this.surveyConfig,
    required this.onSubmit,
    this.isReadOnly = false,
    this.initialAnswers,
  });

  @override
  State<SurveyRenderer> createState() => _SurveyRendererState();
}

class _SurveyRendererState extends State<SurveyRenderer> {
  final Map<String, dynamic> _answers = {};
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialAnswers != null) {
      _answers.addAll(widget.initialAnswers!);
    }
  }

  Widget _buildQuestionCard(Map<String, dynamic> q) {
    final qid = (q['id'] ?? '').toString();
    final type = (q['type'] ?? '').toString().toLowerCase().trim();
    final txt = (q['questionText'] ?? '').toString();
    final required = (q['isRequired'] ?? false) == true;
    final List<String> options =
        (q['options'] as List?)?.map((e) => e.toString()).toList() ?? const [];

    Widget input;
    final activeColor = widget.isReadOnly ? Colors.black54 : null;

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
                      onChanged: widget.isReadOnly
                          ? null
                          : (v) => setState(() {
                                _answers[qid] = v ?? '';
                                _dirty = true;
                              }),
                      activeColor:
                          widget.isReadOnly ? Colors.grey : Colors.black,
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
                      onChanged: widget.isReadOnly
                          ? null
                          : (v) => setState(() {
                                final set = <String>{...current};
                                if (v == true) {
                                  set.add(opt);
                                } else {
                                  set.remove(opt);
                                }
                                _answers[qid] = set;
                                _dirty = true;
                              }),
                      activeColor:
                          widget.isReadOnly ? Colors.grey : Colors.black,
                    ))
                .toList());
        break;
      case 'text':
        input = TextFormField(
          initialValue: (_answers[qid] as String?) ?? '',
          readOnly: widget.isReadOnly,
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
            onChanged: widget.isReadOnly
                ? null
                : (int v) => setState(() {
                      _answers[qid] = v;
                      _dirty = true;
                    }));
        break;
      case 'nps':
        input = NpsSlider(
            value: (_answers[qid] as int?) ?? 0,
            onChanged: widget.isReadOnly
                ? null
                : (int v) => setState(() {
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
        color: widget.isReadOnly ? Colors.grey.shade50 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: widget.isReadOnly
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
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
            if (required && !widget.isReadOnly)
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

  void _submit() {
    final List qs = (widget.surveyConfig['questions'] as List? ?? []);
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

    widget.onSubmit(_answers);
  }

  @override
  Widget build(BuildContext context) {
    final qs = (widget.surveyConfig['questions'] as List? ?? []).toList();
    qs.sort((a, b) =>
        ((a['order'] ?? 0) as int).compareTo((b['order'] ?? 0) as int));

    return Column(
      children: [
        for (final q in qs) _buildQuestionCard(q),
        if (!widget.isReadOnly)
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                elevation: 4,
                shadowColor: Colors.black.withOpacity(0.4),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
              ),
              icon: const Icon(Icons.send_rounded),
              label: const Text('ENVIAR RESPOSTA',
                  style: TextStyle(
                      fontFamily: 'Space Mono',
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1)),
            ),
          ),
      ],
    );
  }
}
