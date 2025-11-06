import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart'; // apiClientProvider, userGroupsProvider, spacesRepoProvider, feedVersionProvider
import '../services/forms_api.dart';

/// Disparador manual para recarregar a lista (pull-to-refresh, etc).
final formsRefreshProvider = StateProvider<int>((ref) => 0);

final formsRepoProvider = Provider((ref) => _FormsRepo(ref));

class _FormsRepo {
  final Ref ref;
  _FormsRepo(this.ref);

  bool _matchesAudience(Map item, Set<String> myGroups, Set<String> mySpaces) {
    Iterable<String> _arr(dynamic v) {
      if (v is List) return v.map((e) => '$e');
      return const <String>[];
    }

    final aSpaces = <String>{..._arr(item['audienceSpaceIds'])}
      ..removeWhere((e) => e.trim().isEmpty);
    final aGroups = <String>{..._arr(item['audienceGroupIds'])}
      ..removeWhere((e) => e.trim().isEmpty);

    // Empresa inteira: sem filtros de segmentação
    if (aSpaces.isEmpty && aGroups.isEmpty) return true;

    // Qualquer interseção em spaces OU groups já habilita visibilidade
    if (aSpaces.isNotEmpty && aSpaces.any(mySpaces.contains)) return true;
    if (aGroups.isNotEmpty && aGroups.any(myGroups.contains)) return true;
    return false;
  }

  bool _matchesSchedule(Map item) {
    DateTime? parseUtc(dynamic v) {
      if (v == null) return null;
      try {
        return DateTime.tryParse(v.toString())?.toUtc();
      } catch (_) {
        return null;
      }
    }

    final now = DateTime.now().toUtc();
    final start = parseUtc(item['scheduleStartAt']);
    final end = parseUtc(item['scheduleEndAt']);

    if (start != null && start.isAfter(now)) return false; // ainda não começou
    if (end != null && !end.isAfter(now)) return false; // já terminou
    return true;
  }

  Future<List<Map<String, dynamic>>> listVisible() async {
    // IMPORTANTÍSSIMO: usa o ApiClient (não o Dio) para criar a FormsApi.
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);

    final userGroups = ref.read(userGroupsProvider);

    // Spaces visíveis (usa cache local; se estiver vazio, carrega do backend)
    final spacesRepo = ref.read(spacesRepoProvider);
    final cachedSpaces = await spacesRepo.getCached();
    final spaces = cachedSpaces.isNotEmpty
        ? cachedSpaces
        : await spacesRepo.fetchAndCache();

    final visibleSpaces = spaces
        .map((s) => (s['id'] ?? '').toString())
        .where((e) => e.isNotEmpty)
        .toSet();

    // Busca todos os formulários e filtra no app
    final all = await api.list();

    return all
        .where((f) => (f['status'] ?? 'draft') == 'published')
        .where(_matchesSchedule)
        .where((f) => _matchesAudience(f, userGroups, visibleSpaces))
        .toList();
  }
}

/// Lista de formulários visíveis para o usuário:
/// - reage a formsRefreshProvider (pull-to-refresh manual)
/// - reage a feedVersionProvider (quando a home pedir atualização)
final formsListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  return ref.read(formsRepoProvider).listVisible();
});
