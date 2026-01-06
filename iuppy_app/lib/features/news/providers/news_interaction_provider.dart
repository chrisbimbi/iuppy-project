// lib/features/news/providers/news_interaction_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:iuppy_app/data/remote/api_client.dart';
import 'package:iuppy_app/core/providers.dart';

class NewsInteractionProvider extends StateNotifier<void> {
  final ApiClient _api;
  final String newsId;
  DateTime? _lastOpenSentAt; // de-bounce p/ /open
  bool _firstPushOpenSent = false; // garante "push-open-once"

  final Ref _ref;

  NewsInteractionProvider(this._api, this.newsId, this._ref) : super(null);

  Future<void> sendOpen({Map<String, dynamic>? meta}) async {
    final now = DateTime.now();

    // Debounce de 5s pra eventos "visíveis"
    if (_lastOpenSentAt != null &&
        now.difference(_lastOpenSentAt!).inSeconds < 5) {
      // debug: print('[NewsInteraction] open debounced');
      return;
    }
    _lastOpenSentAt = now;

    // Garante que o primeiro OPEN de origem "push" seja único
    final origin = (meta?['origin'] ?? '').toString();
    if (origin == 'push') {
      if (_firstPushOpenSent) return;
      _firstPushOpenSent = true;
    }

    // No backend, o endpoint usa o usuário logado (Bearer) e resolve companyId server-side.
    // Não precisamos enviar userId/companyId aqui.
    final enrichedMeta = {
      'origin': origin.isEmpty ? 'app' : origin,
      'tzOffsetMinutes': DateTime.now().timeZoneOffset.inMinutes,
      if (meta != null) ...meta,
    };

    try {
      await _api.openNews(newsId, meta: enrichedMeta);
      
      // 🔥 Atualiza badge localmente
      final localStore = _ref.read(localNewsStoreProvider);
      await localStore.markRead(newsId);
      
      // 🔥 Notifica app para atualizar badges
      _ref.read(feedVersionProvider.notifier).state++;
    } catch (_) {
      // silencia falha de telemetria
    }
  }
}

// Provider
final newsInteractionProvider =
    StateNotifierProvider.family<NewsInteractionProvider, void, String>(
  (ref, newsId) {
    final api = ref.watch(apiClientProvider);
    return NewsInteractionProvider(api, newsId, ref);
  },
);
