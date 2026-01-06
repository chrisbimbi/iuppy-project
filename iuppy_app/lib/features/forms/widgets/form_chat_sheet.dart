// lib/features/forms/widgets/form_chat_sheet.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/forms/models/form_models.dart';
import 'package:iuppy_app/features/forms/providers/forms_provider.dart';

// Helper de formatação de data para o chat
String formatChatTime(DateTime dt) {
  final now = DateTime.now();
  final isToday =
      dt.day == now.day && dt.month == now.month && dt.year == now.year;

  final time = '${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  if (isToday) return 'Hoje, $time';

  return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}, $time';
}

class FormChatSheet extends ConsumerStatefulWidget {
  final String formId;
  final String submissionId;
  const FormChatSheet({
    super.key,
    required this.formId,
    required this.submissionId,
  });

  @override
  ConsumerState<FormChatSheet> createState() => _FormChatSheetState();
}

class _FormChatSheetState extends ConsumerState<FormChatSheet> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final message = _textController.text.trim();
    if (message.isEmpty) return;

    _textController.clear();

    // Otimistamente, rola para baixo
    _scrollToBottom();

    await ref.read(postFormChatMessageProvider.notifier).send(
          formId: widget.formId,
          submissionId: widget.submissionId,
          message: message,
        );

    // Escuta por erro
    if (mounted) {
      final state = ref.read(postFormChatMessageProvider);
      if (state is AsyncError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar: ${state.error}')),
        );
        _textController.text = message; // Devolve o texto
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider =
        formChatHistoryProvider((widget.formId, widget.submissionId));
    final historyAsync = ref.watch(provider);
    final postState = ref.watch(postFormChatMessageProvider);

    final bool isSending = postState is AsyncLoading;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Material(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: Column(
            children: [
              // Handle
              Center(
                child: Container(
                  width: 50,
                  height: 5,
                  margin: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              // Conteúdo do Chat
              Expanded(
                child: historyAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) =>
                      Center(child: Text('Erro ao carregar chat: $e')),
                  data: (data) {
                    final history = FormChatHistory.fromJson(data);
                    final messages = history.messages;
                    final isChatClosed = history.chatStatus == 'closed';

                    // Rola para o final após o build
                    _scrollToBottom();

                    return Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: messages.length,
                            itemBuilder: (context, index) {
                              final msg = messages[index];
                              final isMe = msg.actor == 'user';
                              return _ChatMessageBubble(
                                message: msg,
                                isMe: isMe,
                              );
                            },
                          ),
                        ),
                        _ChatInputArea(
                          controller: _textController,
                          isSending: isSending,
                          isChatClosed: isChatClosed,
                          onSend: _sendMessage,
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// Widget da Bolha de Chat
class _ChatMessageBubble extends StatelessWidget {
  final FormChatMessage message;
  final bool isMe;
  const _ChatMessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final align = isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = isMe
        ? theme.colorScheme.primaryContainer
        : theme.colorScheme.surfaceContainerHighest;
    final textColor = isMe
        ? theme.colorScheme.onPrimaryContainer
        : theme.colorScheme.onSurfaceVariant;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        crossAxisAlignment: align,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMe ? 18 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 18),
              ),
            ),
            child: Text(
              message.message,
              style: theme.textTheme.bodyMedium?.copyWith(color: textColor),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            formatChatTime(message.createdAt),
            style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }
}

// Widget da Área de Input
class _ChatInputArea extends StatelessWidget {
  final TextEditingController controller;
  final bool isSending;
  final bool isChatClosed;
  final VoidCallback onSend;

  const _ChatInputArea({
    required this.controller,
    required this.isSending,
    required this.isChatClosed,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    if (isChatClosed) {
      return Container(
        padding: const EdgeInsets.all(16),
        width: double.infinity,
        color: Theme.of(context)
            .colorScheme
            .surfaceContainerHighest
            .withOpacity(0.5),
        child: Text(
          'Esta conversa foi encerrada pelo RH.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      );
    }

    return Material(
      color: Theme.of(context).colorScheme.surface,
      elevation: 8,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
            16, 12, 16, 12 + MediaQuery.of(context).padding.bottom),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                enabled: !isSending,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  hintText: 'Digite sua mensagem...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onSubmitted: (_) => onSend(),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              icon: isSending
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send),
              onPressed: isSending ? null : onSend,
              style: IconButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Theme.of(context).colorScheme.onPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
