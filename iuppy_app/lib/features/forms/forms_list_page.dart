import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:badges/badges.dart' as badges;
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import 'form_submit_page.dart';
import 'my_form_responses_page.dart';
import 'providers/forms_provider.dart';
import 'widgets/form_chat_sheet.dart';
import 'widgets/submission_detail_sheet.dart';

// Helper de tradução
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

class FormsListPage extends HookConsumerWidget {
  final int initialTab;
  final String? openFormId;
  final String? openSubmissionId;
  final String? openAction; // 'chat' ou 'details'

  const FormsListPage({
    super.key,
    this.initialTab = 0,
    this.openFormId,
    this.openSubmissionId,
    this.openAction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncForms = ref.watch(formsListProvider);

    // Badges
    final newFormsAsync = ref.watch(newFormsCountProvider);
    final int newFormsCount =
        newFormsAsync.maybeWhen(data: (v) => v, orElse: () => 0);

    final unreadCountAsync = ref.watch(userFormsUnreadCountProvider);
    final int unreadRepliesCount =
        unreadCountAsync.maybeWhen(data: (v) => v, orElse: () => 0);

    final tabController =
        useTabController(initialLength: 2, initialIndex: initialTab);

    // Efeito para Deep Link
    useEffect(() {
      if (openFormId != null && openSubmissionId != null) {
        Future.microtask(() {
          if (tabController.index != 1) tabController.animateTo(1);

          // Decide qual sheet abrir baseado na action
          if (openAction == 'details') {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => SubmissionDetailSheet(
                  formId: openFormId!, submissionId: openSubmissionId!),
            );
          } else {
            // Default: Chat
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (_) => FormChatSheet(
                  formId: openFormId!, submissionId: openSubmissionId!),
            );
          }
        });
      }
      return null;
    }, [openFormId, openSubmissionId, openAction]);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('FORMULÁRIOS',
            style: TextStyle(
                fontWeight: FontWeight.bold,
                fontFamily: 'Space Mono',
                letterSpacing: -0.5)),
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black87,
        flexibleSpace: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                border: Border(
                  bottom: BorderSide(color: Colors.grey.shade200),
                ),
              ),
            ),
          ),
        ),
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
        bottom: TabBar(
          controller: tabController,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.black,
          indicatorWeight: 3,
          labelStyle: const TextStyle(
              fontFamily: 'Space Mono', fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Space Mono'),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('DISPONÍVEIS'),
                  if (newFormsCount > 0) ...[
                    const SizedBox(width: 8),
                    badges.Badge(
                      badgeContent: Text('$newFormsCount',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 10)),
                      badgeStyle:
                          const badges.BadgeStyle(badgeColor: Colors.red),
                    )
                  ]
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('MINHAS RESPOSTAS'),
                  if (unreadRepliesCount > 0) ...[
                    const SizedBox(width: 8),
                    badges.Badge(
                      badgeContent: Text('$unreadRepliesCount',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 10)),
                      badgeStyle:
                          const badges.BadgeStyle(badgeColor: Colors.red),
                    )
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: tabController,
        children: [
          // Aba 1 - Disponíveis (Card Rico)
          asyncForms.when(
            data: (forms) {
              if (forms.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.assignment_outlined,
                          size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text('Nenhum formulário disponível.',
                          style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 16,
                              fontFamily: 'Space Mono')),
                    ],
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

                    return _AvailableFormCard(
                      form: f,
                      onTap: () {
                        if (id == null) return;
                        // Marca como visto e navega
                        ref.read(localFormStoreProvider).markAsSeen(id);
                        ref.read(formsSeenVersionProvider.notifier).state++;

                        Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => FormSubmitPage(formId: id)));
                      },
                    );
                  },
                ),
              );
            },
            loading: () => const Center(
                child: CircularProgressIndicator(
              color: Colors.black,
            )),
            error: (e, _) => Center(child: Text('Erro: $e')),
          ),

          // Aba 2 - Minhas respostas
          const MyFormResponsesPage(),
        ],
      ),
    );
  }
}

// 🔥 CARD ESTILIZADO (Design System)
class _AvailableFormCard extends StatelessWidget {
  final Map<String, dynamic> form;
  final VoidCallback onTap;

  const _AvailableFormCard({required this.form, required this.onTap});

  String _formatDate(String? iso) {
    if (iso == null) return '';
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    // Dados do Formulário
    final title = _readTranslatable(form['title']);
    final description = _readTranslatable(form['description']);
    final deadline = form['deadlineAt']?.toString();

    // Flags de características
    final hasDeadline = deadline != null && deadline.isNotEmpty;
    final requiresApproval = form['requiresApproval'] == true;
    final hasAttachments = (form['attachmentsAllowed'] == true) ||
        (form['allowAttachments'] == true);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cabeçalho: Ícone + Textos
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Ícone colorido
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: const Icon(
                        Icons.assignment_rounded,
                        color: Colors.black87,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Título e Descrição
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title.isEmpty ? 'Formulário' : title,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.black87,
                              height: 1.2,
                              fontFamily: 'Space Mono',
                              letterSpacing: -0.5,
                            ),
                          ),
                          if (description.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text(
                              description,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis, // Reticências
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),

                // Rodapé: Tags de Características (se houver)
                if (hasDeadline || requiresApproval || hasAttachments) ...[
                  const SizedBox(height: 16),
                  const Divider(height: 1, color: Color(0xFFEEEEEE)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      // Tag: Prazo
                      if (hasDeadline)
                        _FeatureTag(
                          icon: Icons.timer_outlined,
                          text: 'Até ${_formatDate(deadline)}',
                          color: Colors.orange.shade800,
                          bgColor: Colors.orange.shade50,
                        ),

                      // Tag: Aprovação
                      if (requiresApproval)
                        _FeatureTag(
                          icon: Icons.verified_user_outlined,
                          text: 'Requer Aprovação',
                          color: Colors.indigo.shade700,
                          bgColor: Colors.indigo.shade50,
                        ),

                      // Tag: Anexos
                      if (hasAttachments)
                        _FeatureTag(
                          icon: Icons.attach_file,
                          text: 'Anexos',
                          color: Colors.blueGrey.shade700,
                          bgColor: Colors.blueGrey.shade50,
                        ),
                    ],
                  )
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Widget auxiliar para os "Chips" de características
class _FeatureTag extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  final Color bgColor;

  const _FeatureTag({
    required this.icon,
    required this.text,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
              fontFamily: 'Space Mono',
            ),
          ),
        ],
      ),
    );
  }
}
