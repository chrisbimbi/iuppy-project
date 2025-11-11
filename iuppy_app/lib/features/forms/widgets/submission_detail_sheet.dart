// lib/features/forms/widgets/submission_detail_sheet.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../providers/forms_provider.dart';

// helpers
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
        color: const Color(0xfff6f4f7),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        child: asyncDetail.when(
          loading: () => const SizedBox(
            height: 200,
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (e, _) => SizedBox(
            height: 200,
            child: Center(child: Text('Erro ao carregar: $e')),
          ),
          data: (detail) {
            return asyncForm.when(
              loading: () => const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => SizedBox(
                height: 200,
                child: Center(child: Text('Erro ao carregar formulário: $e')),
              ),
              data: (form) {
                final submittedAtStr = detail['submittedAt']?.toString() ?? '';
                final submittedAt = DateTime.tryParse(submittedAtStr);
                final formTitle = detail['formTitle']?.toString() ??
                    form['title']?.toString() ??
                    'Formulário';
                final rawStatus = detail['status']?.toString() ?? '';

                final answers = (detail['answers'] as List? ?? const [])
                    .cast<Map<String, dynamic>>();
                final attachments = (detail['attachments'] as List? ?? const [])
                    .cast<Map<String, dynamic>>();
                final rhActions = (detail['rhActions'] as List? ?? const [])
                    .cast<Map<String, dynamic>>();
                final fields = (form['fields'] as List? ?? const [])
                    .cast<Map<String, dynamic>>();

                final Map<String, Map<String, dynamic>> answersByField = {};
                for (final ans in answers) {
                  final fid = ans['fieldId']?.toString();
                  if (fid != null) {
                    answersByField[fid] = ans;
                  }
                }

                final requiresApproval = form['requiresApproval'] == true;
                final allowAttachments = form['attachmentsAllowed'] == true;

                return DraggableScrollableSheet(
                  expand: false,
                  initialChildSize: 0.7,
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
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                          ),
                          Text(
                            formTitle,
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                  color: Colors.orange[800],
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          if (submittedAt != null)
                            Text(
                              'Enviado em ${formatHuman(submittedAt)}',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(color: Colors.orange[800]),
                            ),
                          const SizedBox(height: 14),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              Chip(
                                label: const Text('Formulário enviado'),
                                backgroundColor: Colors.white,
                              ),
                              if (requiresApproval &&
                                  _isApprovalStatus(rawStatus))
                                Chip(
                                  label: Text(mapApprovalStatus(rawStatus)),
                                  backgroundColor:
                                      approvalColor(rawStatus, context),
                                ),
                              if (attachments.isNotEmpty)
                                Chip(
                                  label: Text(
                                    '${attachments.length} anexo${attachments.length > 1 ? 's' : ''}',
                                  ),
                                  backgroundColor: Colors.white,
                                ),
                              if (rhActions.isNotEmpty)
                                const Chip(
                                  label: Text('Com resposta do RH'),
                                ),
                            ],
                          ),
                          const SizedBox(height: 22),
                          Text(
                            'Respostas',
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: Colors.orange[800],
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                          const SizedBox(height: 12),
                          if (fields.isEmpty && answers.isEmpty)
                            Text(
                              'Sem respostas salvas',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(color: Colors.grey[600]),
                            )
                          else
                            Column(
                              children: [
                                for (int i = 0; i < fields.length; i++)
                                  _AnswerCard(
                                    field: fields[i],
                                    answer: () {
                                      final fid = fields[i]['id']?.toString();
                                      if (fid != null &&
                                          answersByField.containsKey(fid)) {
                                        return answersByField[fid];
                                      }
                                      if (i < answers.length) {
                                        return answers[i];
                                      }
                                      return null;
                                    }(),
                                  ),
                              ],
                            ),

                          // miniaturas de anexos (se o form permite e existe)
                          if (allowAttachments && attachments.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            Text(
                              'Anexos',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: Colors.orange[800],
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 10),
                            _AttachmentStrip(
                              attachments: attachments,
                              onTap: (att) {
                                _openAttachment(context, att);
                              },
                            ),
                          ],

                          if (rhActions.isNotEmpty) ...[
                            const SizedBox(height: 20),
                            Text(
                              'Interações do RH',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    color: Colors.orange[800],
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const SizedBox(height: 10),
                            Column(
                              children: rhActions.map((rh) {
                                final type = rh['type']?.toString() ?? 'reply';
                                final msg = rh['message']?.toString() ?? '';
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.blueGrey.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Icon(
                                        type == 'approve'
                                            ? Icons.check_circle
                                            : type == 'reject'
                                                ? Icons.cancel_outlined
                                                : Icons.chat_bubble,
                                        size: 20,
                                        color: Colors.blueGrey,
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          msg.isEmpty ? '(sem mensagem)' : msg,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                          const SizedBox(height: 30),
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

  void _openAttachment(BuildContext context, Map<String, dynamic> att) {
    // aqui você coloca o que o app já usa pra abrir imagem/pdf
    // por enquanto só loga:
    debugPrint('abrir anexo: $att');
  }
}

class _AnswerCard extends StatelessWidget {
  final Map<String, dynamic> field;
  final Map<String, dynamic>? answer;

  const _AnswerCard({
    required this.field,
    this.answer,
  });

  @override
  Widget build(BuildContext context) {
    final label = field['label']?.toString() ?? 'Pergunta';
    final rawType =
        (answer?['type'] ?? field['type'] ?? 'short_text').toString();
    final valueStr = answer?['value']?.toString() ?? '';
    final options = (field['options'] as List? ?? const [])
        .map((e) => e.toString())
        .toList();

    Widget valueWidget;

    // ----- mapeamento dos tipos do backend -----
    switch (rawType) {
      case 'short_text':
      case 'long_text':
        valueWidget = Text(
          valueStr.isEmpty ? '—' : valueStr,
          style: Theme.of(context).textTheme.bodyMedium,
        );
        break;
      case 'number':
        valueWidget = Text(
          valueStr.isEmpty ? '—' : valueStr,
          style: Theme.of(context).textTheme.bodyMedium,
        );
        break;
      case 'date':
        DateTime? d;
        if (valueStr.isNotEmpty) {
          d = DateTime.tryParse(valueStr);
        }
        final txt = d != null
            ? '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}'
            : (valueStr.isEmpty ? '—' : valueStr);
        valueWidget = Text(
          txt,
          style: Theme.of(context).textTheme.bodyMedium,
        );
        break;
      case 'multi_choice':
        // pode vir "a,b,c" ou lista
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
          children: options.map((opt) {
            final sel = selected.contains(opt);
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color:
                    sel ? Colors.orange[700]!.withOpacity(0.12) : Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: sel ? Colors.orange[700]! : Colors.grey.shade300,
                ),
              ),
              child: Text(
                opt,
                style: TextStyle(
                  color: sel ? Colors.orange[700] : Colors.grey.shade800,
                ),
              ),
            );
          }).toList(),
        );
        break;
      case 'single_choice':
        // basicamente o que já tínhamos
        valueWidget = Wrap(
          spacing: 6,
          runSpacing: 6,
          children: options.map((opt) {
            final sel = opt == valueStr;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color:
                    sel ? Colors.orange[700]!.withOpacity(0.12) : Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: sel ? Colors.orange[700]! : Colors.grey.shade300,
                ),
              ),
              child: Text(
                opt,
                style: TextStyle(
                  color: sel ? Colors.orange[700] : Colors.grey.shade800,
                ),
              ),
            );
          }).toList(),
        );
        break;
      case 'stars':
        final rating = int.tryParse(valueStr) ?? 0;
        valueWidget = Row(
          children: List.generate(5, (i) {
            return Icon(
              i < rating ? Icons.star : Icons.star_border,
              color: Colors.orange[700],
              size: 20,
            );
          }),
        );
        break;
      case 'scale':
        final selected = int.tryParse(valueStr) ?? 0;
        final max = (field['max'] is int) ? field['max'] as int : 10;
        valueWidget = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$selected / $max'),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 5,
                backgroundColor: Colors.grey.shade300,
                value: max > 0 ? selected / max : 0,
                color: Colors.orange[700],
              ),
            ),
          ],
        );
        break;
      default:
        valueWidget = Text(
          valueStr.isEmpty ? '—' : valueStr,
          style: Theme.of(context).textTheme.bodyMedium,
        );
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Colors.orange[700],
                ),
          ),
          const SizedBox(height: 8),
          valueWidget,
        ],
      ),
    );
  }
}

class _AttachmentStrip extends StatelessWidget {
  final List<Map<String, dynamic>> attachments;
  final void Function(Map<String, dynamic>) onTap;

  const _AttachmentStrip({
    required this.attachments,
    required this.onTap,
  });

  bool _isImage(Map<String, dynamic> att) {
    final mime = att['mimeType']?.toString().toLowerCase() ?? '';
    return mime.startsWith('image/');
  }

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
          final fileName = path.split('/').last;
          final isImg = _isImage(att);

          return InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => onTap(att),
            child: Container(
              width: 78,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: isImg
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      // aqui depende de como vc monta a URL da imagem
                      child: Image.network(
                        path,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            _FileThumbFallback(name: fileName),
                      ),
                    )
                  : _FileThumbFallback(name: fileName),
            ),
          );
        },
      ),
    );
  }
}

class _FileThumbFallback extends StatelessWidget {
  final String name;
  const _FileThumbFallback({required this.name});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(6.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.insert_drive_file, size: 26, color: Colors.orange),
            const SizedBox(height: 4),
            Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10),
            ),
          ],
        ),
      ),
    );
  }
}
