import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iuppy_app/data/repositories/vacation_repository.dart';
import 'package:iuppy_app/core/providers.dart';

// Dependency Injection for API Client (Accessing DI via global or Riverpod if available)
// Assuming we can get Dio or ApiClient from a common provider. 
// For now, mirroring how other features might access it or creating a focused provider.

final vacationRepositoryProvider = Provider<VacationRepository>((ref) {
  final dio = ref.watch(dioProvider); // Use the global Dio instance
  final companyId = ref.watch(envProvider).companyId;
  return VacationRepository(dio, companyId);
});

final vacationBalanceProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, userId) async {
  final repo = ref.watch(vacationRepositoryProvider);
  return repo.getBalance(userId);
});

final vacationRequestsProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, userId) async {
  final repo = ref.watch(vacationRepositoryProvider);
  return repo.getRequests(userId);
});

final vacationPolicyProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repo = ref.watch(vacationRepositoryProvider);
  return repo.getPolicy();
});

final managerRequestsProvider = FutureProvider.family<List<Map<String, dynamic>>, String?>((ref, status) async {
  final repo = ref.watch(vacationRepositoryProvider);
  return repo.getAllRequests(status: status);
});
