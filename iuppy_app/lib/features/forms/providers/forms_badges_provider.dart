// lib/features/forms/providers/forms_badges_provider.dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';

final formsBadgesCountProvider = FutureProvider<int>((ref) async {
  final api = ref.read(apiClientProvider);
  // adapta para o método que você tiver no ApiClient
  final res = await api.getFormDetail('/v2/forms/analytics/badges');
  return (res['totalNew'] as int?) ?? 0;
});
