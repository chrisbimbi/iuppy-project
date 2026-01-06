// lib/features/forms/services/forms_storage_service.dart
import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;

class UploadedAttachment {
  final String storagePath;
  final String mimeType;
  final int bytes;

  UploadedAttachment({
    required this.storagePath,
    required this.mimeType,
    required this.bytes,
  });

  Map<String, dynamic> toJson() => {
        'storagePath': storagePath,
        'mimeType': mimeType,
        'bytes': bytes,
      };
}

class FormsStorageService {
  final FirebaseStorage _storage;

  FormsStorageService(this._storage);

  /// faz upload e devolve o caminho que o backend quer (storagePath)
  Future<UploadedAttachment> uploadFormFile(
    File file, {
    required String formId,
    String? companyId,
    String? customFileName,
  }) async {
    final mime = lookupMimeType(file.path) ?? 'application/octet-stream';
    final fileName = customFileName ??
        '${DateTime.now().millisecondsSinceEpoch}${p.extension(file.path)}';

    // você pode mudar esse path pra bater com o CMS
    final path = [
      'forms',
      if (companyId != null && companyId.isNotEmpty) companyId,
      formId,
      fileName,
    ].join('/');

    final ref = _storage.ref().child(path);
    final task = await ref.putFile(
      file,
      SettableMetadata(contentType: mime),
    );

    final bytes = task.totalBytes;

    return UploadedAttachment(
      storagePath: path,
      mimeType: mime,
      bytes: bytes,
    );
  }
}