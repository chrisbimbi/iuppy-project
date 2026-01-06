import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../core/providers.dart';

int _asInt(dynamic v, [int d = 0]) {
  if (v is num) return v.toInt();
  if (v == null) return d;
  return int.tryParse(v.toString()) ?? d;
}

/// Busca métricas *em batch* para a lista atual, chamando `getNewsDetail`
/// para cada id (em paralelo) e montando um Map<newsId, metricsMap>.
///
/// Usa SOMENTE métodos existentes no ApiClient (getNewsDetail).
final newsBatchMetricsProvider =
    FutureProvider.family<Map<String, Map<String, dynamic>>, List>(
        (ref, list) async {
  final api = ref.read(apiClientProvider);

  final ids = list
      .map((n) => (n as Map?)?['id'])
      .whereType<String>()
      .where((s) => s.isNotEmpty)
      .toList();

  if (ids.isEmpty) return <String, Map<String, dynamic>>{};

  final out = <String, Map<String, dynamic>>{};
  final futures = <Future<void>>[];

  for (final id in ids) {
    futures.add(() async {
      try {
        final detail = await api.getNewsDetail(id); // <-- método existente
        final d = Map<String, dynamic>.from(detail);

        // No v2/detail, o retorno tem um bloco "metrics".
        final metrics = (d['metrics'] is Map)
            ? Map<String, dynamic>.from(d['metrics'])
            : <String, dynamic>{};

        // Normaliza para os nomes esperados no front:
        out[id] = <String, dynamic>{
          'reactionsTotal':
              _asInt(metrics['reactionsTotal'] ?? d['totalReactions']),
          'commentsTotal':
              _asInt(metrics['commentsTotal'] ?? d['commentsTotal']),
          'sharesTotal': _asInt(metrics['sharesTotal'] ?? d['sharesTotal']),
          'favoritesTotal':
              _asInt(metrics['favoritesTotal'] ?? metrics['favorites']),
        };
      } catch (_) {
        // ignora falha desse item; card usa fallback do /news
      }
    }());
  }

  await Future.wait(futures);
  return out;
});
