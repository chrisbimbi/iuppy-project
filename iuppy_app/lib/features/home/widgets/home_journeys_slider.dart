import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../journeys/journey_providers.dart';
import '../../journeys/ui/journey_card.dart';

class HomeJourneysSlider extends ConsumerWidget {
  const HomeJourneysSlider({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    debugPrint('HomeJourneysSlider: build called');
    final journeysAsync = ref.watch(journeyProgressProvider);

    return journeysAsync.when(
      data: (journeys) {
        debugPrint('HomeJourneysSlider: data received: ${journeys.length}');
        if (journeys.isEmpty) return const SizedBox.shrink();

        return SizedBox(
          height: 180, // Adjust height as needed
          child: PageView.builder(
            controller: PageController(viewportFraction: 0.9),
            padEnds: false,
            itemCount: journeys.length,
            itemBuilder: (context, index) {
              final journey = journeys[index];
              final title = journey['journey']['title'] as String? ?? 'Jornada';
              final progress = (journey['progress'] as num?)?.toDouble() ?? 0.0;
              final progressPercent = (progress * 100).toInt();

              final isCompleted = progress >= 1.0;

              return Padding(
                padding: const EdgeInsets.only(right: 12, left: 16),
                child: JourneyCard(
                  journeyData: journey,
                ),
              );
            },
          ),
        );
      },
      loading: () {
        debugPrint('HomeJourneysSlider: loading');
        return const Center(child: CircularProgressIndicator());
      },
      error: (err, stack) {
        debugPrint('HomeJourneysSlider: error $err');
        return Center(child: Text('Erro: $err'));
      },
    );
  }
}
