import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'providers/performance_providers.dart';

class PDIScreen extends ConsumerWidget {
  const PDIScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pdiAsync = ref.watch(myPDIProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('MEU PDI', 
            style: TextStyle(fontFamily: 'Space Mono', fontWeight: FontWeight.bold, letterSpacing: -0.5, color: Colors.black87)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: pdiAsync.when(
        data: (actions) {
            if (actions.isEmpty) return _EmptyPDIState();
            
            return ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: actions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                final action = actions[index];
                final status = action['status'] as String? ?? 'NOT_STARTED';
                final color = _getStatusColor(status);
                
                return Container(
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))
                        ],
                    ),
                    child: IntrinsicHeight(
                        child: Row(
                            children: [
                                Container(
                                    width: 6,
                                    decoration: BoxDecoration(
                                        color: color,
                                        borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16))
                                    ),
                                ),
                                Expanded(
                                    child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                                Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                        Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                            decoration: BoxDecoration(
                                                                color: color.withValues(alpha: 0.1),
                                                                borderRadius: BorderRadius.circular(6)
                                                            ),
                                                            child: Text(
                                                                _translateStatus(status),
                                                                style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11)
                                                            ),
                                                        ),
                                                        Icon(Icons.more_horiz, color: Colors.grey.shade400)
                                                    ],
                                                ),
                                                const SizedBox(height: 12),
                                                Text(
                                                    action['title'] as String,
                                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                                ),
                                                const SizedBox(height: 6),
                                                Row(
                                                    children: [
                                                        Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade500),
                                                        const SizedBox(width: 4),
                                                        Text(
                                                            'Prazo: ${_formatDate(action['deadline'])}',
                                                            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                                                        ),
                                                    ],
                                                )
                                            ],
                                        ),
                                    ),
                                )
                            ],
                        ),
                    ),
                );
                },
            );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, stack) => Center(child: Text('Erro ao carregar PDI: $err')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        backgroundColor: Colors.black,
        icon: const Icon(Icons.add_task),
        label: const Text('Nova Ação'),
      ),
    );
  }

  String _formatDate(String? isoDate) {
      if (isoDate == null) return '-';
      try {
          final dt = DateTime.parse(isoDate);
          return '${dt.day}/${dt.month}';
      } catch (e) {
          return isoDate;
      }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'IN_PROGRESS': return Colors.blue.shade600;
      case 'COMPLETED': return Colors.green.shade600; // Emerald-ish
      case 'NOT_STARTED': return Colors.grey.shade500;
      default: return Colors.amber.shade600;
    }
  }

  String _translateStatus(String status) {
    switch (status) {
      case 'IN_PROGRESS': return 'EM ANDAMENTO';
      case 'COMPLETED': return 'CONCLUÍDO';
      case 'NOT_STARTED': return 'A FAZER';
      default: return status;
    }
  }
}

class _EmptyPDIState extends StatelessWidget {
    @override
    Widget build(BuildContext context) {
        return Center(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    Icon(Icons.stairs_outlined, size: 80, color: Colors.grey.shade300),
                    const SizedBox(height: 24),
                    const Text('Sua carreira, seus degraus.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 8),
                    Text('Defina ações para alcançar seus objetivos.', style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
                ],
            ),
        );
    }
}
