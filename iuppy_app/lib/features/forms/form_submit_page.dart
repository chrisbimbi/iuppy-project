// lib/features/forms/form_submit_page.dart
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import 'providers/forms_provider.dart';
import 'providers/forms_storage_provider.dart';
import 'package:iuppy_app/features/surveys/widgets/question_widgets.dart';

class FormSubmitPage extends ConsumerStatefulWidget {
  final String formId;
  const FormSubmitPage({super.key, required this.formId});

  @override
  ConsumerState<FormSubmitPage> createState() => _FormSubmitPageState();
}

class _FormSubmitPageState extends ConsumerState<FormSubmitPage> {
  final _formKey = GlobalKey<FormState>();
  final _scroll = ScrollController();
  final Map<String, dynamic> _answers = {};

  bool _sending = false;
  bool _dirty = false;

  // arquivos escolhidos mas ainda não subidos
  final List<PlatformFile> _pendingFiles = [];

  // anexos já upados (prontos pra mandar pro backend)
  final List<Map<String, dynamic>> _uploadedAttachments = [];

  bool _uploading = false;
  double _uploadProgress = 0;

  final _imagePicker = ImagePicker();

  Future<bool> _maybeLeave() async {
    if (!_dirty && _pendingFiles.isEmpty) return true;
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Descartar respostas?'),
        content: const Text(
          'Você fez alterações ou escolheu anexos que ainda não foram enviados. Sair mesmo assim?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Continuar'),
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
    if (!can) return;
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncForm = ref.watch(formDetailProvider(widget.formId));

    return asyncForm.when(
      loading: () => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          title: const Text('Carregando...'),
        ),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _handleBack,
          ),
          title: const Text('Formulário'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Text('Erro ao carregar: $e'),
        ),
      ),
      data: (form) {
        // 👇 LOGA o payload que veio do backend
        debugPrint('===== FORM PAYLOAD (${widget.formId}) =====');
        debugPrint(form.toString());

        final title = (form['title'] ?? '').toString();
        final description = (form['description'] ?? '').toString();
        final List fields = (form['fields'] as List? ?? []).toList();
        fields.sort((a, b) {
          final ao = (a['order'] ?? 0) as int;
          final bo = (b['order'] ?? 0) as int;
          return ao.compareTo(bo);
        });

        // 👇 deduz se pode anexar
        final bool attachmentsAllowed = (form['attachmentsAllowed'] == true) ||
            (form['allowAttachments'] == true) ||
            fields.any((f) {
              final t = (f['type'] ?? '').toString().toLowerCase().trim();
              return t == 'file' ||
                  t == 'upload' ||
                  t == 'attachment' ||
                  t == 'anexo';
            });

        debugPrint(
            'attachmentsAllowed? $attachmentsAllowed (campos: ${fields.map((e) => e['type']).toList()})');

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) async {
            if (didPop) return;
            final leave = await _maybeLeave();
            if (!mounted) return;
            if (leave) {
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
              title: Text(
                title.isEmpty ? 'Formulário' : title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            body: Form(
              key: _formKey,
              child: ListView(
                controller: _scroll,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                children: [
                  if (description.isNotEmpty) ...[
                    Text(description),
                    const SizedBox(height: 12),
                  ],
                  for (final f in fields) _buildFieldCard(f),
                  if (attachmentsAllowed) ...[
                    const SizedBox(height: 16),
                    Text(
                      'Anexos',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),

                    // já upados
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final att in _uploadedAttachments)
                          Chip(
                            label: Text(
                              att['storagePath']?.toString().split('/').last ??
                                  'arquivo',
                            ),
                            onDeleted: () {
                              setState(() {
                                _uploadedAttachments.remove(att);
                              });
                            },
                          ),
                      ],
                    ),

                    // pendentes (mostrar miniaturas)
                    if (_pendingFiles.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [
                          for (final f in _pendingFiles)
                            _buildPendingAttachmentTile(f),
                        ],
                      ),
                    ],

                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        OutlinedButton.icon(
                          onPressed:
                              _uploading ? null : _chooseAttachmentSource,
                          icon: const Icon(Icons.add),
                          label: const Text('Escolher +'),
                        ),
                        const SizedBox(width: 12),
                        FilledButton(
                          onPressed: (!_uploading && _pendingFiles.isNotEmpty)
                              ? () => _confirmUpload(form)
                              : null,
                          child: _uploading
                              ? SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    value: _uploadProgress == 0
                                        ? null
                                        : _uploadProgress,
                                  ),
                                )
                              : const Text('Confirmar escolha'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_uploading)
                      LinearProgressIndicator(value: _uploadProgress),
                  ],
                  const SizedBox(height: 24),
                  SafeArea(
                    top: false,
                    child: FilledButton.icon(
                      onPressed: _sending
                          ? null
                          : () => _onSubmit(form, attachmentsAllowed),
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
      },
    );
  }

  // ======== ESCOLHA DA FONTE DO ANEXO ========

  Future<void> _chooseAttachmentSource() async {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Galeria'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFromGallery();
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Câmera'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(Icons.insert_drive_file),
                title: const Text('Arquivo'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  _pickFiles();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _pickFromGallery() async {
    final XFile? picked =
        await _imagePicker.pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    setState(() {
      _pendingFiles.add(
        PlatformFile(
          name: picked.name,
          path: picked.path,
          size: 0,
        ),
      );
    });
  }

  Future<void> _pickFromCamera() async {
    final XFile? picked =
        await _imagePicker.pickImage(source: ImageSource.camera);
    if (picked == null) return;

    setState(() {
      _pendingFiles.add(
        PlatformFile(
          name: picked.name,
          path: picked.path,
          size: 0,
        ),
      );
    });
  }

  // ======== PICK DE ARQUIVO (O QUE JÁ EXISTIA) ========

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      withData: false,
    );
    if (result == null) return;
    setState(() {
      _pendingFiles.addAll(result.files.where((f) => f.path != null));
    });
    debugPrint('[_pickFiles] pendentes: ${_pendingFiles.map((e) => e.name)}');
  }

  // ======== MINIATURA DOS PENDENTES ========

  bool _isImageFile(PlatformFile f) {
    final name = f.name.toLowerCase();
    return name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.gif') ||
        name.endsWith('.heic') ||
        name.endsWith('.webp');
  }

  Widget _buildPendingAttachmentTile(PlatformFile f) {
    return Stack(
      children: [
        Container(
          width: 82,
          height: 82,
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: _isImageFile(f) && f.path != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(f.path!),
                    fit: BoxFit.cover,
                  ),
                )
              : Center(
                  child: Text(
                    f.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
        ),
        Positioned(
          right: 0,
          top: 0,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _pendingFiles.remove(f);
              });
            },
            child: Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.black54,
              ),
              padding: const EdgeInsets.all(2),
              child: const Icon(
                Icons.close,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ======== CONFIRMAR UPLOAD ========

  Future<void> _confirmUpload(Map<String, dynamic> form) async {
    if (_pendingFiles.isEmpty) return;
    final storage = ref.read(formsStorageProvider);

    setState(() {
      _uploading = true;
      _uploadProgress = 0;
    });

    for (int i = 0; i < _pendingFiles.length; i++) {
      final f = _pendingFiles[i];
      final file = File(f.path!);

      final uploaded = await storage.uploadFormFile(
        file,
        formId: widget.formId,
      );

      debugPrint('[UPLOAD OK] ${uploaded.toJson()}');

      _uploadedAttachments.add(uploaded.toJson());

      setState(() {
        _uploadProgress = (i + 1) / _pendingFiles.length;
      });
    }

    setState(() {
      _pendingFiles.clear();
      _uploading = false;
    });
  }

  // ======== CAMPOS DO FORM ========

  Widget _buildFieldCard(Map<String, dynamic> f) {
    final fid = (f['id'] ?? '').toString();
    final type = (f['type'] ?? '').toString().toLowerCase().trim();
    final label = (f['label'] ?? '').toString();
    final required = (f['required'] ?? false) == true;
    final List optionsRaw = (f['options'] as List? ?? []);
    final List<String> options = optionsRaw.map((e) => e.toString()).toList();

    Widget input;

    switch (type) {
      case 'single':
      case 'radio':
      case 'choice':
        final current = (_answers[fid] as String?) ?? '';
        input = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: options.map((opt) {
            return RadioListTile<String>(
              contentPadding: EdgeInsets.zero,
              title: Text(opt),
              value: opt,
              groupValue: current,
              onChanged: (v) {
                setState(() {
                  _answers[fid] = v ?? '';
                  _dirty = true;
                });
              },
            );
          }).toList(),
        );
        break;
      case 'multi':
      case 'checkbox':
        final current = (_answers[fid] as Set<String>?) ?? <String>{};
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
                  _answers[fid] = set;
                  _dirty = true;
                });
              },
            );
          }).toList(),
        );
        break;
      case 'stars':
      case 'rating':
        final val = (_answers[fid] as int?) ?? 0;
        input = StarRating(
          value: val,
          onChanged: (v) => setState(() {
            _answers[fid] = v;
            _dirty = true;
          }),
        );
        break;
      case 'nps':
      case 'scale':
        final val = (_answers[fid] as int?) ?? 0;
        input = NpsSlider(
          value: val,
          onChanged: (v) => setState(() {
            _answers[fid] = v;
            _dirty = true;
          }),
        );
        break;
      default:
        final initial = (_answers[fid] as String?) ?? '';
        final controller = TextEditingController(text: initial);
        input = TextFormField(
          controller: controller,
          maxLines: type == 'long_text' ? 4 : 1,
          decoration: const InputDecoration(
            hintText: 'Digite sua resposta',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) {
            _answers[fid] = v;
            _dirty = true;
          },
          validator: (v) {
            if (required && (v == null || v.trim().isEmpty)) {
              return 'Este campo é obrigatório';
            }
            return null;
          },
        );
        break;
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
                    padding: EdgeInsets.only(left: 6),
                    child: Text('*', style: TextStyle(color: Colors.red)),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            input,
          ],
        ),
      ),
    );
  }

  // ======== SUBMIT ========

  Future<void> _onSubmit(
    Map<String, dynamic> form,
    bool attachmentsAllowed,
  ) async {
    final List fields = (form['fields'] as List? ?? []);
    bool hasError = false;

    for (final f in fields) {
      final fid = (f['id'] ?? '').toString();
      final type = (f['type'] ?? '').toString().toLowerCase().trim();
      final required = (f['required'] ?? false) == true;
      final ans = _answers[fid];

      if (!required) continue;

      if (type == 'text' || type == 'long_text' || type == '') {
        if (ans == null || (ans as String).trim().isEmpty) hasError = true;
      } else if (type == 'single' || type == 'radio' || type == 'choice') {
        if (ans == null || (ans as String).isEmpty) hasError = true;
      } else if (type == 'multi' || type == 'checkbox') {
        if (ans == null || (ans as Set).isEmpty) hasError = true;
      } else if (type == 'stars' || type == 'rating') {
        if (ans == null || (ans as int) <= 0) hasError = true;
      } else if (type == 'nps' || type == 'scale') {
        if (ans == null) hasError = true;
      }
    }

    if (!(_formKey.currentState?.validate() ?? true)) {
      hasError = true;
    }

    if (_pendingFiles.isNotEmpty) {
      hasError = true;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Confirme o upload dos anexos antes de enviar.'),
        ),
      );
    }

    if (hasError) {
      _scroll.animateTo(
        0,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
      return;
    }

    final answers = <Map<String, dynamic>>[];
    for (final f in fields) {
      final fid = (f['id'] ?? '').toString();
      final type = (f['type'] ?? '').toString();
      if (!_answers.containsKey(fid)) continue;
      final val = _answers[fid];
      if (val is Set<String>) {
        answers.add({
          'fieldId': fid,
          'type': type,
          'value': val.toList(),
        });
      } else {
        answers.add({
          'fieldId': fid,
          'type': type,
          'value': val,
        });
      }
    }

    debugPrint('===== ENVIANDO FORM (${widget.formId}) =====');
    debugPrint('answers: $answers');
    debugPrint(
        'attachments: ${attachmentsAllowed ? _uploadedAttachments : []}');

    setState(() => _sending = true);
    try {
      await ref.read(formsRepoProvider).submit(
            widget.formId,
            answers,
            attachments: attachmentsAllowed
                ? _uploadedAttachments
                : <Map<String, dynamic>>[],
          );

      if (!mounted) return;
      _dirty = false;
      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Resposta enviada!'),
          content: const Text('Obrigado por preencher.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                if (context.canPop()) {
                  context.pop();
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
      debugPrint('Erro ao enviar formulário: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao enviar: $e')),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
