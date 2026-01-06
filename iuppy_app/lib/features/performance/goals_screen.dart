import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'providers/performance_providers.dart';

class GoalsScreen extends HookConsumerWidget {
  const GoalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(myGoalsProvider);

    // Animation Controller for "Confetti" simulation (Simple Scaling/Fade)
    final confettiController =
        useAnimationController(duration: const Duration(seconds: 2));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('METAS & OKRS',
            style: TextStyle(
                fontFamily: 'Space Mono',
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
                color: Colors.black87)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: goalsAsync.when(
        data: (goals) {
          if (goals.isEmpty) {
            return _EmptyState();
          }

          return ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: goals.length,
            separatorBuilder: (_, __) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final goal = goals[index];
              return _GoalCard(
                  goal: goal,
                  onCheckIn: () {
                    // Simulate check-in or confetti
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('🎉 Check-in realizado com sucesso!'),
                        backgroundColor: Colors.green));
                  });
            },
          );
        },
        loading: () =>
            const Center(child: CircularProgressIndicator(color: Colors.black)),
        error: (err, stack) => Center(child: Text('Erro: $err')),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  final Map<String, dynamic> goal;
  final VoidCallback onCheckIn;

  const _GoalCard({required this.goal, required this.onCheckIn});

  @override
  Widget build(BuildContext context) {
    final progress = (goal['progress'] as num).toDouble();

    return Container(
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4))
          ]),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(8)),
                  child: Icon(Icons.track_changes,
                      color: Colors.blue.shade700, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    goal['title'] as String,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        fontFamily: 'Space Mono'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Custom Progress Bar
            Stack(
              children: [
                Container(
                  height: 8,
                  width: double.infinity,
                  decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(4)),
                ),
                FractionallySizedBox(
                  widthFactor: progress / 100,
                  child: Container(
                    height: 8,
                    decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [
                          _getColor(progress),
                          _getColor(progress).withOpacity(0.7)
                        ]),
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(
                              color: _getColor(progress).withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(0, 2))
                        ]),
                  ),
                )
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${progress.toInt()}% Concluído',
                    style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                        fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: onCheckIn,
                  style: TextButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Check-in',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                )
              ],
            )
          ],
        ),
      ),
    );
  }

  Color _getColor(double progress) {
    if (progress >= 80) return Colors.green;
    if (progress >= 50) return Colors.amber;
    return Colors.red;
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.rocket_launch_outlined,
              size: 80, color: Colors.grey.shade300),
          const SizedBox(height: 24),
          const Text('Vamos decolar! 🚀',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87)),
          const SizedBox(height: 8),
          Text('Você ainda não tem metas definidas.',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
          const SizedBox(height: 32),
          ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Criar Primeira Meta'),
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8))))
        ],
      ),
    );
  }
}
