// lib/features/forms/forms_list_page.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'form_submit_page.dart';
import 'my_form_responses_page.dart';
import 'providers/forms_provider.dart';

class FormsListPage extends ConsumerWidget {
  const FormsListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncForms = ref.watch(formsListProvider);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Formulários'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Disponíveis'),
              Tab(text: 'Minhas respostas'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // aba 1 - disponíveis
            asyncForms.when(
              data: (forms) => RefreshIndicator(
                onRefresh: () async {
                  ref.read(formsRefreshProvider.notifier).state++;
                },
                child: ListView.builder(
                  itemCount: forms.length,
                  itemBuilder: (_, i) {
                    final f = forms[i];
                    return ListTile(
                      leading: const Icon(Icons.description),
                      title: Text(f['title'] ?? ''),
                      subtitle: Text(f['description'] ?? ''),
                      trailing: f['deadlineAt'] != null
                          ? Text(
                              (DateTime.tryParse(f['deadlineAt']) ??
                                      DateTime.now())
                                  .toLocal()
                                  .toString(),
                              style: const TextStyle(fontSize: 11),
                            )
                          : null,
                      onTap: () {
                        final id = f['id']?.toString();
                        if (id == null) return;
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => FormSubmitPage(formId: id),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
              loading: () =>
                  const Center(child: CircularProgressIndicator.adaptive()),
              error: (e, _) => Center(child: Text('Erro: $e')),
            ),

            // aba 2 - minhas respostas
            const MyFormResponsesPage(),
          ],
        ),
      ),
    );
  }
}
