// lib/features/forms/widgets/attachments_picker.dart
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:mime/mime.dart';

class AttachmentCandidate {
  final File file;
  final String name;
  final String mime;

  AttachmentCandidate({
    required this.file,
    required this.name,
    required this.mime,
  });
}

class UploadedAttachment {
  final String storagePath;
  final String mimeType;
  final int bytes;

  UploadedAttachment({
    required this.storagePath,
    required this.mimeType,
    required this.bytes,
  });
}

///
/// USO:
/// final uploaded = await showModalBottomSheet<List<UploadedAttachment>>(...)
///
class AttachmentsPicker extends ConsumerStatefulWidget {
  final bool allowMultiple;
  const AttachmentsPicker({super.key, this.allowMultiple = true});

  @override
  ConsumerState<AttachmentsPicker> createState() => _AttachmentsPickerState();
}

class _AttachmentsPickerState extends ConsumerState<AttachmentsPicker> {
  final List<AttachmentCandidate> _selected = [];
  final List<UploadedAttachment> _uploaded = [];
  bool _uploading = false;
  double _progress = 0;

  Future<void> _pick() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: widget.allowMultiple,
        type: FileType.any,
      );

      if (result != null) {
        setState(() {
          for (final file in result.files) {
            if (file.path != null) {
              final f = File(file.path!);
              final mime =
                  lookupMimeType(file.path!) ?? 'application/octet-stream';
              _selected.add(AttachmentCandidate(
                file: f,
                name: file.name,
                mime: mime,
              ));
            }
          }
        });
      }
    } catch (e) {
      debugPrint('Error picking file: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erro ao selecionar arquivo: $e')));
      }
    }
  }

  Future<void> _confirmUpload() async {
    if (_selected.isEmpty) return;
    setState(() {
      _uploading = true;
      _progress = 0;
    });

    final api = ref.read(apiClientProvider);

    try {
      for (int i = 0; i < _selected.length; i++) {
        final c = _selected[i];
        final bytes = await c.file.readAsBytes();

        // Upload logic using ApiClient
        // Assuming uploadFileBytes returns the storagePath or URL
        final storagePath = await api.uploadFileBytes(bytes, c.name);

        _uploaded.add(
          UploadedAttachment(
            storagePath: storagePath,
            mimeType: c.mime,
            bytes: bytes.length,
          ),
        );

        if (mounted) {
          setState(() {
            _progress = (i + 1) / _selected.length;
          });
        }
      }

      if (mounted) {
        setState(() {
          _uploading = false;
        });
        Navigator.of(context).pop(_uploaded);
      }
    } catch (e) {
      debugPrint('Upload error: $e');
      if (mounted) {
        setState(() {
          _uploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar arquivos: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Text(
                  'Anexos',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                )
              ],
            ),
            const SizedBox(height: 12),
            if (_selected.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final c in _selected)
                    Stack(
                      children: [
                        Container(
                          width: 82,
                          height: 82,
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              c.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 10),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                        Positioned(
                          right: 0,
                          top: 0,
                          child: GestureDetector(
                            onTap: _uploading
                                ? null
                                : () {
                                    setState(() {
                                      _selected.remove(c);
                                    });
                                  },
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.black54,
                              ),
                              child: const Icon(Icons.close,
                                  size: 16, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  if (!_uploading &&
                      (widget.allowMultiple || _selected.isEmpty))
                    GestureDetector(
                      onTap: _pick,
                      child: Container(
                        width: 82,
                        height: 82,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.blue),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                            child: Text('Escolher +',
                                style: TextStyle(color: Colors.blue))),
                      ),
                    ),
                ],
              )
            else
              GestureDetector(
                onTap: _pick,
                child: Container(
                    width: double.infinity,
                    height: 100,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.cloud_upload_outlined,
                            size: 32, color: Colors.grey),
                        SizedBox(height: 8),
                        Text('Toque para selecionar arquivos',
                            style: TextStyle(color: Colors.grey))
                      ],
                    )),
              ),
            const SizedBox(height: 16),
            if (_uploading)
              LinearProgressIndicator(value: _progress)
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _selected.isEmpty ? null : _confirmUpload,
                    child: const Text('Confirmar escolha'),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
