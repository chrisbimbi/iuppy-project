import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';

class SurveysListPage extends ConsumerWidget {
  const SurveysListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void _handleBack() {
      if (context.canPop()) {
        context.pop();
      } else {
        context.go('/');
      }
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: _handleBack,
          tooltip: 'Voltar',
        ),
        title: const Text('Enquetes'),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: ref.read(surveysRepoProvider).list(limit: 50),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final list = snap.data ?? const <Map<String, dynamic>>[];
          if (list.isEmpty) return const Center(child: Text('Sem enquetes.'));
          return ListView.separated(
            itemCount: list.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (_, i) {
              final s = list[i];
              return ListTile(
                leading: const Icon(Icons.poll),
                title: Text(s['title'] as String? ?? ''),
                onTap: () => context.push('/surveys/${s['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}
