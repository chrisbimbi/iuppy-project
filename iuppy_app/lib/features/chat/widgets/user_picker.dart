import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/menu/team_page.dart'; // Reuse teamListProvider

class UserPickerDialog extends ConsumerStatefulWidget {
  final List<String> excludeUserIds;
  final bool multiple;

  const UserPickerDialog({
    super.key,
    this.excludeUserIds = const [],
    this.multiple = false,
  });

  @override
  ConsumerState<UserPickerDialog> createState() => _UserPickerDialogState();
}

class _UserPickerDialogState extends ConsumerState<UserPickerDialog> {
  final _searchCtrl = TextEditingController();
  String _query = '';
  final Set<String> _selectedIds = {};

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(teamListProvider(_query));

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(16),
        height: 600,
        child: Column(
          children: [
            Text(
              widget.multiple ? 'Selecionar Usuários' : 'Selecionar Usuário',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Buscar...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey.shade100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: usersAsync.when(
                data: (users) {
                  final filtered = users.where((u) {
                    final id = u['id'];
                    return !widget.excludeUserIds.contains(id);
                  }).toList();

                  if (filtered.isEmpty) {
                    return const Center(
                        child: Text('Nenhum usuário encontrado'));
                  }

                  return ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final u = filtered[index];
                      final id = u['id'];
                      final isSelected = _selectedIds.contains(id);

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
                        subtitle: Text(u['jobTitle'] ?? u['role'] ?? ''),
                        trailing: widget.multiple
                            ? Checkbox(
                                value: isSelected,
                                onChanged: (v) {
                                  setState(() {
                                    if (v == true) {
                                      _selectedIds.add(id);
                                    } else {
                                      _selectedIds.remove(id);
                                    }
                                  });
                                },
                              )
                            : null,
                        onTap: () {
                          if (widget.multiple) {
                            setState(() {
                              if (isSelected) {
                                _selectedIds.remove(id);
                              } else {
                                _selectedIds.add(id);
                              }
                            });
                          } else {
                            Navigator.pop(context, u);
                          }
                        },
                      );
                    },
                  );
                },
                error: (e, s) => Center(child: Text('Erro: $e')),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
            ),
            if (widget.multiple) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _selectedIds.isEmpty
                    ? null
                    : () {
                        // Return list of selected user objects or IDs
                        // For simplicity, let's return just IDs or filtered users
                        // Optimization: keep list of selected user objects if needed
                        Navigator.pop(context, _selectedIds.toList());
                      },
                child: Text('Adicionar (${_selectedIds.length})'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
