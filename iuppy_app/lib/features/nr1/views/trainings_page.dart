import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart'; // envProvider, apiClientProvider
import '../models/training_models.dart';
import 'video_player_page.dart';

final myTrainingsProvider = FutureProvider<List<Nr1Training>>((ref) async {
  final api = ref.read(apiClientProvider);

  // Fetch Journeys
  final allJourneys = await api.getJourneys();

  // Filter NR1 Journeys
  final nr1Journeys = allJourneys.where((j) {
    final isNr1 = j['isNr1'];
    return isNr1 == true || isNr1 == 'true';
  }).map((j) {
    return Nr1Training(
      id: j['id'],
      title: j['title'] ?? 'Sem título',
      type: 'Jornada',
      hours: 0.0,
      contents: [],
    );
  }).toList();

  return nr1Journeys;
});

class TrainingsPage extends HookConsumerWidget {
  const TrainingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final listAsync = ref.watch(myTrainingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Meus Treinamentos')),
      body: listAsync.when(
        data: (data) => data.isEmpty
            ? const Center(child: Text('Nenhum treinamento atribuído.'))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: data.length,
                itemBuilder: (c, i) {
                  final t = data[i];
                  final isForm = t.type == 'Formulário';
                  final icon = isForm ? Icons.assignment : Icons.school;
                  final color = isForm ? Colors.indigo : Colors.orange;

                  return Card(
                    child: Column(
                      children: [
                        Container(
                          height: 120,
                          color: color,
                          alignment: Alignment.center,
                          child: Icon(icon, color: Colors.white, size: 64),
                        ),
                        ListTile(
                          title: Text(t.title),
                          subtitle: Text('${t.type}'),
                          trailing: ElevatedButton(
                            onPressed: () {
                              if (t.type == 'Formulário') {
                                GoRouter.of(context).push('/forms/${t.id}');
                              } else if (t.type == 'Jornada') {
                                GoRouter.of(context).push('/journeys/${t.id}');
                              } else {
                                // Fallback
                                final content = t.contents.isNotEmpty
                                    ? t.contents.first
                                    : null;
                                final url = (content is Map &&
                                        content['url'] != null)
                                    ? content['url']
                                    : 'https://flutter.github.io/assets-for-api-docs/assets/videos/bee.mp4';

                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => VideoPlayerPage(
                                            videoUrl: url,
                                            title: t.title,
                                          )),
                                );
                              }
                            },
                            child: const Text('Abrir'),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
        error: (err, _) => Center(child: Text('Erro: $err')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
