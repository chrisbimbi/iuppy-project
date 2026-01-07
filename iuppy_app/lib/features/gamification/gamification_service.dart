import 'package:dio/dio.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';

class GamificationService {
  final Dio _dio;

  GamificationService(this._dio);

  // XP thresholds for each level
  static const Map<int, int> levelThresholds = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 3500,
    8: 5500,
    9: 8000,
    10: 12000,
  };

  /// Fetch user stats from API
  Future<Map<String, dynamic>> fetchUserStats() async {
    try {
      final response = await _dio.get('/gamification/stats');
      return response.data;
    } catch (e) {
      // ignore: avoid_print
      print('Error fetching gamification stats: $e');
      // Fallback to minimal stats if error (prevents UI crash)
      return {
        'xp': 0,
        'currentLevel': 1,
        'nextLevelXP': 100,
      };
    }
  }

  // --- Utility Methods (Logic Only) ---

  int getLevelFromXP(int xp) {
    int level = 1;
    for (final entry in levelThresholds.entries) {
      if (xp >= entry.value) {
        level = entry.key;
      } else {
        break;
      }
    }
    return level;
  }

  double getProgressToNextLevel(int xp) {
    final currentLevel = getLevelFromXP(xp);
    final nextLevel = currentLevel + 1;

    if (!levelThresholds.containsKey(nextLevel)) {
      return 1.0; // Max level reached
    }

    final currentThreshold = levelThresholds[currentLevel]!;
    final nextThreshold = levelThresholds[nextLevel]!;
    // Prevent division by zero
    final range = nextThreshold - currentThreshold;
    if (range == 0) return 1.0;

    final xpInCurrentLevel = xp - currentThreshold;
    return xpInCurrentLevel / range;
  }

  int getXPNeededForNextLevel(int xp) {
    final currentLevel = getLevelFromXP(xp);
    final nextLevel = currentLevel + 1;

    if (!levelThresholds.containsKey(nextLevel)) {
      return 0; // Max level reached
    }

    final nextThreshold = levelThresholds[nextLevel]!;
    return nextThreshold - xp;
  }
}

/// Provider for GamificationService
final gamificationServiceProvider = Provider<GamificationService>((ref) {
  // Use the main dioProvider which has the correct Auth Interceptor
  final dio = ref.watch(dioProvider);
  return GamificationService(dio);
});

/// Real User Stats Provider
final userStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final service = ref.watch(gamificationServiceProvider);
  return service.fetchUserStats();
});
