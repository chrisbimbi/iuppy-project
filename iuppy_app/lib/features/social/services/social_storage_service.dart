import 'dart:io';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as p;

import '../../../../core/providers.dart';

final socialStorageServiceProvider = Provider<SocialStorageService>((ref) {
  return SocialStorageService(
    FirebaseStorage.instance,
    ref.watch(envProvider).companyId,
  );
});

class UploadedMedia {
  final String storagePath;
  final String mimeType;
  final int bytes;
  final String downloadUrl;

  const UploadedMedia({
    required this.storagePath,
    required this.mimeType,
    required this.bytes,
    required this.downloadUrl,
  });
}

class SocialStorageService {
  final FirebaseStorage _storage;
  final String _companyId;

  SocialStorageService(this._storage, this._companyId);

  /// Uploads a file for a social post using company-first structure
  /// Path: {companyId}/social/posts/{postId}/{filename}
  /// Returns download URL directly as backend expects URL for social posts
  Future<String> uploadPostImage(
    File file, {
    required String postId,
    String? companyIdOverride,
  }) async {
    final companyId = companyIdOverride ?? _companyId;

    if (companyId.isEmpty) {
      throw ArgumentError('Company ID is required for social uploads');
    }

    final mime = lookupMimeType(file.path) ?? 'application/octet-stream';
    final fileName =
        '${DateTime.now().millisecondsSinceEpoch}${p.extension(file.path)}';

    // Company-first structure
    final path = '$companyId/social/posts/$postId/$fileName';

    final ref = _storage.ref().child(path);
    await ref.putFile(
      file,
      SettableMetadata(contentType: mime),
    );

    return await ref.getDownloadURL();
  }
}
