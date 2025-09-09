import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';

/// Detalhe da enquete (carrega do backend)
final surveyDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
  final repo = ref.read(surveysRepoProvider);
  final survey = await repo.getById(id);
  return survey;
});
