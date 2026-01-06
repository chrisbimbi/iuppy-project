import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart'; // envProvider, apiClientProvider
import '../models/emergency_models.dart';

// State Providers for data fetching
final emergencyProceduresProvider = FutureProvider<List<Nr1EmergencyProcedure>>((ref) async {
  final api = ref.read(apiClientProvider);
  // Using generic GET request via dio since specific methods might not be in ApiClient yet
  // Ideally, we add getEmergencyProcedures to ApiClient or a dedicated repo.
  final resp = await api.dio.get('/nr1/procedures');
  final list = (resp.data as List).map((e) => Nr1EmergencyProcedure.fromJson(e)).toList();
  return list;
});

final emergencyDrillsProvider = FutureProvider<List<Nr1EmergencyDrill>>((ref) async {
  final api = ref.read(apiClientProvider);
  final resp = await api.dio.get('/nr1/drills');
  final list = (resp.data as List).map((e) => Nr1EmergencyDrill.fromJson(e)).toList();
  return list;
});

class EmergencyPage extends HookConsumerWidget {
  const EmergencyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final proceduresAsync = ref.watch(emergencyProceduresProvider);
    final drillsAsync = ref.watch(emergencyDrillsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Plano de Emergência'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // SOS HEADER
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade700,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Icon(Icons.sos, size: 48, color: Colors.white),
                  const SizedBox(height: 10),
                  const Text(
                    'EM CASO DE EMERGÊNCIA',
                    style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 18),
                  ),
                  const SizedBox(height: 5),
                  const Text('Ligue: 193 (Bombeiros) / 192 (SAMU)',
                      style: TextStyle(color: Colors.white)),
                  const SizedBox(height: 15),
                  ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Call functionality
                      },
                      icon: const Icon(Icons.phone),
                      label: const Text('LIGAR AGORA'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.red,
                      ))
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text('Procedimentos',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),

            proceduresAsync.when(
              data: (data) => data.isEmpty
                  ? const Text('Nenhum procedimento disponível.')
                  : Column(
                      children: data
                          .map((p) => Card(
                                child: ListTile(
                                  leading: const Icon(Icons.description,
                                      color: Colors.blue),
                                  title: Text(p.title),
                                  subtitle: Text('Versão: ${p.version}'),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                     // TODO: Open PDF
                                  },
                                ),
                              ))
                          .toList(),
                    ),
              error: (err, _) => Text('Erro ao carregar: $err'),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),

            const SizedBox(height: 24),
            const Text('Próximos Simulados',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),

            drillsAsync.when(
               data: (data) => data.isEmpty
                  ? const Text('Nenhum simulado agendado.')
                  : Column(
                      children: data
                          .map((d) => Card(
                                child: ListTile(
                                  leading: const Icon(Icons.run_circle_outlined,
                                      color: Colors.orange),
                                  title: Text(d.location),
                                  subtitle: Text(d.scheduledDate.toString()), // Formatting simplified
                                  trailing: ElevatedButton(
                                    onPressed: () {
                                      // Mock Check-in
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Simulando Check-in via QR Code...'))
                                      );
                                    },
                                    child: const Text('Check-in'),
                                  ),
                                ),
                              ))
                          .toList(),
                    ),
              error: (err, _) => Text('Erro ao carregar: $err'),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ],
        ),
      ),
    );
  }
}
