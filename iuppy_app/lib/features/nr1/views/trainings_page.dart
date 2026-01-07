import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart'; // envProvider, apiClientProvider
import '../models/training_models.dart';
import 'video_player_page.dart';

final myTrainingsProvider = FutureProvider<List<Nr1Training>>((ref) async {
  final api = ref.read(apiClientProvider);
  // Using endpoint /nr1/trainings (Catalog) as fallback for now
  // since /my-sessions joins logic might return session objects wrapped
  final resp = await api.dio.get('/nr1/trainings');
  final list = (resp.data as List).map((e) => Nr1Training.fromJson(e)).toList();
  return list;
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
                  return Card(
                    child: Column(
                      children: [
                        Container(
                          height: 150,
                          color: Colors.black87,
                          alignment: Alignment.center,
                          child: const Icon(Icons.play_circle_fill,
                              color: Colors.white, size: 64),
                        ),
                        ListTile(
                          title: Text(t.title),
                          subtitle: Text(
                              '${t.hours} horas • ${t.type.toUpperCase()}'),
                          trailing: ElevatedButton(
                            onPressed: () {
                              final content = t.contents.isNotEmpty
                                  ? t.contents.first
                                  : null;
                              // Mock URL if content is invalid or empty
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
                            },
                            child: const Text('Continuar'),
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
