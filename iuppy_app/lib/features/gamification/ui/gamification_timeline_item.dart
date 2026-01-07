import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class GamificationTimelineItem extends StatelessWidget {
  final Map<String, dynamic> item;
  final bool isLast;

  const GamificationTimelineItem({
    super.key,
    required this.item,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final actionType = item['actionType'] ?? 'UNKNOWN';
    final description = item['description'] ?? 'Atividade';
    final amount = item['amount'] ?? 0;
    final dateStr = item['createdAt'];
    final date = dateStr != null ? DateTime.parse(dateStr) : DateTime.now();
    final dateFormatted = DateFormat('dd/MM HH:mm').format(date.toLocal());

    // Icon & Color Logic
    IconData iconData;
    Color color;

    switch (actionType) {
      case 'JOURNEY_STEP':
        iconData = Icons.flag;
        color = Colors.blue;
        break;
      case 'JOURNEY_COMPLETION':
        iconData = Icons.emoji_events;
        color = Colors.amber;
        break;
      case 'NEWS_READ':
        iconData = Icons.article;
        color = Colors.purple;
        break;
      case 'SURVEY_COMPLETION':
        iconData = Icons.poll;
        color = Colors.teal;
        break;
      case 'SOCIAL_REACTION':
        iconData = Icons.thumb_up;
        color = Colors.pink;
        break;
      case 'SOCIAL_COMMENT':
        iconData = Icons.comment;
        color = Colors.orange;
        break;
      case 'MANUAL_AWARD':
        iconData = Icons.star;
        color = Colors.green;
        break;
      default:
        iconData = Icons.circle;
        color = Colors.grey;
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
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Icon(
                    iconData,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
                // Bottom Line
                Expanded(
                  child: isLast
                      ? Container() // No line after last item
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
              padding: const EdgeInsets.only(bottom: 16.0),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            description,
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            dateFormatted,
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '+$amount XP',
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
