// lib/features/forms/providers/forms_provider.dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/forms/services/forms_api.dart';

final userLocaleProvider = Provider<String>((ref) {
  return 'pt-BR';
});

final formsRefreshProvider = StateProvider<int>((ref) => 0);

final formsRepoProvider = Provider<_FormsRepo>((ref) => _FormsRepo(ref));

class _FormsRepo {
  final Ref ref;
  _FormsRepo(this.ref);

  bool _matchesAudience(Map item, Set<String> myGroups, Set<String> mySpaces) {
    Iterable<String> arr(dynamic v) {
      if (v is List) return v.map((e) => '$e');
      return const <String>[];
    }

    final aSpaces = <String>{...arr(item['audienceSpaceIds'])}
      ..removeWhere((e) => e.trim().isEmpty);
    final aGroups = <String>{...arr(item['audienceGroupIds'])}
      ..removeWhere((e) => e.trim().isEmpty);

    if (aSpaces.isEmpty && aGroups.isEmpty) return true;
    if (aSpaces.isNotEmpty && aSpaces.any(mySpaces.contains)) return true;
    if (aGroups.isNotEmpty && aGroups.any(myGroups.contains)) return true;
    return false;
  }

  bool _matchesSchedule(Map item) {
    DateTime? parseUtc(dynamic v) {
      if (v == null) return null;
      return DateTime.tryParse(v.toString())?.toUtc();
    }

    final now = DateTime.now().toUtc();
    final start = parseUtc(item['scheduleStartAt']);
    final end = parseUtc(item['scheduleEndAt']);
    if (start != null && start.isAfter(now)) return false;
    if (end != null && !end.isAfter(now)) return false;
    return true;
  }

  Future<List<Map<String, dynamic>>> listVisible({String? template}) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    final userLocale = ref.read(userLocaleProvider);
    final userGroups = ref.read(userGroupsProvider);
    final spacesRepo = ref.read(spacesRepoProvider);
    final cachedSpaces = await spacesRepo.getCached();
    final spaces = cachedSpaces.isNotEmpty
        ? cachedSpaces
        : await spacesRepo.fetchAndCache();
    final visibleSpaces = spaces
        .map((s) => (s['id'] ?? '').toString())
        .where((e) => e.isNotEmpty)
        .toSet();

    final all = await api.list(queryParameters: {
      'locale': userLocale,
      'visibility': 'all', // 🔥 DEBUG: Traz tudo
      if (template != null) 'template': template,
    });

    // 🔥 DEBUG: Removendo filtros locais para ver se chega algo
    return all.toList();
    /*
    return all
        .where((f) => (f['status'] ?? 'draft') == 'published')
        .where(_matchesSchedule)
        .where((f) => _matchesAudience(f, userGroups, visibleSpaces))
        .toList();
    */
  }

  Future<Map<String, dynamic>> mySubmissions() async {
    final apiClient = ref.read(apiClientProvider);
    final me = await apiClient.getMe();
    final userId = (me['id'] ?? me['sub'] ?? '').toString();
    final userLocale = ref.read(userLocaleProvider);
    final api = FormsApi(apiClient);
    return api.mySubmissions(userId: userId, locale: userLocale);
  }

  // 🔥 MÉTODO QUE FALTAVA
  Future<List<Map<String, dynamic>>> myInteractions({int limit = 50}) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.myInteractions(limit: limit);
  }

  Future<Map<String, dynamic>> getForm(String id) async {
    final apiClient = ref.read(apiClientProvider);
    return apiClient.getFormDetail(id,
        queryParameters: {'locale': ref.read(userLocaleProvider)});
  }

  Future<Map<String, dynamic>> getSubmissionDetail(
      String formId, String submissionId) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.submissionDetail(formId, submissionId,
        locale: ref.read(userLocaleProvider));
  }

  Future<void> submit(String formId, List<Map<String, dynamic>> answers,
      {List<Map<String, dynamic>>? attachments}) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    await api
        .submit(formId, answers: answers, attachments: attachments, meta: {});
  }

  Future<Map<String, dynamic>> getChatHistory(
      String formId, String submissionId) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.getChatHistory(formId, submissionId);
  }

  Future<Map<String, dynamic>> postChatMessage(
      String formId, String submissionId, String message) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.postChatMessage(formId, submissionId, message);
  }
}

// ==================================
// PROVIDERS DE DADOS
// ==================================

final formsListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  return ref.read(formsRepoProvider).listVisible();
});

final myFormsSubmissionsProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  return ref.read(formsRepoProvider).mySubmissions();
});

// 🔥 PROVIDER CORRIGIDO: Usa a chave certa 'unreadChatCount'
final userFormsUnreadCountProvider =
    FutureProvider.autoDispose<int>((ref) async {
  final submissionsMap = await ref.watch(myFormsSubmissionsProvider.future);
  final items = (submissionsMap['items'] as List? ?? []);
  int count = 0;
  for (final item in items) {
    // ATENÇÃO: A query no forms.service.ts retorna 'unreadChatCount'
    final unread = item['unreadChatCount'] as int? ?? 0;
    if (unread > 0) count++;
  }
  return count;
});

final formDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, formId) async {
  return ref.read(formsRepoProvider).getForm(formId);
});

final formSubmissionDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, (String formId, String submissionId)>(
        (ref, params) async {
  final (formId, submissionId) = params;
  return ref.read(formsRepoProvider).getSubmissionDetail(formId, submissionId);
});

final formChatHistoryProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, (String formId, String submissionId)>(
        (ref, params) async {
  final (formId, submissionId) = params;
  ref.invalidate(myFormsSubmissionsProvider);
  return ref.read(formsRepoProvider).getChatHistory(formId, submissionId);
});

final postFormChatMessageProvider = StateNotifierProvider.autoDispose<
        PostFormChatMessageNotifier, AsyncValue<Map<String, dynamic>?>>(
    (ref) => PostFormChatMessageNotifier(ref));

class PostFormChatMessageNotifier
    extends StateNotifier<AsyncValue<Map<String, dynamic>?>> {
  final Ref _ref;
  PostFormChatMessageNotifier(this._ref) : super(const AsyncData(null));

  Future<void> send(
      {required String formId,
      required String submissionId,
      required String message}) async {
    state = const AsyncLoading();
    try {
      final result = await _ref
          .read(formsRepoProvider)
          .postChatMessage(formId, submissionId, message);
      _ref.invalidate(formChatHistoryProvider((formId, submissionId)));
      state = AsyncData(result);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}
