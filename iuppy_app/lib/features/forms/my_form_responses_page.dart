// lib/features/forms/my_form_responses_page.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:badges/badges.dart' as badges;

import 'providers/forms_provider.dart';
import 'widgets/form_chat_sheet.dart';
// 🔥 IMPORT OBRIGATÓRIO
import 'widgets/submission_detail_sheet.dart';

String formatHuman(DateTime d) {
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(d.day)}/${two(d.month)}/${d.year % 100} - ${two(d.hour)}:${two(d.minute)}';
}

String mapStatus(String raw) {
  switch (raw) {
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Reprovado';
    case 'pending':
      return 'Pendente';
    case 'submitted':
      return 'Enviado';
    case 'replied':
      return 'Respondido';
    default:
      return 'Enviado';
  }
}

Color statusColor(String raw, BuildContext ctx) {
  switch (raw) {
    case 'approved':
      return Colors.green.shade200;
    case 'rejected':
      return Colors.red.shade200;
    case 'pending':
      return Colors.amber.shade200;
    case 'replied':
      return Colors.blue.shade200;
    case 'submitted':
    default:
      return Theme.of(ctx).colorScheme.surfaceContainerHighest;
  }
}

class MyFormResponsesPage extends ConsumerWidget {
  const MyFormResponsesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncMy = ref.watch(myFormsSubmissionsProvider);

    return asyncMy.when(
      data: (data) {
        final raw = (data['items'] as List? ?? []).cast<Map<String, dynamic>>();
        if (raw.isEmpty) {
          return const Center(child: Text('Nenhuma resposta encontrada'));
        }

        final Map<String, List<Map<String, dynamic>>> byDay = {};
        for (final it in raw) {
          final submittedStr = it['submittedAt']?.toString();
          DateTime? dt;
          if (submittedStr != null && submittedStr.isNotEmpty) {
            dt = DateTime.tryParse(submittedStr);
          }
          dt ??= DateTime.now();
          final dayKey = DateTime(dt.year, dt.month, dt.day).toIso8601String();
          byDay.putIfAbsent(dayKey, () => []).add({...it, '_parsedDate': dt});
        }
        final dayKeys = byDay.keys.toList()..sort((a, b) => b.compareTo(a));

        return RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(myFormsSubmissionsProvider);
            await ref.read(myFormsSubmissionsProvider.future);
          },
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 32),
            itemCount: dayKeys.length,
            itemBuilder: (context, index) {
              final dayKey = dayKeys[index];
              final entries = byDay[dayKey]!;
              final anyDt = entries.first['_parsedDate'] as DateTime;
              final dayLabel =
                  '${anyDt.day.toString().padLeft(2, '0')}/${anyDt.month.toString().padLeft(2, '0')}/${anyDt.year}';
              return _DayTimelineSection(dayLabel: dayLabel, items: entries);
            },
          ),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Erro: $e')),
    );
  }
}

class _DayTimelineSection extends StatefulWidget {
  final String dayLabel;
  final List<Map<String, dynamic>> items;
  const _DayTimelineSection({required this.dayLabel, required this.items});
  @override
  State<_DayTimelineSection> createState() => _DayTimelineSectionState();
}

class _DayTimelineSectionState extends State<_DayTimelineSection> {
  bool _open = true;
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 🔥 CORREÇÃO: Material para evitar crash
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _open = !_open),
            child: Row(
              children: [
                const SizedBox(width: 16),
                Column(
                  children: [
                    Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle)),
                    Container(
                        width: 2,
                        height: 24,
                        color: Theme.of(context).dividerColor),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                    child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Text(widget.dayLabel,
                            style: Theme.of(context).textTheme.titleMedium))),
                Icon(_open ? Icons.expand_less : Icons.expand_more),
                const SizedBox(width: 12),
              ],
            ),
          ),
        ),
        if (_open) ...widget.items.map((it) => _SubmissionCardS3(item: it)),
      ],
    );
  }
}

class _SubmissionCardS3 extends ConsumerWidget {
  final Map<String, dynamic> item;
  const _SubmissionCardS3({required this.item});

  bool _isStatusVisible(String s) =>
      s == 'approved' ||
      s == 'rejected' ||
      s == 'pending' ||
      s == 'replied' ||
      s == 'submitted';

  void _openChat(
      BuildContext context, WidgetRef ref, String formId, String subId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FormChatSheet(formId: formId, submissionId: subId),
    );
  }

  void _openDetails(BuildContext context, String formId, String subId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) =>
          SubmissionDetailSheet(formId: formId, submissionId: subId),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formTitle = item['formTitle']?.toString() ?? 'Formulário';
    final submittedAtStr = item['submittedAt']?.toString() ?? '';
    final dt = DateTime.tryParse(submittedAtStr) ?? DateTime.now();
    final formId = item['formId']?.toString();
    final subId = item['submissionId']?.toString();
    final rawStatus = item['status']?.toString() ?? '';
    final unreadCount = item['unreadChatCount'] as int? ?? 0;
    final hasUnread = unreadCount > 0;

    final Widget chatIcon = badges.Badge(
      showBadge: hasUnread,
      badgeContent: Text(unreadCount.toString(),
          style: const TextStyle(color: Colors.white, fontSize: 10)),
      badgeStyle: const badges.BadgeStyle(badgeColor: Colors.red),
      child: Icon(hasUnread ? Icons.mark_email_unread : Icons.drafts_outlined,
          color: hasUnread ? Colors.red : Colors.blue.shade700, size: 28),
    );

    return Padding(
      padding: const EdgeInsets.only(left: 50, right: 16, bottom: 10),
      child: Card(
        elevation: 1,
        margin: const EdgeInsets.all(0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          // 🔥 CLIQUE DO CARD: Abre Detalhes
          onTap: () {
            if (formId != null && subId != null) {
              _openDetails(context, formId, subId);
            }
          },
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(formTitle,
                          style: Theme.of(context).textTheme.titleMedium,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 6),
                      Text('Enviado em ${formatHuman(dt)}',
                          style: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.copyWith(color: Colors.grey[600])),
                      const SizedBox(height: 10),
                      if (_isStatusVisible(rawStatus))
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                              color: statusColor(rawStatus, context),
                              borderRadius: BorderRadius.circular(24)),
                          child: Text(mapStatus(rawStatus),
                              style: Theme.of(context).textTheme.labelMedium),
                        ),
                    ],
                  ),
                ),
                // 🔥 CLIQUE DO ÍCONE: Abre Chat
                GestureDetector(
                  onTap: () {
                    if (formId != null && subId != null) {
                      _openChat(context, ref, formId, subId);
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(left: 12.0),
                    child: chatIcon,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
