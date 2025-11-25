// lib/features/forms/form_submission_deep_link_page.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'widgets/submission_detail_sheet.dart';
import 'widgets/form_chat_sheet.dart';

// 🔥 TELA COMPLETA PARA DEEP LINK
class FormSubmissionDeepLinkPage extends ConsumerStatefulWidget {
  final String formId;
  final String submissionId;

  const FormSubmissionDeepLinkPage({
    super.key,
    required this.formId,
    required this.submissionId,
  });

  @override
  ConsumerState<FormSubmissionDeepLinkPage> createState() => _PageState();
}

class _PageState extends ConsumerState<FormSubmissionDeepLinkPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    // 2 Abas: Resposta (Detalhes) e Chat
    _tabController = TabController(length: 2, vsync: this);
    // Se quiser abrir direto no chat (ex: via push de chat), pode verificar params aqui
    // _tabController.index = 1;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalhes do Envio'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Respostas'),
            Tab(text: 'Chat'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Aba 1: Reusa o Sheet existente, mas embedado
          // Precisamos adaptar o Sheet para não ser um Modal?
          // O SubmissionDetailSheet espera ser um modal draggable.
          // Para reuso rápido, podemos envolvê-lo em um Container simples:
          _DetailsWrapper(
              formId: widget.formId, submissionId: widget.submissionId),

          // Aba 2: Chat
          // O FormChatSheet também é um Draggable. Vamos usar o conteúdo dele.
          // Melhor: Criar um wrapper que instancia o conteúdo do chat.
          _ChatWrapper(
              formId: widget.formId, submissionId: widget.submissionId),
        ],
      ),
    );
  }
}

// Wrappers simples para adaptar os Sheets (que são DraggableScrollableSheet)
// para funcionarem dentro de uma TabView fixa.
class _DetailsWrapper extends StatelessWidget {
  final String formId;
  final String submissionId;
  const _DetailsWrapper({required this.formId, required this.submissionId});

  @override
  Widget build(BuildContext context) {
    // Como o SubmissionDetailSheet original é um DraggableScrollableSheet,
    // ele precisa de um contexto de scroll pai ou ser usado direto.
    // Aqui, instanciamos ele como widget normal. Se ele retornar DraggableScrollableSheet,
    // o Flutter lida bem dentro de Scaffold se configurado.
    // Mas para garantir layout, vamos usar SubmissionDetailSheet diretamente.
    return SubmissionDetailSheet(formId: formId, submissionId: submissionId);
  }
}

class _ChatWrapper extends StatelessWidget {
  final String formId;
  final String submissionId;
  const _ChatWrapper({required this.formId, required this.submissionId});

  @override
  Widget build(BuildContext context) {
    return FormChatSheet(formId: formId, submissionId: submissionId);
  }
}
