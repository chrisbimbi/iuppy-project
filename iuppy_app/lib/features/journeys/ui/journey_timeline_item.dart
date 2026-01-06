import 'package:flutter/material.dart';

class JourneyTimelineItem extends StatelessWidget {
  final Map<String, dynamic> step;
  final String journeyId;
  final bool isLast;
  final bool isLocked;
  final bool isCompleted;
  final bool isJourneyCompleted;
  final VoidCallback? onTap;

  const JourneyTimelineItem({
    super.key,
    required this.step,
    required this.journeyId,
    this.isLast = false,
    this.isLocked = false,
    this.isCompleted = false,
    this.isJourneyCompleted = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final title = step['title'] ?? 'Sem título';
    final type =
        (step['contentType'] ?? step['mediaType'] ?? 'ARTICLE').toString();
    final delay = step['delayDays'] ?? 0;

    Color statusColor;
    IconData statusIcon;

    if (isCompleted) {
      statusColor = Colors.green;
      statusIcon = Icons.check;
    } else if (isLocked) {
      statusColor = Colors.grey.shade400;
      statusIcon = Icons.lock;
    } else {
      statusColor = Colors.orange;
      statusIcon = Icons.play_arrow;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline Line & Dot
          SizedBox(
            width: 40,
            child: Column(
              children: [
                // Top Line
                Expanded(
                  child: Container(
                    width: 2,
                    color: Colors.grey.shade300,
                  ),
                ),
                // Dot
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: statusColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: statusColor.withOpacity(0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    statusIcon,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
                // Bottom Line
                Expanded(
                  child: isLast
                      ? Container()
                      : Container(
                          width: 2,
                          color: Colors.grey.shade300,
                        ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Content Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: InkWell(
                onTap: isLocked ? null : onTap,
                borderRadius: BorderRadius.circular(16),
                child: Opacity(
                  opacity: isLocked ? 0.6 : 1.0,
                  child: Container(
                    padding: const EdgeInsets.all(16),
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
                      border: isCompleted
                          ? Border.all(color: Colors.green.withOpacity(0.3))
                          : null,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.black87,
                                ),
                              ),
                            ),
                            if (!isLocked && !isCompleted)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.orange.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  '+10 XP',
                                  style: TextStyle(
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _buildTag(type, Colors.blue.shade50,
                                Colors.blue.shade700),
                            const SizedBox(width: 8),
                            _buildTag(
                              'Dia ${delay + 1}',
                              Colors.grey.shade100,
                              Colors.grey.shade600,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
