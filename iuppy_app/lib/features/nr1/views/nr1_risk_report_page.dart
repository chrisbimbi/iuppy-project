import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../forms/providers/forms_provider.dart';

class Nr1RiskReportPage extends ConsumerStatefulWidget {
  final Map<String, dynamic> form;
  const Nr1RiskReportPage({super.key, required this.form});

  @override
  ConsumerState<Nr1RiskReportPage> createState() => _Nr1RiskReportPageState();
}

class _Nr1RiskReportPageState extends ConsumerState<Nr1RiskReportPage> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _processoCtrl = TextEditingController();
  final _ambienteCtrl = TextEditingController();
  final _perigoCtrl = TextEditingController(); // Textarea
  String? _probabilidade;
  String? _severidade;

  bool _sending = false;

  // Mapped IDs
  String? _idProcesso;
  String? _idAmbiente;
  String? _idPerigo;
  String? _idProb;
  String? _idSev;

  @override
  void initState() {
    super.initState();
    _mapFields();
  }

  void _mapFields() {
    final fields = (widget.form['fields'] as List? ?? []);
    for (final f in fields) {
      final label = _readTranslatable(f['label']).toLowerCase();
      final id = f['id'].toString();

      if (label.contains('processo'))
        _idProcesso = id;
      else if (label.contains('ambiente'))
        _idAmbiente = id;
      else if (label.contains('perigo'))
        _idPerigo = id;
      else if (label.contains('probabilidade'))
        _idProb = id;
      else if (label.contains('severidade')) _idSev = id;
    }
  }

  String _readTranslatable(dynamic jsonField) {
    if (jsonField is Map) return jsonField['pt-BR']?.toString() ?? '';
    return jsonField?.toString() ?? '';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_idProcesso == null ||
        _idAmbiente == null ||
        _idPerigo == null ||
        _idProb == null ||
        _idSev == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Erro: Formulário incompatível. Campos não encontrados no template.')));
      return;
    }

    setState(() => _sending = true);

    final answers = <Map<String, dynamic>>[
      {'fieldId': _idProcesso, 'type': 'text', 'value': _processoCtrl.text},
      {'fieldId': _idAmbiente, 'type': 'text', 'value': _ambienteCtrl.text},
      {'fieldId': _idPerigo, 'type': 'text', 'value': _perigoCtrl.text},
      {'fieldId': _idProb, 'type': 'select', 'value': _probabilidade},
      {'fieldId': _idSev, 'type': 'select', 'value': _severidade},
    ];

    try {
      await ref
          .read(formsRepoProvider)
          .submit(widget.form['id'].toString(), answers);

      // Invalidate providers
      ref.invalidate(myFormsSubmissionsProvider);

      if (!mounted) return;

      // Success Dialog
      await showDialog(
          context: context,
          builder: (_) => AlertDialog(
                  title: const Text('Risco Registrado',
                      style: TextStyle(
                          fontFamily: 'Space Mono',
                          fontWeight: FontWeight.bold)),
                  content: const Text(
                      'O risco foi enviado para o Inventário GRO com sucesso.',
                      style: TextStyle(fontFamily: 'Space Mono')),
                  actions: [
                    TextButton(
                        onPressed: () {
                          Navigator.pop(context); // Close dialog
                          if (Navigator.canPop(context))
                            Navigator.pop(context); // Close page
                        },
                        child: const Text('OK',
                            style: TextStyle(
                                fontFamily: 'Space Mono',
                                fontWeight: FontWeight.bold)))
                  ]));
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white, // Clean background
      appBar: AppBar(
        title: const Text('NOVO RISCO (GRO)',
            style: TextStyle(
                fontFamily: 'Space Mono',
                fontWeight: FontWeight.bold,
                fontSize: 16)),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('Identificação'),
              const SizedBox(height: 16),
              _buildTextField('Processo', 'Ex: Soldagem', _processoCtrl),
              const SizedBox(height: 16),
              _buildTextField('Ambiente', 'Ex: Galpão 3', _ambienteCtrl),
              const SizedBox(height: 32),
              _buildSectionTitle('Detalhamento'),
              const SizedBox(height: 16),
              _buildTextField('Perigo', 'Descrição do perigo...', _perigoCtrl,
                  maxLines: 4),
              const SizedBox(height: 32),
              _buildSectionTitle('Avaliação Preliminar'),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildDropdown('Probabilidade', _probabilidade,
                        ['1', '2', '3', '4', '5'], (v) {
                      setState(() => _probabilidade = v);
                    }),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildDropdown(
                        'Severidade', _severidade, ['1', '2', '3', '4', '5'],
                        (v) {
                      setState(() => _severidade = v);
                    }),
                  ),
                ],
              ),
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _sending ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple.shade700,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: _sending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.check_circle_outline),
                  label: Text(_sending ? 'ENVIANDO...' : 'REGISTRAR RISCO',
                      style: const TextStyle(
                          fontFamily: 'Space Mono',
                          fontWeight: FontWeight.bold)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(title.toUpperCase(),
        style: TextStyle(
            color: Colors.grey.shade500,
            fontFamily: 'Space Mono',
            fontWeight: FontWeight.bold,
            letterSpacing: 1));
  }

  Widget _buildTextField(
      String label, String hint, TextEditingController controller,
      {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontFamily: 'Space Mono')),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(fontFamily: 'Space Mono'),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle:
                const TextStyle(fontFamily: 'Space Mono', color: Colors.grey),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          validator: (v) =>
              (v == null || v.isEmpty) ? 'Campo obrigatório' : null,
        ),
      ],
    );
  }

  Widget _buildDropdown(String label, String? value, List<String> options,
      Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontWeight: FontWeight.bold, fontFamily: 'Space Mono')),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          items: options
              .map((o) => DropdownMenuItem(
                  value: o,
                  child: Text(o,
                      style: const TextStyle(fontFamily: 'Space Mono'))))
              .toList(),
          onChanged: onChanged,
          validator: (v) => (v == null) ? 'Selecione' : null,
        ),
      ],
    );
  }
}
