// lib/features/forms/form_submit_page.dart
import 'dart:ui';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../notifications/notifications_provider.dart';
import 'providers/forms_provider.dart';
import 'providers/forms_storage_provider.dart';
// 🔥 Import
import '../../core/providers.dart'; // 🔥 Import
import 'package:iuppy_app/features/surveys/widgets/question_widgets.dart';

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
  final List<PlatformFile> _pendingFiles = [];
  final List<Map<String, dynamic>> _uploadedAttachments = [];
  bool _uploading = false;
  double _uploadProgress = 0;
  final _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    // 🔥 CORREÇÃO: Marca como visto assim que entra na tela de preenchimento
    // Usamos addPostFrameCallback para evitar erro de build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(localFormStoreProvider).markAsSeen(widget.formId);
      ref.read(formsSeenVersionProvider.notifier).state++;
    });
  }

  Future<bool> _maybeLeave() async {
    if (!_dirty && _pendingFiles.isEmpty) return true;
    final leave = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Descartar respostas?'),
        content: const Text(
            'Você fez alterações ou escolheu anexos que ainda não foram enviados. Sair mesmo assim?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Continuar')),
          FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Descartar')),
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

  Future<void> _pickDate(String fieldId) async {
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
        _dirty = true;
      });
    }
  }

  Widget _buildFieldCard(Map<String, dynamic> f, String locale) {
    final fid = (f['id'] ?? '').toString();
    final type = (f['type'] ?? '').toString().toLowerCase().trim();
    final label = _readTranslatable(f['label'], locale);
    final required = (f['required'] ?? false) == true;
    final rawOptions = f['options'];
    List optionsRaw = [];
    if (rawOptions is List) {
      optionsRaw = rawOptions;
    } else if (rawOptions is Map) {
      // Handle translatable options list: { "pt-BR": [...], "en": [...] }
      optionsRaw = (rawOptions[locale] ?? rawOptions['pt-BR'] ?? []) as List;
    }

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
                    onChanged: (v) => setState(() {
                          _answers[fid] = v ?? '';
                          _dirty = true;
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
                    onChanged: (v) => setState(() {
                          final set = <String>{...current};
                          if (v == true) {
                            set.add(opt);
                          } else {
                            set.remove(opt);
                          }
                          _answers[fid] = set;
                          _dirty = true;
                        })))
                .toList());
        break;
      case 'stars':
      case 'rating':
        input = StarRating(
            value: (_answers[fid] as int?) ?? 0,
            onChanged: (v) => setState(() {
                  _answers[fid] = v;
                  _dirty = true;
                }));
        break;
      case 'nps':
      case 'scale':
        input = NpsSlider(
            value: (_answers[fid] as int?) ?? 0,
            onChanged: (v) => setState(() {
                  _answers[fid] = v;
                  _dirty = true;
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
        controller.selection = TextSelection.fromPosition(
            TextPosition(offset: controller.text.length));
        input = TextFormField(
            controller: controller,
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
                    borderSide: const BorderSide(color: Colors.black))),
            onChanged: (v) {
              _answers[fid] = v;
              _dirty = true;
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
              color: Colors.black.withValues(alpha: 0.05),
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
    final result = await FilePicker.platform
        .pickFiles(allowMultiple: true, withData: false);
    if (result == null) return;
    setState(() {
      _pendingFiles.addAll(result.files.where((f) => f.path != null));
    });
  }

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
    return Stack(children: [
      Container(
          width: 82,
          height: 82,
          decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8)),
          child: _isImageFile(f) && f.path != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(File(f.path!), fit: BoxFit.cover))
              : Center(
                  child: Text(f.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11)))),
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
                      shape: BoxShape.circle, color: Colors.black54),
                  padding: const EdgeInsets.all(2),
                  child:
                      const Icon(Icons.close, size: 14, color: Colors.white))))
    ]);
  }

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
      final companyId = ref.read(envProvider).companyId;
      final uploaded = await storage.uploadFormFile(
        file,
        formId: widget.formId,
        companyId: companyId,
      );
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

  @override
  Widget build(BuildContext context) {
    final asyncForm = ref.watch(formDetailProvider(widget.formId));

    return asyncForm.when(
      loading: () => Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            title: const Text('Carregando...',
                style: TextStyle(fontFamily: 'Space Mono')),
            backgroundColor: Colors.white,
            elevation: 0,
          ),
          body: const Center(
              child: CircularProgressIndicator(color: Colors.black))),
      error: (e, _) => Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
              title: const Text('Erro',
                  style: TextStyle(fontFamily: 'Space Mono'))),
          body: Center(child: Text('Erro: $e'))),
      data: (form) {
        final locale = form['defaultLocale']?.toString() ?? 'pt-BR';
        final title = _readTranslatable(form['title'], locale);
        final description = _readTranslatable(form['description'], locale);
        final List fields = (form['fields'] as List? ?? []).toList()
          ..sort((a, b) =>
              ((a['order'] ?? 0) as int).compareTo((b['order'] ?? 0) as int));
        final bool attachmentsAllowed = (form['attachmentsAllowed'] == true) ||
            (form['allowAttachments'] == true);

        final hasPending = _pendingFiles.isNotEmpty;

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
              title: Text(title,
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
                  if (description.isNotEmpty) ...[
                    Text(description,
                        style: TextStyle(
                            color: Colors.grey[700],
                            fontSize: 14,
                            fontFamily: 'Space Mono')),
                    const SizedBox(height: 24)
                  ],
                  for (final f in fields) _buildFieldCard(f, locale),
                  if (attachmentsAllowed) ...[
                    const SizedBox(height: 16),
                    Text('ANEXOS',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(
                                fontFamily: 'Space Mono',
                                fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(spacing: 8, runSpacing: 8, children: [
                      for (final att in _uploadedAttachments)
                        Chip(
                            label: Text(
                                att['storagePath']
                                        ?.toString()
                                        .split('/')
                                        .last ??
                                    'arquivo',
                                style: const TextStyle(
                                    fontFamily: 'Space Mono', fontSize: 12)),
                            onDeleted: () => setState(
                                () => _uploadedAttachments.remove(att)))
                    ]),
                    if (hasPending) ...[
                      const SizedBox(height: 8),
                      Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            for (final f in _pendingFiles)
                              _buildPendingAttachmentTile(f)
                          ])
                    ],
                    const SizedBox(height: 16),
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      OutlinedButton.icon(
                          onPressed:
                              _uploading ? null : _chooseAttachmentSource,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.black,
                            side: const BorderSide(color: Colors.black),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          icon: const Icon(Icons.add),
                          label: const Text('Escolher +',
                              style: TextStyle(fontFamily: 'Space Mono'))),
                      const SizedBox(width: 12),
                      FilledButton(
                          onPressed: (!_uploading && hasPending)
                              ? () => _confirmUpload(form)
                              : null,
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.black,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                          ),
                          child: _uploading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Confirmar escolha',
                                  style: TextStyle(fontFamily: 'Space Mono'))),
                    ]),
                    if (_uploading)
                      LinearProgressIndicator(value: _uploadProgress),
                  ],
                  const SizedBox(height: 32),
                  if (hasPending)
                    const Padding(
                        padding: EdgeInsets.only(bottom: 12),
                        child: Text(
                            '⚠️ Você tem anexos selecionados. Clique em "Confirmar escolha" acima antes de enviar.',
                            style: TextStyle(
                                color: Colors.orange,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Space Mono'),
                            textAlign: TextAlign.center)),
                  SafeArea(
                    top: false,
                    child: SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: (_sending || hasPending)
                            ? null
                            : () => _onSubmit(form, attachmentsAllowed),
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
      },
    );
  }

  Future<void> _onSubmit(
      Map<String, dynamic> form, bool attachmentsAllowed) async {
    final List fields = (form['fields'] as List? ?? []);
    if (!(_formKey.currentState?.validate() ?? true)) return;

    final answers = <Map<String, dynamic>>[];
    for (final f in fields) {
      final fid = (f['id'] ?? '').toString();
      final type = (f['type'] ?? '').toString();
      if (!_answers.containsKey(fid)) continue;
      final val = _answers[fid];
      if (val is Set<String>) {
        answers.add({'fieldId': fid, 'type': type, 'value': val.toList()});
      } else {
        answers.add({'fieldId': fid, 'type': type, 'value': val});
      }
    }

    setState(() => _sending = true);
    try {
      await ref.read(formsRepoProvider).submit(
            widget.formId,
            answers,
            attachments: attachmentsAllowed ? _uploadedAttachments : [],
          );
      // 🔥 Limpa os badges assim que envia (pois você já viu o form ao preencher)
      ref.invalidate(myFormsSubmissionsProvider);
      ref.invalidate(notificationsListProvider);

      if (!mounted) return;
      _dirty = false;
      await showDialog<void>(
        context: context,
        builder: (_) => AlertDialog(
            title: const Text('Resposta enviada!',
                style: TextStyle(fontFamily: 'Space Mono')),
            content: const Text('Obrigado por preencher.',
                style: TextStyle(fontFamily: 'Space Mono')),
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
                  child: const Text('FECHAR',
                      style: TextStyle(
                          fontFamily: 'Space Mono',
                          fontWeight: FontWeight.bold)))
            ]),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Erro: $e')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}
