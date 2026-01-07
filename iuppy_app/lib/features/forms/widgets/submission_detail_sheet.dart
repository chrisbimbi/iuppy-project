// lib/features/forms/widgets/submission_detail_sheet.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/forms_provider.dart';
import 'form_chat_sheet.dart';

String _readTranslatable(dynamic jsonField, [String locale = 'pt-BR']) {
  if (jsonField == null) return '';
  if (jsonField is String) return jsonField;
  if (jsonField is Map) {
    final Map<String, dynamic> map = Map<String, dynamic>.from(jsonField);
    return map[locale]?.toString() ??
        map['pt-BR']?.toString() ??
        map.values.first?.toString() ??
        '';
  }
  return jsonField.toString();
}

String formatHuman(DateTime d) {
  String two(int v) => v.toString().padLeft(2, '0');
  return '${two(d.day)}/${two(d.month)}/${d.year % 100} - ${two(d.hour)}:${two(d.minute)}';
}

String mapApprovalStatus(String raw) {
  switch (raw) {
    case 'approved':
      return 'Aprovado';
    case 'rejected':
      return 'Reprovado';
    case 'pending':
      return 'Pendente';
    default:
      return '';
  }
}

Color approvalColor(String raw, BuildContext ctx) {
  switch (raw) {
    case 'approved':
      return Colors.green.shade100;
    case 'rejected':
      return Colors.red.shade100;
    case 'pending':
      return Colors.amber.shade100;
    default:
      return Theme.of(ctx).colorScheme.surfaceContainerHighest;
  }
}

class SubmissionDetailSheet extends ConsumerWidget {
  final String formId;
  final String submissionId;
  const SubmissionDetailSheet(
      {super.key, required this.formId, required this.submissionId});
  bool _isApprovalStatus(String s) =>
      s == 'approved' || s == 'rejected' || s == 'pending';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncDetail =
        ref.watch(formSubmissionDetailProvider((formId, submissionId)));
    final asyncForm = ref.watch(formDetailProvider(formId));

    return SafeArea(
      top: false,
      child: Material(
        color: const Color(0xfff6f4f7),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: asyncDetail.when(
            loading: () => const SizedBox(
                height: 200, child: Center(child: CircularProgressIndicator())),
            error: (e, _) =>
                SizedBox(height: 200, child: Center(child: Text('Erro: $e'))),
            data: (detail) {
              return asyncForm.when(
                  loading: () => const SizedBox(
                      height: 200,
                      child: Center(child: CircularProgressIndicator())),
                  error: (e, _) => SizedBox(
                      height: 200, child: Center(child: Text('Erro form: $e'))),
                  data: (form) {
                    final submittedAt = DateTime.tryParse(
                        detail['submittedAt']?.toString() ?? '');
                    final formTitle =
                        detail['formTitle']?.toString() ?? 'Formulário';
                    final rawStatus = detail['status']?.toString() ?? '';
                    final answers = (detail['answers'] as List? ?? [])
                        .cast<Map<String, dynamic>>();
                    final attachments = (detail['attachments'] as List? ?? [])
                        .cast<Map<String, dynamic>>();
                    final rhActions = (detail['rhActions'] as List? ?? [])
                        .cast<Map<String, dynamic>>();
                    final locale = form['defaultLocale']?.toString() ?? 'pt-BR';
                    final fields = (form['fields'] as List? ?? [])
                        .cast<Map<String, dynamic>>();
                    final requiresApproval = form['requiresApproval'] == true;
                    final allowAttachments =
                        (form['attachmentsAllowed'] == true) ||
                            (form['allowAttachments'] == true);

                    final Map<String, Map<String, dynamic>> answersByField = {};
                    for (final ans in answers) {
                      if (ans['fieldId'] != null) {
                        answersByField[ans['fieldId'].toString()] = ans;
                      }
                    }

                    return DraggableScrollableSheet(
                      expand: false,
                      initialChildSize: 0.75,
                      minChildSize: 0.4,
                      maxChildSize: 0.95,
                      builder: (context, scrollController) {
                        return SingleChildScrollView(
                          controller: scrollController,
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Center(
                                  child: Container(
                                      width: 50,
                                      height: 5,
                                      margin: const EdgeInsets.only(bottom: 14),
                                      decoration: BoxDecoration(
                                          color: Colors.grey.shade400,
                                          borderRadius:
                                              BorderRadius.circular(999)))),
                              Text(formTitle,
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineSmall
                                      ?.copyWith(
                                          color: Colors.orange[800],
                                          fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              if (submittedAt != null)
                                Text('Enviado em ${formatHuman(submittedAt)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(color: Colors.orange[800])),
                              const SizedBox(height: 14),
                              Wrap(spacing: 8, runSpacing: 8, children: [
                                const Chip(
                                    label: Text('Enviado'),
                                    backgroundColor: Colors.white),
                                if (requiresApproval &&
                                    _isApprovalStatus(rawStatus))
                                  Chip(
                                      label: Text(mapApprovalStatus(rawStatus)),
                                      backgroundColor:
                                          approvalColor(rawStatus, context)),
                                if (rhActions.isNotEmpty)
                                  const Chip(label: Text('Com resposta do RH')),
                              ]),
                              const SizedBox(height: 22),
                              Text('Respostas',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                          color: Colors.orange[800],
                                          fontWeight: FontWeight.w600)),
                              const SizedBox(height: 12),

                              if (fields.isEmpty && answers.isEmpty)
                                Text('Sem respostas salvas',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: Colors.grey[600]))
                              else
                                Column(children: [
                                  for (int i = 0; i < fields.length; i++)
                                    _AnswerCard(
                                        field: fields[i],
                                        locale: locale,
                                        answer: answersByField[
                                            fields[i]['id']?.toString()])
                                ]),

                              if (allowAttachments &&
                                  attachments.isNotEmpty) ...[
                                const SizedBox(height: 20),
                                Text('Anexos',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                            color: Colors.orange[800],
                                            fontWeight: FontWeight.w600)),
                                const SizedBox(height: 10),
                                _AttachmentStrip(
                                    attachments: attachments, onTap: (att) {}),
                              ],

                              if (rhActions.isNotEmpty) ...[
                                const SizedBox(height: 20),
                                Text('Interações do RH',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                            color: Colors.orange[800],
                                            fontWeight: FontWeight.w600)),
                                const SizedBox(height: 10),
                                Column(
                                    children: rhActions
                                        .map((rh) => Container(
                                              margin: const EdgeInsets.only(
                                                  bottom: 10),
                                              padding: const EdgeInsets.all(12),
                                              decoration: BoxDecoration(
                                                  color:
                                                      Colors.blueGrey.shade50,
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12)),
                                              child: Row(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Icon(
                                                        rh['type'] == 'approve'
                                                            ? Icons.check_circle
                                                            : rh['type'] ==
                                                                    'reject'
                                                                ? Icons
                                                                    .cancel_outlined
                                                                : Icons
                                                                    .chat_bubble,
                                                        size: 20,
                                                        color: Colors.blueGrey),
                                                    const SizedBox(width: 8),
                                                    Expanded(
                                                        child: Text(rh[
                                                                'message'] ??
                                                            '(sem mensagem)')),
                                                  ]),
                                            ))
                                        .toList()),
                              ],

                              const SizedBox(height: 30),

                              // Botão para abrir Chat
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    Navigator.pop(context);
                                    showModalBottomSheet(
                                      context: context,
                                      isScrollControlled: true,
                                      backgroundColor: Colors.transparent,
                                      builder: (_) => FormChatSheet(
                                          formId: formId,
                                          submissionId: submissionId),
                                    );
                                  },
                                  icon: const Icon(Icons.chat_bubble_outline),
                                  label:
                                      const Text('Ver Mensagens / Responder'),
                                  style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.all(16),
                                      side: BorderSide(
                                          color:
                                              Theme.of(context).primaryColor),
                                      shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(12))),
                                ),
                              ),
                              const SizedBox(height: 30),
                            ],
                          ),
                        );
                      },
                    );
                  });
            }),
      ),
    );
  }
}

class _AnswerCard extends StatelessWidget {
  final Map<String, dynamic> field;
  final Map<String, dynamic>? answer;
  final String locale;
  const _AnswerCard({required this.field, this.answer, required this.locale});

  @override
  Widget build(BuildContext context) {
    final label = _readTranslatable(field['label'], locale);
    final rawType =
        (answer?['type'] ?? field['type'] ?? 'short_text').toString();
    final valueStr = answer?['value']?.toString() ?? '';
    final options = (field['options'] as List? ?? [])
        .map((e) =>
            e is Map ? _readTranslatable(e['label'], locale) : e.toString())
        .toList();

    Widget valueWidget;
    switch (rawType) {
      case 'multi_choice':
        final selected = <String>{};
        if (answer?['value'] is List) {
          for (final v in (answer!['value'] as List)) {
            selected.add(v.toString());
          }
        } else if (valueStr.contains(',')) {
          selected.addAll(valueStr.split(',').map((e) => e.trim()));
        } else if (valueStr.isNotEmpty) {
          selected.add(valueStr);
        }
        valueWidget = Wrap(
            spacing: 6,
            runSpacing: 6,
            children: options
                .map((opt) =>
                    _OptionChip(label: opt, selected: selected.contains(opt)))
                .toList());
        break;
      case 'single_choice':
        valueWidget = Wrap(
            spacing: 6,
            runSpacing: 6,
            children: options
                .map(
                    (opt) => _OptionChip(label: opt, selected: opt == valueStr))
                .toList());
        break;
      case 'date':
        DateTime? d;
        if (valueStr.isNotEmpty) d = DateTime.tryParse(valueStr);
        valueWidget = Text(
            d != null
                ? '${d.day}/${d.month}/${d.year}'
                : (valueStr.isEmpty ? '—' : valueStr),
            style: Theme.of(context).textTheme.bodyMedium);
        break;
      default:
        valueWidget = Text(valueStr.isEmpty ? '—' : valueStr,
            style: Theme.of(context).textTheme.bodyMedium);
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: Theme.of(context)
                .textTheme
                .labelLarge
                ?.copyWith(color: Colors.orange[700])),
        const SizedBox(height: 8),
        valueWidget
      ]),
    );
  }
}

class _OptionChip extends StatelessWidget {
  final String label;
  final bool selected;
  const _OptionChip({required this.label, required this.selected});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
          color: selected
              ? Colors.orange[700]!.withValues(alpha: 0.12)
              : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
              color: selected ? Colors.orange[700]! : Colors.grey.shade300)),
      child: Text(label,
          style: TextStyle(
              color: selected ? Colors.orange[700] : Colors.grey.shade800)),
    );
  }
}

class _AttachmentStrip extends StatelessWidget {
  final List<Map<String, dynamic>> attachments;
  final void Function(Map<String, dynamic>) onTap;
  const _AttachmentStrip({required this.attachments, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
        height: 80,
        child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: attachments.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              // final att = attachments[index];
              // final path = att['storagePath']?.toString() ?? 'arquivo';
              return Container(
                  width: 78,
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200)),
                  child: const Center(
                      child: Icon(Icons.insert_drive_file,
                          size: 26, color: Colors.orange)));
            }));
  }
}
