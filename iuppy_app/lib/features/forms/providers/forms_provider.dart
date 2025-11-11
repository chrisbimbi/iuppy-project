// lib/features/forms/providers/forms_provider.dart
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/forms/services/forms_api.dart';

final formsRefreshProvider = StateProvider<int>((ref) => 0);

final formsRepoProvider = Provider<_FormsRepo>((ref) => _FormsRepo(ref));

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

  Future<List<Map<String, dynamic>>> listVisible() async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);

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

    final all = await api.list();

    return all
        .where((f) => (f['status'] ?? 'draft') == 'published')
        .where(_matchesSchedule)
        .where((f) => _matchesAudience(f, userGroups, visibleSpaces))
        .toList();
  }

  Future<Map<String, dynamic>> mySubmissions() async {
    final apiClient = ref.read(apiClientProvider);
    final me = await apiClient.getMe();
    final userId = (me['id'] ?? me['sub'] ?? '').toString();
    final api = FormsApi(apiClient);
    return api.mySubmissions(userId: userId);
  }

  Future<Map<String, dynamic>> getForm(String id) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.getForm(id);
  }

  Future<Map<String, dynamic>> getSubmissionDetail(
    String formId,
    String submissionId,
  ) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    return api.submissionDetail(formId, submissionId);
  }

  Future<void> submit(
    String formId,
    List<Map<String, dynamic>> answers, {
    List<Map<String, dynamic>>? attachments,
  }) async {
    final apiClient = ref.read(apiClientProvider);
    final api = FormsApi(apiClient);
    await api.submit(
      formId,
      answers: answers,
      attachments: attachments,
      meta: {
        // você pode colocar device/os aqui depois
      },
    );
  }
}

final formsListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  return ref.read(formsRepoProvider).listVisible();
});

final myFormsSubmissionsProvider =
    FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  ref.watch(formsRefreshProvider);
  return ref.read(formsRepoProvider).mySubmissions();
});

final formDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>(
  (ref, formId) async {
    return ref.read(formsRepoProvider).getForm(formId);
  },
);

final formSubmissionDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, (String formId, String submissionId)>(
  (ref, params) async {
    final (formId, submissionId) = params;
    return ref
        .read(formsRepoProvider)
        .getSubmissionDetail(formId, submissionId);
  },
);
