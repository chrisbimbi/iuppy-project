import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/chat/chat_service.dart';

class ChatInfoPage extends ConsumerWidget {
  final String conversationId;
  final String title;

  const ChatInfoPage(
      {super.key, required this.conversationId, required this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // We reuse the list provider but filter by ID, or create a specific provider for details.
    // Simplifying: Fetch all then find. Better: API endpoint for single conv details including participants.
    // Assuming we have to find it in the list for now or fetch.
    final convAsync = ref.watch(chatConversationsProvider);
    final user = ref.watch(userProfileProvider).value;
    final api = ref.watch(apiClientProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Informações')),
      body: convAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Erro: $e')),
        data: (conversations) {
          final matches =
              conversations.where((c) => c['id'] == conversationId).toList();
          if (matches.isEmpty) {
            return const Center(child: Text('Conversa não encontrada'));
          }
          final conv = matches.first;

          final participants =
              (conv['participants'] as List).cast<Map<String, dynamic>>();
          final meList =
              participants.where((p) => p['user']['id'] == user?.id).toList();
          final Map<String, dynamic>? me =
              meList.isNotEmpty ? meList.first : null;
          final isAdmin = me?['role'] == 'ADMIN';

          return ListView(
            children: [
              ListTile(
                leading: const CircleAvatar(child: Icon(Icons.info_outline)),
                title: Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 18)),
                subtitle: Text('${participants.length} integrantes'),
              ),
              const Divider(),
              if (conv['type'] == 'GROUP') ...[
                Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Participantes',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, color: Colors.grey)),
                      if (isAdmin)
                        TextButton.icon(
                            icon: const Icon(Icons.add),
                            label: const Text('Adicionar'),
                            onPressed: () {
                              // TODO: Implement Add Participant Picker
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Em breve')));
                            })
                    ],
                  ),
                ),
                ...participants.map((p) {
                  final u = p['user'];
                  final isPheader = p['role'] == 'ADMIN';
                  final isMe = u['id'] == user?.id;

                  return ListTile(
                    leading: CircleAvatar(
                      backgroundImage: u['avatarUrl'] != null
                          ? NetworkImage(u['avatarUrl'])
                          : null,
                      child: u['avatarUrl'] == null
                          ? Text(u['name']?[0] ?? '?')
                          : null,
                    ),
                    title: Text(u['name'] ?? 'Sem nome'),
                    subtitle: Text(
                        isPheader ? 'Administrador' : (u['jobTitle'] ?? '')),
                    trailing: (isAdmin && !isMe)
                        ? PopupMenuButton(
                            onSelected: (action) async {
                              try {
                                if (action == 'promote') {
                                  await api.promoteParticipant(
                                      conversationId, u['id']);
                                } else if (action == 'remove') {
                                  await api.removeParticipant(
                                      conversationId, u['id']);
                                }
                                ref.refresh(chatConversationsProvider);
                              } catch (e) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Erro: $e')));
                              }
                            },
                            itemBuilder: (context) => [
                              if (!isPheader)
                                const PopupMenuItem(
                                    value: 'promote',
                                    child: Text('Promover a Admin')),
                              const PopupMenuItem(
                                  value: 'remove',
                                  child: Text('Remover do grupo')),
                            ],
                          )
                        : (isPheader
                            ? const Chip(
                                label: Text('Admin',
                                    style: TextStyle(fontSize: 10)))
                            : null),
                  );
                }),
                const Divider(),
              ],
              ListTile(
                leading: const Icon(Icons.delete_outline, color: Colors.red),
                title: const Text('Limpar histórico dessa conversa',
                    style: TextStyle(color: Colors.red)),
                onTap: () {
                  showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                              title: const Text('Limpar histórico?'),
                              content: const Text(
                                  'As mensagens serão apagadas apenas para você. Outros participantes continuarão vendo.'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    child: const Text('Cancelar')),
                                TextButton(
                                    child: const Text('Limpar',
                                        style: TextStyle(color: Colors.red)),
                                    onPressed: () async {
                                      Navigator.pop(ctx);
                                      try {
                                        await api
                                            .clearChatHistory(conversationId);
                                        Navigator.pop(
                                            context); // Close info page
                                      } catch (e) {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(SnackBar(
                                                content: Text('Erro: $e')));
                                      }
                                    })
                              ]));
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
