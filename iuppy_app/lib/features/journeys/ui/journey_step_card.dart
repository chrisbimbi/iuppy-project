import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class JourneyStepCard extends ConsumerWidget {
  final Map<String, dynamic> step;
  final String journeyId;

  const JourneyStepCard({
    super.key,
    required this.step,
    required this.journeyId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final primaryColor = Theme.of(context).primaryColor;
    final isLocked = step['locked'] == true;
    final isCompleted = step['completed'] == true;

    return GestureDetector(
      onTap: isLocked
          ? null
          : () => context.push(
              '/journeys/step?journeyId=$journeyId&stepId=${step['id']}',
              extra: step),
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: isCompleted
                ? Colors.green.withOpacity(0.3)
                : Colors.transparent,
            width: 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isLocked
                      ? Colors.grey.shade100
                      : (isCompleted
                          ? Colors.green.withOpacity(0.1)
                          : primaryColor.withOpacity(0.1)),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isLocked
                      ? Icons.lock_outline
                      : _getIconForType(step['type']?.toString().toLowerCase()),
                  color: isLocked
                      ? Colors.grey
                      : (isCompleted ? Colors.green : primaryColor),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      step['title']?.toString() ?? 'Passo',
                      style: TextStyle(
                        fontFamily: 'Space Mono',
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isLocked ? Colors.grey : Colors.black87,
                      ),
                    ),
                    if (step['description'] != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        step['description'].toString(),
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              if (!isLocked)
                Icon(
                  Icons.chevron_right,
                  color: Colors.grey.shade300,
                ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'video':
        return Icons.play_circle_outline;
      case 'poll':
        return Icons.poll_outlined;
      case 'form':
        return Icons.assignment_outlined;
      case 'quiz':
        return Icons.quiz_outlined;
      case 'article':
      default:
        return Icons.article_outlined;
    }
  }
}
