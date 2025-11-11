// lib/features/forms/providers/forms_storage_provider.dart
import 'package:firebase_storage/firebase_storage.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../services/forms_storage_service.dart';

final formsStorageProvider = Provider<FormsStorageService>((ref) {
  return FormsStorageService(FirebaseStorage.instance);
});
