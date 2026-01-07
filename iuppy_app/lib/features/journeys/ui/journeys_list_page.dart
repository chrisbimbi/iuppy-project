import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../journey_providers.dart';
import 'package:iuppy_app/features/journeys/ui/journey_navigator.dart';

class JourneysListPage extends ConsumerWidget {
  final String? journeyId;
  const JourneysListPage({super.key, this.journeyId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = ref.watch(journeyServiceProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: Stack(
        children: [
          // Content
          Padding(
            padding: const EdgeInsets.only(top: 100), // Space for header
            child: JourneyNavigator(service: service, highlightJourneyId: journeyId),
          ),

          // Glass Header
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 100,
                  padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.7),
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.white.withValues(alpha: 0.5),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () {
                          if (GoRouter.of(context).canPop()) {
                            GoRouter.of(context).pop();
                          } else {
                            GoRouter.of(context).go('/home');
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'JORNADAS',
                        style: TextStyle(
                          fontFamily: 'Space Mono',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
