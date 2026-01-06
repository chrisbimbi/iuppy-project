import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:iuppy_app/features/vacations/providers/vacation_providers.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/core/widgets/skeleton.dart';
import 'package:intl/intl.dart';

class VacationsPage extends ConsumerWidget {
  const VacationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(userProfileProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('MINHAS FÉRIAS',
            style: TextStyle(
                fontFamily: 'Space Mono',
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
                color: Colors.black87)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.black87),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Configurações (Admin)',
            onPressed: () => context.push('/vacations/admin'),
          ),
          IconButton(
            icon: const Icon(Icons.approval_outlined),
            tooltip: 'Aprovações (Gestor)',
            onPressed: () => context.push('/vacations/manager'),
          ),
        ],
      ),
      body: userAsync.when(
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: 3,
          separatorBuilder: (_, __) => const SizedBox(height: 16),
          itemBuilder: (_, __) => const Skeleton(height: 150),
        ),
        error: (e, s) => Center(child: Text('Erro ao carregar perfil: $e')),
        data: (user) {
          if (user == null || user.id == null) {
            return const Center(child: Text('Usuário inválido'));
          }
          final userId = user.id!;
          final balanceAsync = ref.watch(vacationBalanceProvider(userId));

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              balanceAsync.when(
                data: (balance) {
                  final total = balance['balanceTotal'] ?? 0;
                  final vested = balance['daysVested'] ?? 0;
                  return _BalanceCard(total: total, vested: vested);
                },
                loading: () => const Skeleton(height: 200),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => context.push('/vacations/request'),
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('NOVA SOLICITAÇÃO',
                    style: TextStyle(
                        fontFamily: 'Space Mono', fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 4,
                    shadowColor: Colors.black26),
              ),
              const SizedBox(height: 32),
              const Text('HISTÓRICO',
                  style: TextStyle(
                      fontFamily: 'Space Mono',
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Colors.grey)),
              const SizedBox(height: 16),
              ref.watch(vacationRequestsProvider(userId)).when(
                    data: (requests) {
                      if (requests.isEmpty) {
                        return _EmptyHistoryState();
                      }
                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: requests.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final req = requests[index];
                          return _RequestCard(req: req);
                        },
                      );
                    },
                    loading: () => const Column(children: [
                      Skeleton(height: 80),
                      SizedBox(height: 12),
                      Skeleton(height: 80)
                    ]),
                    error: (e, s) => Text('Erro ao carregar histórico: $e'),
                  ),
            ],
          );
        },
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final int total;
  final int vested;
  const _BalanceCard({required this.total, required this.vested});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          gradient: LinearGradient(
              colors: [Colors.blue.shade800, Colors.blue.shade600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(24),
          boxShadow: const [
            BoxShadow(
                color: Colors.blueAccent,
                blurRadius: 20,
                offset: Offset(0, 10),
                spreadRadius: -5)
          ]),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.beach_access, color: Colors.white70),
              SizedBox(width: 8),
              Text('Saldo de Férias',
                  style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      fontFamily: 'Space Mono')),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('$total',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      height: 1)),
              const SizedBox(width: 8),
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('dias',
                    style: TextStyle(color: Colors.white70, fontSize: 20)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text('Adquiridos: $vested dias',
              style: const TextStyle(color: Colors.white54, fontSize: 14)),
        ],
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final dynamic req;
  const _RequestCard({required this.req});

  @override
  Widget build(BuildContext context) {
    final start = DateTime.parse(req['startDate']);
    final end = DateTime.parse(req['endDate']);
    final status = req['status'] ?? 'PENDING';
    final days = end.difference(start).inDays + 1;

    Color bg;
    Color text;
    String label;

    switch (status) {
      case 'APPROVED':
        bg = Colors.green.shade50; // Emerald-100ish
        text = Colors.green.shade800; // Emerald-800ish
        label = 'APROVADO';
        break;
      case 'REJECTED':
        bg = Colors.pink.shade50; // Rose-100ish
        text = Colors.pink.shade800; // Rose-800ish
        label = 'REPROVADO';
        break;
      default:
        bg = Colors.amber.shade50; // Amber-100ish
        text = Colors.amber.shade800; // Amber-800ish
        label = 'PENDENTE';
    }

    return Container(
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4))
          ]),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.date_range, color: Colors.black54),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                    '${DateFormat('dd/MM').format(start)} - ${DateFormat('dd/MM').format(end)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text('$days dias',
                    style:
                        TextStyle(color: Colors.grey.shade500, fontSize: 13)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
                color: bg, borderRadius: BorderRadius.circular(8)),
            child: Text(label,
                style: TextStyle(
                    color: text, fontWeight: FontWeight.bold, fontSize: 11)),
          )
        ],
      ),
    );
  }
}

class _EmptyHistoryState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Icon(Icons.history, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text('Nenhuma solicitação recente',
              style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}
