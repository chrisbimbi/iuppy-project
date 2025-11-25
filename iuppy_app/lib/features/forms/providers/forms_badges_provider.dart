// lib/features/forms/providers/forms_badges_provider.dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';

final formsBadgesCountProvider = FutureProvider<int>((ref) async {
  final api = ref.read(apiClientProvider);
  // CORRIGIDO: Usa o endpoint de badges
  final res = await api.getFormBadges();
  // O backend S2/S3 (blueprint) retorna 'totalNew'
  return (res['totalNew'] as int?) ?? 0;
});
