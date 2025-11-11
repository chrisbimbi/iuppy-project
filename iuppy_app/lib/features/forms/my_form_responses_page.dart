// lib/features/forms/my_form_responses_page.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'providers/forms_provider.dart';
import 'widgets/submission_detail_sheet.dart';

// formata do jeito que você pediu
String formatHuman(DateTime d) {
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(d.day)}/${two(d.month)}/${d.year % 100} - ${two(d.hour)}:${two(d.minute)}';
}

// mapeia status do backend pra algo de RH bonitinho
String mapStatus(String raw) {
  switch (raw) {
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Reprovado';
    case 'pending':
      return 'Pendente';
    default:
      return raw;
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
    default:
      return Theme.of(ctx).colorScheme.surfaceVariant;
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

        // agrupa por dia
        final Map<String, List<Map<String, dynamic>>> byDay = {};
        for (final it in raw) {
          final submittedStr = it['submittedAt']?.toString();
          DateTime? dt;
          if (submittedStr != null && submittedStr.isNotEmpty) {
            dt = DateTime.tryParse(submittedStr);
          }
          dt ??= DateTime.now();
          final dayKey = DateTime(dt.year, dt.month, dt.day).toIso8601String();
          byDay.putIfAbsent(dayKey, () => []).add({
            ...it,
            '_parsedDate': dt,
          });
        }

        final dayKeys = byDay.keys.toList()
          ..sort((a, b) => b.compareTo(a)); // mais recentes em cima

        return RefreshIndicator(
          onRefresh: () async {
            ref.read(formsRefreshProvider.notifier).state++;
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

              return _DayTimelineSection(
                dayLabel: dayLabel,
                items: entries,
              );
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
  const _DayTimelineSection({
    required this.dayLabel,
    required this.items,
  });

  @override
  State<_DayTimelineSection> createState() => _DayTimelineSectionState();
}

class _DayTimelineSectionState extends State<_DayTimelineSection> {
  bool _open = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () => setState(() => _open = !_open),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(width: 16),
              Column(
                children: [
                  Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  Container(
                    width: 2,
                    height: 24,
                    color: Theme.of(context).dividerColor,
                  ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(
                    widget.dayLabel,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ),
              Icon(_open ? Icons.expand_less : Icons.expand_more),
              const SizedBox(width: 12),
            ],
          ),
        ),
        if (_open)
          ...widget.items.map(
            (it) => _SubmissionCard(item: it),
          ),
      ],
    );
  }
}

class _SubmissionCard extends ConsumerWidget {
  final Map<String, dynamic> item;
  const _SubmissionCard({required this.item});

  bool _isApprovalStatus(String s) =>
      s == 'approved' || s == 'rejected' || s == 'pending';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final formTitle = item['formTitle']?.toString() ?? '';
    final submittedAtStr = item['submittedAt']?.toString() ?? '';
    final dt = DateTime.tryParse(submittedAtStr) ?? DateTime.now();
    final formId = item['formId']?.toString();
    final subId = item['submissionId']?.toString();
    final hasReply =
        (item['hasReply'] == true) || ((item['replyCount'] ?? 0) > 0);
    final rawStatus = item['status']?.toString() ?? '';

    return Padding(
      padding: const EdgeInsets.only(left: 50, right: 16, bottom: 10),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            if (formId == null || subId == null) return;
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (_) => SubmissionDetailSheet(
                formId: formId,
                submissionId: subId,
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // título + ícone reply
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        formTitle.isEmpty ? 'Formulário' : formTitle,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    if (hasReply)
                      const Icon(Icons.mark_email_unread,
                          color: Colors.blue, size: 20),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Enviado em ${formatHuman(dt)}',
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(color: Colors.grey[600]),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    // status só se for de aprovação
                    if (_isApprovalStatus(rawStatus))
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor(rawStatus, context),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Text(
                          mapStatus(rawStatus),
                          style: Theme.of(context).textTheme.labelMedium,
                        ),
                      ),
                    // chat
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: hasReply
                            ? Colors.blue.shade50
                            : Theme.of(context).colorScheme.surfaceVariant,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            hasReply
                                ? Icons.chat_bubble
                                : Icons.chat_bubble_outline,
                            size: 16,
                            color:
                                hasReply ? Colors.blue : Colors.grey.shade700,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            hasReply ? 'Com resposta' : 'Sem resposta',
                            style: Theme.of(context).textTheme.labelMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
