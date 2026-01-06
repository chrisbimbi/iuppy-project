import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:iuppy_app/features/vacations/providers/vacation_providers.dart';
import 'vacation_approval_modal.dart';

class VacationManagerPage extends ConsumerWidget {
  const VacationManagerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // For now, assume manager sees PENDING requests by default
    final requestsAsync = ref.watch(managerRequestsProvider('PENDING'));

    return Scaffold(
      appBar: AppBar(title: const Text('Gestão de Férias')),
      body: requestsAsync.when(
        data: (requests) {
          if (requests.isEmpty) {
            return const Center(child: Text('Nenhuma solicitação pendente.'));
          }
          return ListView.builder(
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              final user = req['user'] ?? {'name': 'Colaborador'};
              final start = DateTime.parse(req['startDate']);
              final end = DateTime.parse(req['endDate']);
              final days = end.difference(start).inDays + 1;

              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: CircleAvatar(child: Text(user['name'][0])),
                  title: Text(user['name']),
                  subtitle: Text('${DateFormat('dd/MM').format(start)} - ${DateFormat('dd/MM').format(end)} ($days dias)'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (_) => VacationApprovalModal(request: req),
                    );
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Erro: $e')),
      ),
    );
  }
}
