import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Gamification Service - Manages XP, Levels, and Badges
class GamificationService {
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

  /// Calculate level from XP
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

  /// Calculate XP progress to next level (0.0 to 1.0)
  double getProgressToNextLevel(int xp) {
    final currentLevel = getLevelFromXP(xp);
    final nextLevel = currentLevel + 1;

    if (!levelThresholds.containsKey(nextLevel)) {
      return 1.0; // Max level reached
    }

    final currentThreshold = levelThresholds[currentLevel]!;
    final nextThreshold = levelThresholds[nextLevel]!;
    final xpInCurrentLevel = xp - currentThreshold;
    final xpNeededForNextLevel = nextThreshold - currentThreshold;

    return xpInCurrentLevel / xpNeededForNextLevel;
  }

  /// Get XP needed for next level
  int getXPNeededForNextLevel(int xp) {
    final currentLevel = getLevelFromXP(xp);
    final nextLevel = currentLevel + 1;

    if (!levelThresholds.containsKey(nextLevel)) {
      return 0; // Max level reached
    }

    final nextThreshold = levelThresholds[nextLevel]!;
    return nextThreshold - xp;
  }

  /// Award XP for completing a journey step
  int awardStepCompletionXP() {
    return 10; // Base XP for completing a step
  }

  /// Award XP for completing a survey
  int awardSurveyCompletionXP() {
    return 15;
  }

  /// Award XP for reading news
  int awardNewsReadXP() {
    return 5;
  }

  /// Check if user has earned a badge
  List<String> checkBadges(Map<String, dynamic> userStats) {
    final badges = <String>[];

    // Journey Master - Complete 10 journey steps
    if ((userStats['journeyStepsCompleted'] ?? 0) >= 10) {
      badges.add('journey_master');
    }

    // News Enthusiast - Read 50 news articles
    if ((userStats['newsRead'] ?? 0) >= 50) {
      badges.add('news_enthusiast');
    }

    // Survey Champion - Complete 20 surveys
    if ((userStats['surveysCompleted'] ?? 0) >= 20) {
      badges.add('survey_champion');
    }

    // Early Adopter - First week user
    if (userStats['isEarlyAdopter'] == true) {
      badges.add('early_adopter');
    }

    // Level 5 Achievement
    if ((userStats['currentLevel'] ?? 1) >= 5) {
      badges.add('level_5');
    }

    // Level 10 Achievement (Max Level)
    if ((userStats['currentLevel'] ?? 1) >= 10) {
      badges.add('level_10_max');
    }

    return badges;
  }

  /// Get badge metadata
  Map<String, dynamic> getBadgeMetadata(String badgeId) {
    final badges = {
      'journey_master': {
        'name': 'JOURNEY MASTER',
        'description': 'Complete 10 journey steps',
        'icon': '🎯',
      },
      'news_enthusiast': {
        'name': 'NEWS ENTHUSIAST',
        'description': 'Read 50 news articles',
        'icon': '📰',
      },
      'survey_champion': {
        'name': 'SURVEY CHAMPION',
        'description': 'Complete 20 surveys',
        'icon': '📊',
      },
      'early_adopter': {
        'name': 'EARLY ADOPTER',
        'description': 'Joined in the first week',
        'icon': '🚀',
      },
      'level_5': {
        'name': 'LEVEL 5',
        'description': 'Reached Level 5',
        'icon': '⭐',
      },
      'level_10_max': {
        'name': 'LEVEL 10 MAX',
        'description': 'Reached Maximum Level',
        'icon': '👑',
      },
    };

    return badges[badgeId] ?? {'name': badgeId, 'description': '', 'icon': '🏆'};
  }
}

/// Provider for GamificationService
final gamificationServiceProvider = Provider<GamificationService>((ref) {
  return GamificationService();
});

/// Mock user stats provider (replace with actual API call)
final userStatsProvider = StateProvider<Map<String, dynamic>>((ref) {
  return {
    'xp': 250,
    'currentLevel': 3,
    'journeyStepsCompleted': 5,
    'newsRead': 20,
    'surveysCompleted': 8,
    'isEarlyAdopter': true,
  };
});
