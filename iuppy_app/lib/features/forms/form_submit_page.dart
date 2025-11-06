// lib/features/forms/form_submit_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';
import 'services/forms_api.dart';
import '../surveys/widgets/question_widgets.dart' show StarRating, NpsSlider;

class FormSubmitPage extends ConsumerStatefulWidget {
  final String id;
  const FormSubmitPage({super.key, required this.id});

  @override
  ConsumerState<FormSubmitPage> createState() => _FormSubmitPageState();
}

class _FormSubmitPageState extends ConsumerState<FormSubmitPage> {
  final _formKey = GlobalKey<FormState>();
  final _scroll = ScrollController();

  late FormsApi _formsApi;
  Map<String, dynamic>? _form;

  // respostas em memória: fieldId -> dynamic
  final Map<String, dynamic> _answers = {};

  bool _loading = true;
  bool _sending = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final api = ref.read(apiClientProvider);
      _formsApi = FormsApi(api);
      await _load();
    });
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final j = await _formsApi.get(widget.id);

      final fields = (j['fields'] as List? ?? const []);
      for (final raw in fields) {
        final f = Map<String, dynamic>.from(raw as Map);
        final fid = '${f['id']}';
        if (f.containsKey('defaultValue') && !_answers.containsKey(fid)) {
          _answers[fid] = f['defaultValue'];
        }
      }

      if (mounted) {
        setState(() {
          _form = j;
          _loading = false;
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<bool> _maybeLeave() async {
    if (!_dirty) return true;
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Descartar respostas?'),
        content: const Text(
          'Você alterou o formulário, mas ainda não enviou. '
          'Deseja sair mesmo assim?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Continuar respondendo'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Descartar'),
          ),
        ],
      ),
    );
    return leave ?? false;
  }

  Future<void> _handleBack() async {
    final can = await _maybeLeave();
    if (!mounted) return;
    if (!can) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  // ========== HELPERS DE OPÇÕES ==========
  // O backend pode mandar:
  // 1) ['A','B']
  // 2) [{id:'a', label:'A'}, {id:'b', label:'B'}]
  // 3) { choices: [...] } ou { options: [...] }
  // Sempre vamos exibir somente LABEL, mas salvar o ID.
  List<Map<String, String>> _normalizedChoices(dynamic options) {
    final out = <Map<String, String>>[];

    dynamic base = options;
    if (base is Map) {
      base = base['choices'] ?? base['options'];
    }

    if (base is List) {
      for (final item in base) {
        if (item is Map) {
          final id =
              (item['id'] ?? item['value'] ?? item['label'] ?? '').toString();
          final label = (item['label'] ??
                  item['text'] ??
                  item['title'] ??
                  item['id'] ??
                  '')
              .toString();
          if (label.isEmpty && id.isEmpty) continue;
          out.add({
            'id': id.isEmpty ? label : id,
            'label': label.isEmpty ? id : label
          });
        } else {
          final s = item.toString();
          out.add({'id': s, 'label': s});
        }
      }
    }

    return out;
  }

  int _starsMax(dynamic options) {
    if (options is Map && options['max'] is num) {
      return (options['max'] as num).toInt().clamp(1, 10);
    }
    return 5;
  }

  (double min, double max, double step, String? l, String? r) _scaleOf(
      dynamic options) {
    if (options is Map) {
      final min =
          (options['min'] is num) ? (options['min'] as num).toDouble() : 0.0;
      final max =
          (options['max'] is num) ? (options['max'] as num).toDouble() : 10.0;
      final step =
          (options['step'] is num) ? (options['step'] as num).toDouble() : 1.0;
      final l = options['labelLeft']?.toString();
      final r = options['labelRight']?.toString();
      return (min, max, step, l, r);
    }
    return (0.0, 10.0, 1.0, null, null);
  }

  bool _isEmptyAnswer(dynamic v) {
    if (v == null) return true;
    if (v is String) return v.trim().isEmpty;
    if (v is Iterable) return v.isEmpty;
    return false;
  }

  Future<void> _submit() async {
    if (_form == null) return;

    final fields = (_form!['fields'] as List? ?? const []);
    var hasError = false;
    for (final raw in fields) {
      final f = Map<String, dynamic>.from(raw as Map);
      final fid = '${f['id']}';
      final required = f['required'] == true;
      if (required && _isEmptyAnswer(_answers[fid])) {
        hasError = true;
      }
    }

    if (!(_formKey.currentState?.validate() ?? true)) {
      hasError = true;
    }

    if (hasError) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha os campos obrigatórios.')),
      );
      _scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
      return;
    }

    setState(() => _sending = true);
    try {
      final payloadAnswers = fields.map<Map<String, dynamic>>((raw) {
        final f = Map<String, dynamic>.from(raw as Map);
        final fid = '${f['id']}';
        return {
          'fieldId': fid,
          'type': '${f['type']}',
          // aqui mandamos exatamente o que o usuário escolheu (id da opção),
          // e o backend sabe qual label era.
          'value': _answers[fid],
        };
      }).toList();

      await _formsApi.submit(
        formId: widget.id,
        answers: payloadAnswers,
        meta: const {'client': 'flutter'},
      );

      if (!mounted) return;
      _dirty = false;

      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Enviado! 🙌'),
          content: const Text('Sua resposta foi enviada ao RH.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                if (context.canPop()) {
                  context.pop(true);
                } else {
                  context.go('/home');
                }
              },
              child: const Text('Fechar'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Não foi possível enviar: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Widget _buildFieldCard(Map<String, dynamic> f) {
    final fid = '${f['id']}';
    final type = '${f['type']}'.toLowerCase();
    final label = '${f['label'] ?? ''}';
    final help = (f['helpText'] ?? f['description'] ?? '').toString();
    final required = f['required'] == true;
    final options = f['options'];

    Widget input;

    switch (type) {
      case 'short_text':
        input = TextFormField(
          initialValue: (_answers[fid] as String?) ?? '',
          decoration: const InputDecoration(
            hintText: 'Digite aqui',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            _answers[fid] = v;
            _dirty = true;
          },
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Campo obrigatório';
            }
            return null;
          },
        );
        break;

      case 'long_text':
        input = TextFormField(
          initialValue: (_answers[fid] as String?) ?? '',
          minLines: 4,
          maxLines: 8,
          decoration: const InputDecoration(
            hintText: 'Digite sua resposta completa',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            _answers[fid] = v;
            _dirty = true;
          },
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Campo obrigatório';
            }
            return null;
          },
        );
        break;

      case 'number':
        input = TextFormField(
          initialValue: _answers[fid]?.toString() ?? '',
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            _answers[fid] = num.tryParse(v);
            _dirty = true;
          },
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Campo obrigatório';
            }
            return null;
          },
        );
        break;

      case 'date':
        final currentStr = (_answers[fid] as String?) ?? '';
        DateTime? currentDt;
        if (currentStr.isNotEmpty) {
          currentDt = DateTime.tryParse(currentStr);
        }
        input = InkWell(
          onTap: () async {
            final now = DateTime.now();
            final picked = await showDatePicker(
              context: context,
              initialDate: currentDt ?? now,
              firstDate: DateTime(now.year - 5),
              lastDate: DateTime(now.year + 5),
            );
            if (picked != null) {
              setState(() {
                _answers[fid] = picked.toIso8601String();
                _dirty = true;
              });
            }
          },
          child: InputDecorator(
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              suffixIcon: Icon(Icons.event),
            ),
            child: Text(
              currentDt != null
                  ? '${currentDt.day.toString().padLeft(2, '0')}/'
                      '${currentDt.month.toString().padLeft(2, '0')}/'
                      '${currentDt.year}'
                  : 'Selecionar data',
            ),
          ),
        );
        break;

      case 'single_choice':
        final opts = _normalizedChoices(options);
        final current = (_answers[fid] as String?) ?? '';
        input = Column(
          children: [
            for (final o in opts)
              RadioListTile<String>(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text(o['label'] ?? ''),
                value: o['id'] ?? '',
                groupValue: current,
                onChanged: (v) {
                  setState(() {
                    _answers[fid] = v ?? '';
                    _dirty = true;
                  });
                },
              ),
          ],
        );
        break;

      case 'multi_choice':
        final opts = _normalizedChoices(options);
        final current = <String>{
          ...(_answers[fid] as List<String>? ?? const [])
        };
        input = Column(
          children: [
            for (final o in opts)
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text(o['label'] ?? ''),
                value: current.contains(o['id']),
                onChanged: (v) {
                  setState(() {
                    final id = o['id'] ?? '';
                    if (v == true) {
                      current.add(id);
                    } else {
                      current.remove(id);
                    }
                    _answers[fid] = current.toList();
                    _dirty = true;
                  });
                },
              ),
          ],
        );
        break;

      case 'stars':
        final max = _starsMax(options);
        final current = (_answers[fid] as int?) ?? 0;
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            StarRating(
              value: current,
              max: max,
              onChanged: (v) {
                setState(() {
                  _answers[fid] = v;
                  _dirty = true;
                });
              },
            ),
            if (required && current <= 0)
              const Padding(
                padding: EdgeInsets.only(top: 6),
                child: Text(
                  'Selecione uma quantidade de estrelas',
                  style: TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),
          ],
        );
        break;

      case 'scale':
        final (min, max, step, left, right) = _scaleOf(options);
        final current =
            (_answers[fid] is num) ? (_answers[fid] as num).toDouble() : min;
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Slider(
              value: current.clamp(min, max),
              min: min,
              max: max,
              divisions: ((max - min) / step).round().clamp(1, 1000),
              label: current.toStringAsFixed(0),
              onChanged: (v) => setState(() {
                _answers[fid] = v;
                _dirty = true;
              }),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (left != null)
                  Text(left, style: const TextStyle(fontSize: 12)),
                if (right != null)
                  Text(right, style: const TextStyle(fontSize: 12)),
              ],
            ),
          ],
        );
        break;

      default:
        input = const Text('Tipo de campo não suportado ainda');
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
                    label.isEmpty ? 'Pergunta' : label,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                if (required)
                  const Padding(
                    padding: EdgeInsets.only(left: 4),
                    child: Text('*', style: TextStyle(color: Colors.red)),
                  ),
              ],
            ),
            if (help.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  help,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            const SizedBox(height: 12),
            input,
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          title: const Text('Formulário'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_form == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          title: const Text('Formulário'),
        ),
        body: const Center(child: Text('Formulário não encontrado')),
      );
    }

    final title = (_form!['title'] ?? '').toString();
    final desc = (_form!['description'] ?? '').toString();
    final fields = (_form!['fields'] as List? ?? const []);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final can = await _maybeLeave();
        if (!mounted) return;
        if (can) {
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/home');
          }
        }
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          title: Tooltip(
            message: title.isEmpty ? 'Formulário' : title,
            child: Text(
              title.isEmpty ? 'Formulário' : title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loading ? null : _load,
            ),
          ],
        ),
        body: Form(
          key: _formKey,
          child: ListView(
            controller: _scroll,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              if (desc.isNotEmpty) ...[
                Text(desc),
                const SizedBox(height: 12),
              ],
              for (final raw in fields)
                _buildFieldCard(Map<String, dynamic>.from(raw as Map)),
              const SizedBox(height: 24),
              SafeArea(
                top: false,
                child: FilledButton.icon(
                  onPressed: _sending ? null : _submit,
                  icon: _sending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.send_rounded),
                  label: Text(_sending ? 'Enviando...' : 'Enviar'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
