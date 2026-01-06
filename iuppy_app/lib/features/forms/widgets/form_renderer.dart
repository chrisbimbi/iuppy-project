import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:iuppy_app/features/surveys/widgets/question_widgets.dart';

class FormRenderer extends StatefulWidget {
  final Map<String, dynamic> formConfig;
  final Function(
          Map<String, dynamic> answers, List<Map<String, dynamic>> attachments)
      onSubmit;
  final bool isReadOnly;
  final Map<String, dynamic>? initialAnswers;

  const FormRenderer({
    super.key,
    required this.formConfig,
    required this.onSubmit,
    this.isReadOnly = false,
    this.initialAnswers,
  });

  @override
  State<FormRenderer> createState() => _FormRendererState();
}

class _FormRendererState extends State<FormRenderer> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> _answers = {};
  final List<PlatformFile> _pendingFiles = [];
  final List<Map<String, dynamic>> _uploadedAttachments =
      []; // We might need a way to upload files separately or pass them up
  final bool _uploading = false;
  final double _uploadProgress = 0;
  final _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    if (widget.initialAnswers != null) {
      _answers.addAll(widget.initialAnswers!);
    }
  }

  String _readTranslatable(dynamic jsonField, [String locale = 'pt-BR']) {
    if (jsonField == null) return '';
    if (jsonField is String) return jsonField;
    if (jsonField is Map) {
      final Map<String, dynamic> map = Map<String, dynamic>.from(jsonField);
      return map[locale]?.toString() ??
          map['pt-BR']?.toString() ??
          map.values.first?.toString() ??
          '';
    }
    return jsonField.toString();
  }

  Future<void> _pickDate(String fieldId) async {
    if (widget.isReadOnly) return;
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _answers[fieldId] = picked.toIso8601String();
      });
    }
  }

  Widget _buildFieldCard(Map<String, dynamic> f, String locale) {
    final fid = (f['id'] ?? '').toString();
    final type = (f['type'] ?? '').toString().toLowerCase().trim();
    final label = _readTranslatable(f['label'], locale);
    final required = (f['required'] ?? false) == true;
    final List optionsRaw = (f['options'] as List? ?? []);
    final List<String> options = optionsRaw
        .map((e) =>
            e is Map ? _readTranslatable(e['label'], locale) : e.toString())
        .toList();

    Widget input;

    switch (type) {
      case 'single':
      case 'radio':
      case 'single_choice':
        final current = (_answers[fid] as String?) ?? '';
        input = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: options
                .map((opt) => RadioListTile<String>(
                    contentPadding: EdgeInsets.zero,
                    title: Text(opt,
                        style: const TextStyle(fontFamily: 'Space Mono')),
                    value: opt,
                    groupValue: current,
                    onChanged: widget.isReadOnly
                        ? null
                        : (v) => setState(() {
                              _answers[fid] = v ?? '';
                            })))
                .toList());
        break;
      case 'multi':
      case 'checkbox':
      case 'multi_choice':
        final current = (_answers[fid] as Set<String>?) ?? <String>{};
        input = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: options
                .map((opt) => CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(opt,
                        style: const TextStyle(fontFamily: 'Space Mono')),
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
                              _answers[fid] = set;
                            })))
                .toList());
        break;
      case 'stars':
      case 'rating':
        input = StarRating(
            value: (_answers[fid] as int?) ?? 0,
            onChanged: widget.isReadOnly
                ? null
                : (v) => setState(() {
                      _answers[fid] = v;
                    }));
        break;
      case 'nps':
      case 'scale':
        input = NpsSlider(
            value: (_answers[fid] as int?) ?? 0,
            onChanged: widget.isReadOnly
                ? null
                : (v) => setState(() {
                      _answers[fid] = v;
                    }));
        break;
      case 'date':
        final currentVal = _answers[fid] as String?;
        DateTime? dt;
        if (currentVal != null) dt = DateTime.tryParse(currentVal);
        input = InkWell(
          onTap: () => _pickDate(fid),
          child: InputDecorator(
            decoration: InputDecoration(
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300)),
                suffixIcon: const Icon(Icons.calendar_today)),
            child: Text(
                dt != null
                    ? '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}'
                    : 'Selecione uma data',
                style: dt != null
                    ? const TextStyle(fontFamily: 'Space Mono')
                    : TextStyle(
                        color: Colors.grey[600], fontFamily: 'Space Mono')),
          ),
        );
        break;
      default:
        final controller =
            TextEditingController(text: (_answers[fid] as String?) ?? '');
        // Only set selection if not read only and focused?
        // Actually, creating a new controller every build is bad for focus.
        // But for this simple renderer, we'll leave it or improve if needed.
        // Better to use initialValue for TextFormField if controller not persistent.
        input = TextFormField(
            initialValue: (_answers[fid] as String?) ?? '',
            readOnly: widget.isReadOnly,
            maxLines: type == 'long_text' ? 4 : 1,
            style: const TextStyle(fontFamily: 'Space Mono'),
            decoration: InputDecoration(
                hintText: 'Digite sua resposta',
                hintStyle: TextStyle(
                    fontFamily: 'Space Mono', color: Colors.grey.shade400),
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
              _answers[fid] = v;
            },
            validator: (v) => required && (v == null || v.trim().isEmpty)
                ? 'Obrigatório'
                : null);
        break;
    }

    return Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Flexible(
                child: Text(label.isEmpty ? 'Pergunta' : label,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontFamily: 'Space Mono',
                        fontWeight: FontWeight.bold))),
            if (required)
              const Padding(
                  padding: EdgeInsets.only(left: 6),
                  child: Text('*', style: TextStyle(color: Colors.red)))
          ]),
          const SizedBox(height: 16),
          input
        ]));
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? true)) return;

    // Format answers
    // Note: We are passing raw answers map, the parent can format it as needed
    // or we can format it here to match the expected structure.
    // The backend expects { fieldId, type, value } usually.

    // Convert pending files to attachments map (mock for now, or prepare for upload)
    // In a real app, we might upload here or pass the files up.
    // For now, we pass the file objects in a separate list or inside answers if supported.
    // The signature of onSubmit expects List<Map<String, dynamic>> for attachments.

    final attachments = _pendingFiles
        .map((f) => {
              'name': f.name,
              'size': f.size,
              'path': f.path, // Note: path might be null on web
              'bytes': f.bytes, // Note: bytes might be null if not loaded
            })
        .toList();

    widget.onSubmit(_answers, attachments);
  }

  @override
  Widget build(BuildContext context) {
    final form = widget.formConfig;
    final locale = form['defaultLocale']?.toString() ?? 'pt-BR';
    final List fields = (form['fields'] as List? ?? []).toList()
      ..sort((a, b) =>
          ((a['order'] ?? 0) as int).compareTo((b['order'] ?? 0) as int));

    // Attachments logic omitted for brevity in this first pass,
    // can be added if needed for embedded forms.

    // Check both keys for compatibility
    print('DEBUG: FormRenderer config: ${widget.formConfig}');
    print(
        'DEBUG: attachmentsAllowed: ${widget.formConfig['attachmentsAllowed']}');
    print('DEBUG: allowAttachments: ${widget.formConfig['allowAttachments']}');

    final bool attachmentsAllowed =
        (widget.formConfig['attachmentsAllowed'] == true) ||
            (widget.formConfig['allowAttachments'] == true);

    return Form(
      key: _formKey,
      child: Column(
        children: [
          for (final f in fields) _buildFieldCard(f, locale),
          if (!widget.isReadOnly && attachmentsAllowed) ...[
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            Text('Anexos',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontFamily: 'Space Mono', fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            // File List
            if (_pendingFiles.isNotEmpty)
              Column(
                children: _pendingFiles.asMap().entries.map((entry) {
                  final index = entry.key;
                  final file = entry.value;
                  return ListTile(
                    leading: const Icon(Icons.attach_file),
                    title: Text(file.name,
                        style: const TextStyle(
                            fontFamily: 'Space Mono', fontSize: 14)),
                    trailing: IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () =>
                          setState(() => _pendingFiles.removeAt(index)),
                    ),
                  );
                }).toList(),
              ),

            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _chooseAttachmentSource,
              icon: const Icon(Icons.upload_file),
              label: const Text('ADICIONAR ARQUIVO',
                  style: TextStyle(
                      fontFamily: 'Space Mono', fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.black,
                side: const BorderSide(color: Colors.black),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 32),
          ],
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
      ),
    );
  }

  Future<void> _chooseAttachmentSource() async {
    showModalBottomSheet(
        context: context,
        builder: (ctx) {
          return SafeArea(
              child: Wrap(children: [
            ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Galeria'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFromGallery();
                }),
            ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Câmera'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFromCamera();
                }),
            ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Arquivo'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFiles();
                })
          ]));
        });
  }

  Future<void> _pickFromGallery() async {
    final XFile? picked =
        await _imagePicker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;
    setState(() {
      _pendingFiles
          .add(PlatformFile(name: picked.name, path: picked.path, size: 0));
    });
  }

  Future<void> _pickFromCamera() async {
    final XFile? picked =
        await _imagePicker.pickImage(source: ImageSource.camera);
    if (picked == null) return;
    setState(() {
      _pendingFiles
          .add(PlatformFile(name: picked.name, path: picked.path, size: 0));
    });
  }

  Future<void> _pickFiles() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.any,
      );

      if (result != null) {
        setState(() {
          _pendingFiles.addAll(result.files);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao selecionar arquivos: $e')),
      );
    }
  }
}
