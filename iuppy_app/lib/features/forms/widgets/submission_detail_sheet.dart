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
      return Theme.of(ctx).colorScheme.surfaceVariant;
  }
}

Color approvalTextColor(String raw) {
  switch (raw) {
    case 'approved':
      return Colors.green.shade800;
    case 'rejected':
      return Colors.red.shade800;
    case 'pending':
      return Colors.amber.shade800;
    default:
      return Colors.black87;
  }
}

class SubmissionDetailSheet extends ConsumerWidget {
  final String formId;
  final String submissionId;

  const SubmissionDetailSheet({
    super.key,
    required this.formId,
    required this.submissionId,
  });

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
        color: const Color(0xfff6f4f7), // Fundo cinza claro
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: asyncDetail.when(
          loading: () => const SizedBox(
            height: 300,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SizedBox(
            height: 200,
            child: Center(child: Text('Erro ao carregar: $e')),
          ),
          data: (detail) {
            return asyncForm.when(
              loading: () => const SizedBox(
                  height: 300,
                  child: Center(child: CircularProgressIndicator())),
              error: (e, _) =>
                  SizedBox(height: 200, child: Center(child: Text('Erro: $e'))),
              data: (form) {
                final submittedAtStr = detail['submittedAt']?.toString() ?? '';
                final submittedAt = DateTime.tryParse(submittedAtStr);

                final locale = form['defaultLocale']?.toString() ?? 'pt-BR';
                final formTitle =
                    detail['formTitle']?.toString() ?? 'Formulário';
                // Pega a descrição do form para exibir no card
                final formDescription =
                    _readTranslatable(form['description'], locale);

                final rawStatus = detail['status']?.toString() ?? '';
                final answers = (detail['answers'] as List? ?? [])
                    .cast<Map<String, dynamic>>();
                final attachments = (detail['attachments'] as List? ?? [])
                    .cast<Map<String, dynamic>>();
                final rhActions = (detail['rhActions'] as List? ?? [])
                    .cast<Map<String, dynamic>>();
                final fields = (form['fields'] as List? ?? [])
                    .cast<Map<String, dynamic>>();

                final requiresApproval = form['requiresApproval'] == true;
                final allowAttachments = (form['attachmentsAllowed'] == true) ||
                    (form['allowAttachments'] == true);

                final Map<String, Map<String, dynamic>> answersByField = {};
                for (final ans in answers) {
                  if (ans['fieldId'] != null) {
                    answersByField[ans['fieldId'].toString()] = ans;
                  }
                }

                return DraggableScrollableSheet(
                  expand: false,
                  initialChildSize: 0.85,
                  minChildSize: 0.5,
                  maxChildSize: 0.95,
                  builder: (context, scrollController) {
                    return SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Handle
                          Center(
                            child: Container(
                              width: 40,
                              height: 4,
                              margin: const EdgeInsets.only(bottom: 20),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade300,
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),

                          // 🔥 HEADER CARD (Estilo Lista)
                          Card(
                            elevation: 0,
                            color: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(color: Colors.grey.shade200),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Ícone do Form
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary
                                              .withOpacity(0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.description,
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                          size: 24,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      // Textos
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              formTitle,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium
                                                  ?.copyWith(
                                                      fontWeight:
                                                          FontWeight.bold),
                                            ),
                                            const SizedBox(height: 4),
                                            if (submittedAt != null)
                                              Text(
                                                'Enviado em ${formatHuman(submittedAt)}',
                                                style: Theme.of(context)
                                                    .textTheme
                                                    .bodySmall
                                                    ?.copyWith(
                                                        color:
                                                            Colors.grey[600]),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (formDescription.isNotEmpty) ...[
                                    const SizedBox(height: 12),
                                    Text(
                                      formDescription,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(color: Colors.grey[700]),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                  const SizedBox(height: 16),
                                  const Divider(height: 1),
                                  const SizedBox(height: 12),
                                  // Chips
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      // Status de Aprovação
                                      if (requiresApproval &&
                                          _isApprovalStatus(rawStatus))
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: approvalColor(
                                                rawStatus, context),
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            mapApprovalStatus(rawStatus),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color:
                                                  approvalTextColor(rawStatus),
                                            ),
                                          ),
                                        )
                                      else
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.grey.shade100,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            'Enviado',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey.shade700,
                                            ),
                                          ),
                                        ),

                                      // Badge de Resposta do RH
                                      if (rhActions.isNotEmpty)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.blue.shade50,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                            border: Border.all(
                                                color: Colors.blue.shade100),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.chat_bubble_outline,
                                                  size: 12,
                                                  color: Colors.blue.shade700),
                                              const SizedBox(width: 4),
                                              Text(
                                                'RH Respondeu',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.blue.shade700,
                                                ),
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

                          const SizedBox(height: 24),

                          // Seção de Respostas
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              'SUAS RESPOSTAS',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[600],
                                    letterSpacing: 1.2,
                                  ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          if (fields.isEmpty && answers.isEmpty)
                            const Center(
                                child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: Text('Sem dados para exibir.'),
                            ))
                          else
                            Column(
                              children: [
                                for (int i = 0; i < fields.length; i++)
                                  _AnswerCard(
                                    field: fields[i],
                                    locale: locale,
                                    answer: answersByField[
                                        fields[i]['id']?.toString()],
                                  ),
                              ],
                            ),

                          // Anexos
                          if (allowAttachments && attachments.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: Text(
                                'ANEXOS',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey[600],
                                      letterSpacing: 1.2,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            _AttachmentStrip(
                              attachments: attachments,
                              onTap: (att) {
                                // TODO: Implementar viewer
                              },
                            ),
                          ],

                          // Interações Legado (Opcional, se quiser esconder e deixar só no chat)
                          if (rhActions.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: Text(
                                'HISTÓRICO',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey[600],
                                      letterSpacing: 1.2,
                                    ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Column(
                              children: rhActions.map((rh) {
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border:
                                        Border.all(color: Colors.grey.shade200),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        rh['type'] == 'approve'
                                            ? Icons.check_circle
                                            : rh['type'] == 'reject'
                                                ? Icons.cancel
                                                : Icons.info,
                                        size: 20,
                                        color: rh['type'] == 'approve'
                                            ? Colors.green
                                            : rh['type'] == 'reject'
                                                ? Colors.red
                                                : Colors.blue,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              rh['type'] == 'approve'
                                                  ? 'Aprovado pelo RH'
                                                  : rh['type'] == 'reject'
                                                      ? 'Rejeitado pelo RH'
                                                      : 'Resposta do RH',
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12),
                                            ),
                                            if (rh['message'] != null &&
                                                rh['message']
                                                    .toString()
                                                    .isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                rh['message'],
                                                style: TextStyle(
                                                    color: Colors.grey[700],
                                                    fontSize: 13),
                                              ),
                                            ]
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ],

                          const SizedBox(height: 40),

                          // Botão de Chat
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: () {
                                Navigator.pop(context);
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => FormChatSheet(
                                    formId: formId,
                                    submissionId: submissionId,
                                  ),
                                );
                              },
                              icon: const Icon(Icons.chat),
                              label: const Text('Ver Mensagens e Responder'),
                              style: FilledButton.styleFrom(
                                padding: const EdgeInsets.all(18),
                                backgroundColor:
                                    Theme.of(context).colorScheme.primary,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _AnswerCard extends StatelessWidget {
  final Map<String, dynamic> field;
  final Map<String, dynamic>? answer;
  final String locale;

  const _AnswerCard({
    required this.field,
    this.answer,
    required this.locale,
  });

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
              .toList(),
        );
        break;
      case 'single_choice':
        valueWidget = Wrap(
          spacing: 6,
          runSpacing: 6,
          children: options
              .map((opt) => _OptionChip(label: opt, selected: opt == valueStr))
              .toList(),
        );
        break;
      case 'date':
        DateTime? d;
        if (valueStr.isNotEmpty) d = DateTime.tryParse(valueStr);
        valueWidget = Text(
            d != null
                ? '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}'
                : (valueStr.isEmpty ? '—' : valueStr),
            style: Theme.of(context).textTheme.bodyMedium);
        break;
      default:
        valueWidget = Text(valueStr.isEmpty ? '—' : valueStr,
            style: Theme.of(context).textTheme.bodyMedium);
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.transparent), // Ou border sutil
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
          ),
          const SizedBox(height: 8),
          valueWidget,
        ],
      ),
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: selected
            ? Theme.of(context).colorScheme.primary.withOpacity(0.1)
            : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
            color: selected
                ? Theme.of(context).colorScheme.primary
                : Colors.grey.shade300),
      ),
      child: Text(label,
          style: TextStyle(
            fontSize: 13,
            color: selected
                ? Theme.of(context).colorScheme.primary
                : Colors.grey.shade800,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          )),
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
          final att = attachments[index];
          final path = att['storagePath']?.toString() ?? 'arquivo';
          return Container(
            width: 80,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.attach_file, size: 24, color: Colors.grey),
                const SizedBox(height: 4),
                Text(
                  path.split('/').last,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
