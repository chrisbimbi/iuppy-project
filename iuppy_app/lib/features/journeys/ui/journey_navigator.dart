import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/journeys/data/journey_service.dart';
import 'package:iuppy_app/features/journeys/ui/journey_timeline_item.dart';
import 'package:iuppy_app/features/journeys/ui/journey_card.dart';

class JourneyNavigator extends ConsumerStatefulWidget {
  final JourneyService service;
  final String? highlightJourneyId;

  const JourneyNavigator(
      {super.key, required this.service, this.highlightJourneyId});

  @override
  ConsumerState<JourneyNavigator> createState() => _JourneyNavigatorState();
}

class _JourneyNavigatorState extends ConsumerState<JourneyNavigator> {
  List<Map<String, dynamic>> _instances = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final data = await widget.service.getProgress();
      setState(() {
        if (widget.highlightJourneyId != null) {
          _instances = data
              .where((j) => j['journey']['id'] == widget.highlightJourneyId)
              .toList();
        } else {
          _instances = data;
        }
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
      });
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_instances.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_outline,
                  size: 64, color: Colors.green),
            ),
            const SizedBox(height: 24),
            const Text(
              'TUDO EM DIA!',
              style: TextStyle(
                fontFamily: 'Space Mono',
                fontSize: 20,
                fontWeight: FontWeight.bold,
                letterSpacing: -1.0,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Você não tem jornadas ativas no momento.',
              style: TextStyle(
                color: Colors.grey.shade500,
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    // MODE 1: Detail Mode (Single Journey Steps)
    if (widget.highlightJourneyId != null) {
      final instance = _instances.firstWhere(
        (i) => i['journey']['id'] == widget.highlightJourneyId,
        orElse: () => {},
      );

      if (instance.isEmpty) {
        return const Center(child: Text('Jornada não encontrada'));
      }

      final journey = instance['journey'];
      final steps = (journey['steps'] as List).cast<Map<String, dynamic>>();
      final isJourneyCompleted = instance['status'] == 'COMPLETED';

      // Sort steps by Day/Time DESCENDING (Future at Top)
      // Handled by Backend now.
      // steps.sort(...)

      // Determine step status based on instance progress
      final currentStepIndex = instance['currentStep'] ?? 0;

      return ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          // Show Card at the top of details too, but non-clickable
          JourneyCard(
            journeyData: instance,
            onTap: () {},
          ),
          const SizedBox(height: 24),
          const Text(
            'SEUS PASSOS',
            style: TextStyle(
              fontFamily: 'Space Mono',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 16),
          if (steps.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(
                child: Text(
                  'Nenhum passo encontrado.',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          ...steps.asMap().entries.map((entry) {
            final i = entry.key;
            final step = entry.value;
            final stepOrder = step['orderIndex'] ?? 0;

            bool isStepCompleted = step['completed'] == true;
            bool isTimeLocked = step['locked'] ?? false;
            // Use stepOrder instead of list index i because list is reversed
            bool isSeqLocked =
                !isJourneyCompleted && stepOrder > currentStepIndex;
            bool isLocked = isTimeLocked || isSeqLocked;

            return JourneyTimelineItem(
              step: step,
              journeyId: journey['id'],
              isLast: i == steps.length - 1,
              isCompleted: isStepCompleted,
              isLocked: isLocked,
              isJourneyCompleted: isJourneyCompleted,
              onTap: () {
                context.push(
                  '/journeys/${journey['id']}/steps/${step['id']}',
                  extra: {
                    'isReadOnly': isJourneyCompleted,
                  },
                ).then((_) => _loadData()); // Refresh on return
              },
            );
          }),
        ],
      );
    }

    // MODE 2: List Mode (All Journeys Cards)
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: _instances.length,
      itemBuilder: (context, index) {
        final instance = _instances[index];
        final journey = instance['journey'];

        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: JourneyCard(
            journeyData: instance,
            onTap: () {
              // Navigate to Detail Mode
              context.push('/journeys/${journey['id']}');
            },
          ),
        );
      },
    );
  }
}
