import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:iuppy_app/features/news/models/feed_models.dart';

class ApiClient {
  final Dio _dio;
  final String companyId;

  ApiClient(this._dio, this.companyId) {
    if (kDebugMode) {
      _dio.interceptors.removeWhere((i) => i is LogInterceptor);
      _dio.interceptors.add(
        LogInterceptor(
          request: true,
          requestHeader: false,
          requestBody: true,
          responseHeader: false,
          responseBody: false,
          error: true,
          logPrint: (o) => debugPrint('[DIO] $o'),
        ),
      );
      debugPrint('[ApiClient] companyId=$companyId');
    }
  }

  Map<String, dynamic> _etagHeader(String? etag) =>
      (etag != null && etag.isNotEmpty) ? {'If-None-Match': etag} : const {};

  // ---------------------------
  // AUTH / USER
  // ---------------------------

  /// Traz o usuário logado (precisa do Authorization já no Dio).
  /// Caso a rota não exista, retorna {} (app usa fallback).
  Future<Map<String, dynamic>> getMe() async {
    try {
      final resp = await _dio.get('/auth/me');
      return Map<String, dynamic>.from(resp.data as Map);
    } catch (_) {
      return <String, dynamic>{};
    }
  }

  // ---------------------------
  // COMPANY (branding / módulos)
  // ---------------------------

  Future<Map<String, dynamic>> getCompanySettings() async {
    final resp = await _dio.get('/modules/$companyId/company-settings');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<List<Map<String, dynamic>>> getCompanyModules() async {
    final resp = await _dio.get('/modules/$companyId/company-modules');
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  // -------------
  // SPACES / CHANNELS
  // -------------

  /// Preferência: v2. Fallback para legado (/spaces?companyId=...)
  Future<List<Map<String, dynamic>>> getSpaces() async {
    try {
      final resp = await _dio.get('/v2/spaces');
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        // legado
        final resp = await _dio
            .get('/spaces', queryParameters: {'companyId': companyId});
        return List<Map<String, dynamic>>.from(
          (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      rethrow;
    }
  }

  /// Preferência: v2 (/v2/channels?companyId&spaceId).
  /// Fallback: legado (/channels?companyId&spaceId).
  Future<List<Map<String, dynamic>>> getChannels({String? spaceId}) async {
    final qp = {
      'companyId': companyId,
      if (spaceId != null) 'spaceId': spaceId,
    };
    try {
      final resp = await _dio.get('/v2/channels', queryParameters: qp);
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        final resp = await _dio.get('/channels', queryParameters: qp);
        return List<Map<String, dynamic>>.from(
          (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      rethrow;
    }
  }

  // -----
  // FEED v2 (home + badges em 1 chamada)
  // -----

  /// GET /v2/me/feed
  /// Retorna itens + counters. Se o servidor responder 304, devolvemos
  /// uma resposta "vazia" com o mesmo etag para o chamador decidir.
  Future<MeFeedResponse> getMeFeed({
    String? spaceId,
    String? channelId,
    int? limit,
    String? cursor,
    String? sinceEtag,
  }) async {
    final qp = <String, dynamic>{
      if (spaceId != null) 'spaceId': spaceId,
      if (channelId != null) 'channelId': channelId,
      if (limit != null) 'limit': limit,
      if (cursor != null) 'cursor': cursor,
    };
    final resp = await _dio.get(
      '/v2/me/feed',
      queryParameters: qp,
      options: Options(headers: _etagHeader(sinceEtag)),
    );

    if (resp.statusCode == 304) {
      return MeFeedResponse(
        items: const [],
        counters: FeedCounters(
            totalUnread: 0, bySpace: const {}, byChannel: const {}),
        nextCursor: null,
        etag: sinceEtag ?? '',
        serverTime: DateTime.now().toIso8601String(),
      );
    }

    final data = Map<String, dynamic>.from(resp.data as Map);
    return MeFeedResponse.fromJson(data);
  }

  // -----
  // NEWS (legado ainda disponível em algumas telas)
  // -----

  Future<List<Map<String, dynamic>>> getNews({String? channelId}) async {
    final resp = await _dio.get(
      '/news',
      queryParameters: {
        if (channelId != null && channelId.isNotEmpty) 'channelId': channelId,
      },
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getNewsByChannel(String channelId) async {
    return getNews(channelId: channelId);
  }

  /// Preferência: v2. Fallback: legado (/news/:id)
  Future<Map<String, dynamic>> getNewsDetail(String id) async {
    try {
      final resp = await _dio.get('/v2/news/$id');
      return Map<String, dynamic>.from(resp.data as Map);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        final resp2 = await _dio.get('/news/$id');
        return Map<String, dynamic>.from(resp2.data as Map);
      }
      rethrow;
    }
  }

  // -----
  // INTERAÇÕES v2 (com fallback para legadas quando fizer sentido)
  // -----

  /// Marca OPEN (idempotente no backend).
  Future<void> openNews(String newsId) async {
    try {
      await _dio.post('/v2/news/$newsId/open');
    } on DioException catch (e) {
      // sem fallback: rota não existia no legado
      rethrow;
    }
  }

  /// ACK (v2). Fallback para /news/:id/acknowledge (legado).
  Future<void> ackNews(String newsId) async {
    try {
      await _dio.post('/v2/news/$newsId/ack');
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        await _dio.post('/news/$newsId/acknowledge');
        return;
      }
      rethrow;
    }
  }

  /// REACT (v2). Fallback para /news/:id/reactions (legado).
  Future<void> reactToNews(String newsId, String reaction) async {
    try {
      await _dio.post('/v2/news/$newsId/react', data: {'reaction': reaction});
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        await _dio
            .post('/news/$newsId/reactions', data: {'reaction': reaction});
        return;
      }
      rethrow;
    }
  }

  /// Comentário (v2). Se commentsRequireModeration=true, backend cria como pending.
  Future<void> commentNews(String newsId, String text) async {
    await _dio.post('/v2/news/$newsId/comments', data: {'text': text});
  }

  /// Share (v2). target opcional: copy_link | system_share
  Future<void> shareNews(String newsId, {String? target}) async {
    await _dio.post('/v2/news/$newsId/share', data: {'target': target});
  }

  /// Contagem de reações (LEGADO). Mantido para telas antigas; use os counts do feed v2 quando possível.
  Future<Map<String, int>> getNewsReactionsCount(String newsId) async {
    try {
      final resp = await _dio.get('/news/$newsId/reactions/count');
      final raw = Map<String, dynamic>.from(resp.data as Map);
      return raw.map((k, v) => MapEntry(k, int.tryParse('$v') ?? 0));
    } catch (_) {
      return {};
    }
  }

  /// Status de ACK (LEGADO). Em v2, derive de userState.isRead + ack específico via métricas.
  Future<bool> hasAcknowledgedNews(String newsId) async {
    try {
      final resp = await _dio.get('/news/$newsId/acknowledgement');
      final data = Map<String, dynamic>.from(resp.data as Map);
      return (data['acknowledged'] ?? false) == true;
    } catch (_) {
      return false;
    }
  }

  // -------
  // SURVEYS (mantém igual)
  // -------

  Future<List<Map<String, dynamic>>> getSurveys() async {
    final resp = await _dio.get('/modules/$companyId/surveys');
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getSurveyDetail(String id) async {
    final resp = await _dio.get('/modules/$companyId/surveys/$id');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<void> postSurveyResponse({
    required String surveyId,
    required List<Map<String, dynamic>> answers,
    String? userId,
  }) async {
    final body = <String, dynamic>{
      'surveyId': surveyId,
      'answers': answers,
      if (userId != null && userId.isNotEmpty) 'userId': userId,
    };

    if (kDebugMode) {
      debugPrint('[POST] /modules/$companyId/surveys/responses  body=$body');
    }

    await _dio.post(
      '/modules/$companyId/surveys/responses',
      data: body,
      options: Options(contentType: Headers.jsonContentType),
    );
  }

  // -------
  // SEARCH TRACK
  // -------

  Future<void> trackSearch(String query) async {
    if (query.trim().length < 2) return;
    await _dio.post('/v2/track/search', data: {'query': query});
  }
}
