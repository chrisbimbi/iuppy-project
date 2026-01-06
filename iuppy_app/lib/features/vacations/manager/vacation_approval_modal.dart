import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:iuppy_app/features/vacations/providers/vacation_providers.dart';
import 'package:go_router/go_router.dart';

class VacationApprovalModal extends ConsumerStatefulWidget {
  final Map<String, dynamic> request;

  const VacationApprovalModal({super.key, required this.request});

  @override
  ConsumerState<VacationApprovalModal> createState() => _VacationApprovalModalState();
}

class _VacationApprovalModalState extends ConsumerState<VacationApprovalModal> {
  final _reasonController = TextEditingController();
  bool _isRejecting = false;

  Future<void> _process(bool approve) async {
    if (!approve && _reasonController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Justificativa obrigatória')));
      return;
    }

    try {
      showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
      
      final repo = ref.read(vacationRepositoryProvider);
      
      if (approve) {
        await repo.approveRequest(widget.request['id']);
      } else {
        await repo.rejectRequest(widget.request['id'], _reasonController.text);
      }

      if (!mounted) return;
      Navigator.pop(context); // Close loading
      Navigator.pop(context); // Close modal
      
      ref.invalidate(managerRequestsProvider(null)); // Refresh list
      
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(approve ? 'Aprovado com sucesso' : 'Reprovado com sucesso'),
        backgroundColor: approve ? Colors.green : Colors.red,
      ));
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading
       ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final req = widget.request;
    final start = DateTime.parse(req['startDate']);
    final end = DateTime.parse(req['endDate']);
    
    return Dialog(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Aprovar Férias', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 16),
            Text('Colaborador: ${req['user']?['name'] ?? 'N/A'}'),
            Text('Período: ${DateFormat('dd/MM/yyyy').format(start)} a ${DateFormat('dd/MM/yyyy').format(end)}'),
            Text('Dias Vendidos: ${req['soldDays'] ?? 0}'),
            
            if (_isRejecting) ...[
              const SizedBox(height: 16),
              TextField(
                controller: _reasonController,
                decoration: const InputDecoration(labelText: 'Motivo da Reprovação', border: OutlineInputBorder()),
                maxLines: 3,
              ),
            ],

            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Cancelar'),
                ),
                const SizedBox(width: 8),
                if (!_isRejecting)
                  TextButton(
                    onPressed: () => setState(() => _isRejecting = true),
                    child: const Text('Reprovar', style: TextStyle(color: Colors.red)),
                  ),
                if (_isRejecting)
                   ElevatedButton(
                    onPressed: () => _process(false),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: const Text('Confirmar Reprovação', style: TextStyle(color: Colors.white)),
                  ),
                if (!_isRejecting)
                  ElevatedButton(
                    onPressed: () => _process(true),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    child: const Text('Aprovar', style: TextStyle(color: Colors.white)),
                  ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
