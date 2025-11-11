// lib/features/forms/widgets/attachments_picker.dart
import 'dart:io';

import 'package:flutter/material.dart';

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
class AttachmentsPicker extends StatefulWidget {
  final bool allowMultiple;
  const AttachmentsPicker({super.key, this.allowMultiple = true});

  @override
  State<AttachmentsPicker> createState() => _AttachmentsPickerState();
}

class _AttachmentsPickerState extends State<AttachmentsPicker> {
  final List<AttachmentCandidate> _selected = [];
  final List<UploadedAttachment> _uploaded = [];
  bool _uploading = false;
  double _progress = 0;

  Future<void> _pick() async {
    // TODO: usar image_picker/file_picker
    // final result = await FilePicker.platform.pickFiles(...)
    // aqui vou simular com nada
  }

  Future<void> _confirmUpload() async {
    if (_selected.isEmpty) return;
    setState(() {
      _uploading = true;
      _progress = 0;
    });

    // TODO: trocar por seu serviço de upload de verdade
    // aqui vou apenas simular
    for (int i = 0; i < _selected.length; i++) {
      final c = _selected[i];
      await Future.delayed(const Duration(milliseconds: 300));
      _uploaded.add(
        UploadedAttachment(
          storagePath:
              'forms/tmp/${DateTime.now().millisecondsSinceEpoch}-${c.name}',
          mimeType: c.mime,
          bytes: await c.file.length(),
        ),
      );
      setState(() {
        _progress = (i + 1) / _selected.length;
      });
    }

    setState(() {
      _uploading = false;
    });

    if (mounted) Navigator.of(context).pop(_uploaded);
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
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: GestureDetector(
                          onTap: () {
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
                GestureDetector(
                  onTap: _uploading ? null : _pick,
                  child: Container(
                    width: 82,
                    height: 82,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.blue),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(child: Text('Escolher +')),
                  ),
                ),
              ],
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
