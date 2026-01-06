// lib/features/surveys/providers/surveys_provider.dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';

final surveysRefreshProvider = StateProvider<int>((ref) => 0);
final surveysSeenVersionProvider = StateProvider<int>((_) => 0);

final surveysListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(surveysRefreshProvider);
  ref.watch(feedVersionProvider);
  return ref.read(surveysRepoProvider).list();
});

// BADGE: Conta Surveys "Novas" (Publicadas < 3 dias e não vistas)
final newSurveysCountProvider = FutureProvider.autoDispose<int>((ref) async {
  ref.watch(surveysListProvider);
  ref.watch(surveysSeenVersionProvider);

  final surveys = await ref
      .read(surveysListProvider.future)
      .catchError((_) => <Map<String, dynamic>>[]);
  final seenIds = await ref.read(localSurveyStoreProvider).getSeenIds();
  final submittedIds =
      await ref.read(localSurveyStoreProvider).getSubmittedIds();

  final now = DateTime.now();
  final threeDaysAgo = now.subtract(const Duration(days: 3));

  int count = 0;
  for (final s in surveys) {
    final id = s['id']?.toString() ?? '';
    if (id.isEmpty) continue;

    // Se já viu (clicou) ou já respondeu, não conta como novo
    if (seenIds.contains(id)) continue;
    if (submittedIds.contains(id)) continue;

    // Verifica data de publicação
    final dateStr = s['startsAt']?.toString() ?? s['createdAt']?.toString();
    if (dateStr != null) {
      final dt = DateTime.tryParse(dateStr);
      // Considera novo se:
      // 1. Data é válida
      // 2. Foi criado nos últimos 3 dias
      // 3. (Opcional) Não está expirado (se tiver endsAt)
      if (dt != null && dt.isAfter(threeDaysAgo)) {
        count++;
      }
    }
  }
  return count;
});
