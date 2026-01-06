import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class JourneyCard extends StatelessWidget {
  final Map<String, dynamic> journeyData;
  final VoidCallback? onTap;

  const JourneyCard({
    super.key,
    required this.journeyData,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final journey = journeyData['journey'];
    final title = journey['title'] as String? ?? 'Jornada';
    final progress = (journeyData['progress'] as num?)?.toDouble() ?? 0.0;
    final progressPercent = (progress * 100).toInt();
    final isCompleted = progress >= 1.0;

    return GestureDetector(
      onTap: onTap ?? () => context.push('/journeys/${journey['id']}'),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isCompleted
                ? [Colors.green.shade600, Colors.green.shade800]
                : [const Color(0xFF2563EB), const Color(0xFF4F46E5)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: (isCompleted ? Colors.green : const Color(0xFF2563EB)).withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isCompleted ? 'Concluída' : 'Em andamento',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isCompleted ? 'Parabéns pela conquista!' : 'Continue de onde parou',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 40,
                  height: 40,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 4,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isCompleted ? '100%' : '$progressPercent%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
