import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/performance/providers/performance_providers.dart';

class PerformancePage extends ConsumerWidget {
  const PerformancePage({super.key});

  @override
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(myGoalsProvider);
    final pdiAsync = ref.watch(myPDIProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Performance & PDI')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Metas', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            goalsAsync.when(
              data: (goals) => Column(
                children: goals.map((g) => ListTile(
                  title: Text(g['title']),
                  subtitle: LinearProgressIndicator(value: (g['progress'] ?? 0) / 100),
                  trailing: Text('${g['progress']}%'),
                )).toList(),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Erro: $e'),
            ),
            const SizedBox(height: 24),
            const Text('Meu PDI', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
             const SizedBox(height: 8),
            pdiAsync.when(
              data: (pdis) => Column(
                children: pdis.map((p) => Card(
                  child: ListTile(
                    title: Text(p['title']),
                    subtitle: Text('Status: ${p['status']}'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                  ),
                )).toList(),
              ),
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => Text('Erro: $e'),
            ),
          ],
        ),
      ),
    );
  }
}
