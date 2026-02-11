import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:iuppy_app/features/forms/form_submit_page.dart';
import 'package:iuppy_app/features/forms/providers/forms_provider.dart';
import '../providers/nr1_providers.dart';
import 'nr1_risk_report_page.dart';

// Reusing the card design from FormsListPage (simplified here or we could extract it)
// For speed, I'll inline a similar card design but specialized for Reporting.

class Nr1ReportPage extends HookConsumerWidget {
  const Nr1ReportPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncForms = ref.watch(nr1FormsListProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('REPORTAR OCORRÊNCIA',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontFamily: 'Space Mono',
                letterSpacing: -0.5)),
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black87,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
      ),
      body: asyncForms.when(
        data: (allForms) {
          // Filter only specific report templates
          final forms = allForms.where((f) {
            final t = f['template'] as String?;
            return t == 'nr1_near_miss' ||
                t == 'nr1_science' ||
                t == 'nr1_risk_reporting';
          }).toList();

          if (forms.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.assignment_turned_in_outlined,
                        size: 64, color: Colors.grey.shade300),
                    const SizedBox(height: 16),
                    Text('Nenhum formulário de reporte disponível.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.grey.shade500,
                            fontSize: 16,
                            fontFamily: 'Space Mono')),
                    const SizedBox(height: 12),
                    Text(
                        'Entre em contato com o RH se precisar relatar algo urgente.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.grey.shade400,
                            fontSize: 14,
                            fontFamily: 'Space Mono')),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            color: Colors.black,
            onRefresh: () async {
              ref.read(formsRefreshProvider.notifier).state++;
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: forms.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (_, i) {
                final f = forms[i];
                final id = f['id']?.toString();

                return _ReportCard(
                  form: f,
                  onTap: () {
                    if (id == null) return;

                    final t = f['template'] as String?;
                    if (t == 'nr1_risk_reporting') {
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => Nr1RiskReportPage(form: f)));
                    } else {
                      Navigator.of(context).push(MaterialPageRoute(
                          builder: (_) => FormSubmitPage(formId: id)));
                    }
                  },
                );
              },
            ),
          );
        },
        loading: () =>
            const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (e, _) => Center(child: Text('Erro: $e')),
      ),
    );
  }
}

class _ReportCard extends StatelessWidget {
  final Map<String, dynamic> form;
  final VoidCallback onTap;

  const _ReportCard({required this.form, required this.onTap});

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

  @override
  Widget build(BuildContext context) {
    final title = _readTranslatable(form['title']);
    final description = _readTranslatable(form['description']);
    final template = form['template'] as String?;

    IconData icon = Icons.assignment_outlined;
    Color color = Colors.blueGrey;

    if (template == 'nr1_near_miss') {
      icon = Icons.warning_amber_rounded;
      color = Colors.amber.shade800;
    } else if (template == 'nr1_perception') {
      icon = Icons.visibility_outlined;
      color = Colors.blue.shade700;
    } else if (template == 'nr1_science') {
      icon = Icons.shield_outlined;
      color = Colors.red.shade700;
    } else if (template == 'nr1_risk_reporting') {
      icon = Icons.bolt_outlined;
      color = Colors.purple.shade700;
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    if (description.isNotEmpty)
                      Text(description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Colors.grey.shade600, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
