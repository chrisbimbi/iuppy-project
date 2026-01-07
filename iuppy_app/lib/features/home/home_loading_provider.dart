import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/chat/chat_service.dart'; // Import for chatBadgeProvider

import '../../core/providers.dart';
import '../forms/providers/forms_provider.dart';
import '../gamification/gamification_service.dart';
import '../journeys/journey_providers.dart';
import '../surveys/survey_providers.dart';

enum HomeStartupState { loading, error, ready }

class HomeBootstrapNotifier extends StateNotifier<HomeStartupState> {
  final Ref ref;
  HomeBootstrapNotifier(this.ref) : super(HomeStartupState.loading) {
    _init();
  }

  Future<void> _init() async {
    try {
      state = HomeStartupState.loading;

      // 1. Critical Base Data (can run in parallel)
      // User Profile, Company Settings, Spaces, Channels
      await Future.wait([
        ref.read(userProfileProvider.future),
        ref.read(companySettingsProvider.future),
        ref.read(spacesRepoProvider).fetchAndCache(),
        ref.read(channelsRepoProvider).fetchAndCache(),
      ]);

      // 2. Content Data (News, Gamification, Journeys, Modules)
      // These usually depend on the user being authenticated and settings loaded
      await Future.wait([
        ref.read(newsRepoProvider).homeFeedRemoteFirst(maxItems: 24),
        ref.refresh(userStatsProvider.future), // Ensure fresh XP
        ref.refresh(journeyProgressProvider.future),
        ref.refresh(surveysListProvider.future),
        ref.refresh(formsListProvider.future),
        ref.refresh(myFormsSubmissionsProvider.future),
      ]);

      // 3. Badges & Counters (Invalidate to force re-calc or re-fetch if they are providers)
      ref.invalidate(unreadCountersProvider);
      ref.invalidate(formsBadgesProvider);
      ref.invalidate(newSurveysCountProvider);
      ref.invalidate(chatBadgeProvider);

      state = HomeStartupState.ready;
    } catch (e, stack) {
      debugPrint('[HomeBootstrap] Error: $e');
      debugPrint('[HomeBootstrap] Stack: $stack');
      state = HomeStartupState.error;
    }
  }

  Future<void> refresh() async {
    await _init();
  }
}

final homeBootstrapProvider =
    StateNotifierProvider<HomeBootstrapNotifier, HomeStartupState>((ref) {
  return HomeBootstrapNotifier(ref);
});
