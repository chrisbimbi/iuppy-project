import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';
import 'data/journey_service.dart';

final journeyServiceProvider = Provider<JourneyService>((ref) {
  return JourneyService(ref.read(apiClientProvider));
});

final journeyProgressProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final service = ref.read(journeyServiceProvider);
  return service.getProgress();
});

final journeyBadgesProvider = Provider<AsyncValue<int>>((ref) {
  return ref.watch(journeyProgressProvider).whenData((journeys) {
    int count = 0;
    for (final j in journeys) {
      final steps = (j['journey']['steps'] as List?) ?? [];
      for (final step in steps) {
        final isLocked = step['locked'] == true;
        final isCompleted = step['completed'] == true;
        if (!isLocked && !isCompleted) {
          count++;
        }
      }
    }
    return count;
  });
});
