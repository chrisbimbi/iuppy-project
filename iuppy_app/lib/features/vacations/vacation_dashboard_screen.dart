import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Mock Provider for balance
final vacationBalanceProvider = FutureProvider.autoDispose((ref) async {
  // In real app, call API
  await Future.delayed(const Duration(seconds: 1));
  return {
    'daysVested': 30,
    'daysTaken': 10,
    'balanceTotal': 20,
    'concessiveLimitDate': DateTime.now().add(const Duration(days: 120)),
  };
});

class VacationDashboardScreen extends ConsumerWidget {
  const VacationDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceAsync = ref.watch(vacationBalanceProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Minhas Férias')),
      body: balanceAsync.when(
        data: (balance) {
          final limit = balance['concessiveLimitDate'] as DateTime;
          final isCritical = limit.difference(DateTime.now()).inDays < 60;

          return Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildBalanceCard(balance['balanceTotal'] as int, isCritical),
                const SizedBox(height: 20),
                Text('Período Aquisitivo',
                    style: Theme.of(context).textTheme.titleMedium),
                const ListTile(
                  title: Text('Vencimento do Período'),
                  subtitle: Text('12/12/2025'),
                  leading: Icon(Icons.date_range, color: Colors.blue),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    // Navigate to Request Screen
                    Navigator.pushNamed(context, '/vacation/request');
                  },
                  child: const Text('Solicitar Férias'),
                )
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }

  Widget _buildBalanceCard(int days, bool isCritical) {
    return Card(
      color: isCritical ? Colors.red.shade50 : Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Text('Saldo Atual'),
            Text(
              '$days Dias',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: isCritical ? Colors.red : Colors.blue,
              ),
            ),
            if (isCritical)
              const Text(
                'Atenção: Vencimento próximo!',
                style: TextStyle(color: Colors.red),
              ),
          ],
        ),
      ),
    );
  }
}
