import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart'; // apiClientProvider, envProvider, localNewsStoreProvider
import '../controllers/news_detail_controller.dart';

/// Bumps when a news is marked as opened locally. UIs can `ref.watch(newsSeenVersionProvider)`
/// to recompute badges without um server round-trip. Declarado em core/providers.dart.
typedef NewsOpenCallback = void Function();

/// Builds an `onOpen` callback for a given news id that marks it read and bumps the version.
final newsOnOpenForIdProvider =
    Provider.family<NewsOpenCallback, String>((ref, id) {
  return () {
    // Mark locally (fire-and-forget) and bump version to trigger badges recomputation.
    ref.read(localNewsStoreProvider).markRead(id);
    ref.read(newsSeenVersionProvider.notifier).state++;
  };
});

final newsDetailControllerProvider = ChangeNotifierProvider.autoDispose
    .family<NewsDetailController, String>((ref, id) {
  final api = ref.read(apiClientProvider);
  final env = ref.read(envProvider);
  final repo = ref.read(newsRepoProvider); // ⬅ Injeta Repo
  final ctrl = NewsDetailController(
    () => ref.read(newsOnOpenForIdProvider(id))(),
    api: api,
    repo: repo, // ⬅ Passa Repo
    env: env,
    newsId: id,
  );
  // auto-load
  Future.microtask(() => ctrl.load());
  return ctrl;
});
