import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';

class FormsListPage extends ConsumerStatefulWidget {
  const FormsListPage({super.key});

  @override
  ConsumerState<FormsListPage> createState() => _FormsListPageState();
}

class _FormsListPageState extends ConsumerState<FormsListPage> {
  bool loading = true;
  List<Map<String, dynamic>> items = const [];

  @override
  void initState() {
    super.initState();

    // carrega uma vez ao montar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _load();
    });
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final list = await api.getForms();
      if (!mounted) return;
      setState(() => items = List<Map<String, dynamic>>.from(list));
    } finally {
      if (mounted) {
        setState(() => loading = false);
      }
    }
  }

  Future<void> _pull() => _load();

  @override
  Widget build(BuildContext context) {
    // 👇 aqui pode usar ref.listen normalmente
    ref.listen<int>(feedVersionProvider, (prev, next) {
      if (!mounted) return;
      _load();
    });

    final body = loading
        ? const Center(child: CircularProgressIndicator())
        : items.isEmpty
            ? ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 160),
                  Center(child: Text('Nenhum formulário disponível')),
                ],
              )
            : ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (ctx, i) {
                  final f = items[i];
                  final title = (f['title'] ?? '').toString();
                  final status = (f['status'] ?? 'draft').toString();
                  final deadline = f['deadlineAt']?.toString();
                  final questions =
                      (f['questionsCount'] ?? f['fields']?.length ?? 0)
                          .toString();
                  final submissions = (f['submissionsCount'] ?? 0).toString();

                  DateTime? deadlineDt;
                  if (deadline != null && deadline.isNotEmpty) {
                    final parsed = DateTime.tryParse(deadline);
                    if (parsed != null) {
                      deadlineDt = parsed.toLocal();
                    }
                  }

                  return ListTile(
                    title:
                        Text(title.isEmpty ? 'Formulário sem título' : title),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          status == 'published' ? 'Publicado' : 'Rascunho',
                          style: TextStyle(
                            color: status == 'published'
                                ? Colors.green.shade700
                                : Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.help_outline, size: 14),
                            const SizedBox(width: 4),
                            Text('$questions perguntas'),
                            const SizedBox(width: 12),
                            const Icon(Icons.inbox_outlined, size: 14),
                            const SizedBox(width: 4),
                            Text('$submissions envios'),
                          ],
                        ),
                        if (deadlineDt != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.schedule, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                '${deadlineDt.day.toString().padLeft(2, '0')}/'
                                '${deadlineDt.month.toString().padLeft(2, '0')}/'
                                '${deadlineDt.year} '
                                '${deadlineDt.hour.toString().padLeft(2, '0')}:'
                                '${deadlineDt.minute.toString().padLeft(2, '0')}',
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/forms/${f['id']}'),
                  );
                },
              );

    return Scaffold(
      appBar: AppBar(title: const Text('Formulários')),
      body: RefreshIndicator(
        onRefresh: _pull,
        child: body,
      ),
    );
  }
}
