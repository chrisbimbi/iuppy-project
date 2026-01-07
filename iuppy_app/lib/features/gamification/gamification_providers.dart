import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';

// --- CONTROLLER ---

class GamificationController {
  final Ref ref;
  GamificationController(this.ref);

  Future<Map<String, dynamic>> getStats() async {
    final dio = ref.read(dioProvider);
    final res = await dio.get('/gamification/stats');
    return res.data;
  }

  Future<List<Map<String, dynamic>>> getHistory({int limit = 50}) async {
    final dio = ref.read(dioProvider);
    final res = await dio
        .get('/gamification/history', queryParameters: {'limit': limit});
    // Assuming backend returns [ ... ] or { ... }
    // Controller `getHistory` normally returns array.
    if (res.data is List) {
      return (res.data as List).cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getLeaderboard({int limit = 20}) async {
    final dio = ref.read(dioProvider);
    final res = await dio
        .get('/gamification/leaderboard', queryParameters: {'limit': limit});
    if (res.data is List) {
      return (res.data as List).cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<List<Map<String, dynamic>>> getBadges() async {
    final dio = ref.read(dioProvider);
    final res = await dio.get('/gamification/badges');
    if (res.data is List) {
      return (res.data as List).cast<Map<String, dynamic>>();
    }
    return [];
  }
}

final gamificationControllerProvider =
    Provider((ref) => GamificationController(ref));

// --- MODULE CHECK ---

/// Provider to check if gamification module is enabled for current company
/// Uses existing companySettingsProvider instead of duplicate API call
final gamificationEnabledProvider = Provider<bool>((ref) {
  final settingsAsync = ref.watch(companySettingsProvider);
  return settingsAsync.maybeWhen(
    data: (settings) => settings.enabledModules.contains('gamification'),
    orElse: () => false,
  );
});

// --- DATA PROVIDERS ---

final userStatsProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  return ref.read(gamificationControllerProvider).getStats();
});

final xpHistoryProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(gamificationControllerProvider).getHistory();
});

final leaderboardProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(gamificationControllerProvider).getLeaderboard();
});

final badgesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  return ref.read(gamificationControllerProvider).getBadges();
});
