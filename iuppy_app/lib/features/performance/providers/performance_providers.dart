import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/data/repositories/performance_repository.dart';

final performanceRepositoryProvider = Provider<PerformanceRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  // CompanyId is implicitly handled by the backend/auth token usually, or passed via headers
  // The repository constructor might need adjustment if it expects companyId strictly,
  // but looking at usage, we just pass what we have.
  return PerformanceRepository(apiClient.dio, 'DEFAULT');
});

final myGoalsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(performanceRepositoryProvider);
  final userAsync = ref.watch(userProfileProvider);
  final user = userAsync.value;
  if (user == null || user.id == null) return [];
  return repo.getGoals(user.id!);
});

final myPDIProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(performanceRepositoryProvider);
  final userAsync = ref.watch(userProfileProvider);
  final user = userAsync.value;
  if (user == null || user.id == null) return [];
  return repo.getPDI(user.id!);
});
