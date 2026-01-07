// lib/data/remote/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:iuppy_app/features/news/models/feed_models.dart';

/// Tiny cache entry for SWR/ETag handling.
class _CacheEntry {
  final dynamic data;
  final String? etag;
  final DateTime at;
  _CacheEntry(this.data, this.etag) : at = DateTime.now();
}

class ApiClient {
  // ===== In-flight coalescing and tiny cache (SWR window) =====
  final Map<String, Future<Response>> _inflight = {};
  final Map<String, _CacheEntry> _cache = {};

  String _key(String method, String path, [Map<String, dynamic>? qp]) {
    final buf = StringBuffer()
      ..write(method)
      ..write(' ')
      ..write(path);
    if (qp != null && qp.isNotEmpty) {
      final keys = qp.keys.toList()..sort();
      for (final k in keys) {
        buf.write('&$k=${qp[k]}');
      }
    }
    return buf.toString();
  }

  Future<Response> _coalescedGet(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? extraCacheKey,
  }) {
    final Options resolved = options ?? Options();
    resolved.validateStatus ??=
        (s) => s != null && (s == 304 || (s >= 200 && s < 300));

    // se tiver cancelToken, não coalesce
    if (cancelToken != null) {
      return _dio.get(
        path,
        queryParameters: queryParameters,
        options: resolved,
        cancelToken: cancelToken,
      );
    }

    final k = '${_key('GET', path, queryParameters)}::${extraCacheKey ?? ''}';
    final fut = _inflight[k];
    if (fut != null) return fut;

    final f = _dio.get(
      path,
      queryParameters: queryParameters,
      options: resolved,
    );
    _inflight[k] = f;
    return f.whenComplete(() => _inflight.remove(k));
  }

  final Dio _dio;
  final String companyId;

  ApiClient(this._dio, this.companyId) {
    // 🔐 todas as requests levam o companyId
    _dio.options.headers['x-company-id'] = companyId;

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

  /// Exponibiliza o baseUrl para normalização de URLs no app.
  String get baseUrl => _dio.options.baseUrl;

  /// Exposes the underlying Dio instance for repositories that need direct access.
  Dio get dio => _dio;

  // Opcional
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Map<String, dynamic> _etagHeader(String? etag) =>
      (etag != null && etag.isNotEmpty) ? {'If-None-Match': etag} : const {};

  // ---------------------------
  // AUTH / USER
  // ---------------------------

  /// NÃO engole 401 — deixa o interceptor tratar refresh e/ou logout.
  Future<Map<String, dynamic>> getMe() async {
    final resp = await _dio.get('/auth/me');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<String?> lookupPhone(String email) async {
    try {
      final resp = await _dio.post('/auth/lookup', data: {'email': email});
      return resp.data['phone'] as String?;
    } catch (e) {
      return null;
    }
  }

  Future<void> requestEmailOtp(String email) async {
    await _dio.post('/auth/otp/email/request', data: {'email': email});
  }

  Future<Map<String, dynamic>> verifyEmailOtp(String email, String code) async {
    final resp = await _dio.post('/auth/otp/email/verify', data: {
      'email': email,
      'code': code,
    });
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<Map<String, dynamic>> loginById(
      String identifier, String idToken) async {
    final resp = await _dio.post('/auth/login-by-id', data: {
      'identifier': identifier,
      'idToken': idToken,
    });
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    await _dio.patch('/auth/me', data: data);
  }

  Future<List<Map<String, dynamic>>> getUsers({
    String? query,
    int limit = 20,
    int offset = 0,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/users',
      queryParameters: {
        'companyId': companyId,
        if (query != null && query.isNotEmpty) 'q': query,
        'limit': limit,
        'offset': offset,
      },
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
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

  Future<List<Map<String, dynamic>>> getSpaces() async {
    try {
      final resp = await _dio.get('/v2/spaces');
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        final resp = await _dio
            .get('/spaces', queryParameters: {'companyId': companyId});
        return List<Map<String, dynamic>>.from(
          (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      rethrow;
    }
  }

  /// Seguro contra 5xx
  Future<List<Map<String, dynamic>>> getChannels({String? spaceId}) async {
    final qp = <String, dynamic>{'companyId': companyId};
    if (spaceId != null && spaceId.isNotEmpty) {
      qp['spaceId'] = spaceId;
    }

    final resp = await _dio.get(
      '/v2/channels',
      queryParameters: qp,
      options: Options(validateStatus: (status) => true),
    );

    final code = resp.statusCode ?? 0;

    if (code >= 200 && code < 300) {
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    }

    if (code == 404) {
      final legacy = await _dio.get(
        '/channels',
        queryParameters: qp,
        options: Options(validateStatus: (s) => true),
      );
      final lcode = legacy.statusCode ?? 0;
      if (lcode >= 200 && lcode < 300) {
        return List<Map<String, dynamic>>.from(
          (legacy.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      debugPrint(
          '[ApiClient] getChannels legacy -> HTTP $lcode, retornando []');
      return const <Map<String, dynamic>>[];
    }

    debugPrint('[ApiClient] getChannels $qp -> HTTP $code, retornando []');
    return const <Map<String, dynamic>>[];
  }

  // -----
  // FEED v2
  // -----

  Future<MeFeedResponse> getMeFeed({
    String? spaceId,
    String? channelId,
    int? limit,
    String? cursor,
    CancelToken? cancelToken,
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
      options: Options(
        headers: _etagHeader(sinceEtag),
        validateStatus: (s) => s != null && (s == 304 || (s >= 200 && s < 300)),
      ),
      cancelToken: cancelToken,
    );

    if (resp.statusCode == 304) {
      return MeFeedResponse(
        items: const [],
        counters: FeedCounters(
          totalUnread: 0,
          bySpace: const {},
          byChannel: const {},
        ),
        nextCursor: null,
        etag: sinceEtag ?? '',
        serverTime: DateTime.now().toIso8601String(),
      );
    }

    final data = Map<String, dynamic>.from(resp.data as Map);
    return MeFeedResponse.fromJson(data);
  }

  // -----
  // NEWS
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

  void invalidateNewsCache(String id) {
    _cache.remove(_key('GET', '/v2/news/$id'));
    _cache.remove(_key('GET', '/news/$id'));
  }

  Future<Map<String, dynamic>> getNewsDetail(
    String id, {
    String? sinceEtag,
    CancelToken? cancelToken,
  }) async {
    try {
      final resp = await _coalescedGet(
        '/v2/news/$id',
        options: Options(
          headers: _etagHeader(sinceEtag),
          validateStatus: (s) =>
              s != null && (s == 304 || (s >= 200 && s < 300)),
        ),
        cancelToken: cancelToken,
        extraCacheKey: sinceEtag,
      );

      if (resp.statusCode == 304) {
        final k = _key('GET', '/v2/news/$id');
        final cached = _cache[k];
        if (cached != null) {
          return Map<String, dynamic>.from(cached.data as Map);
        }
      }

      final data = Map<String, dynamic>.from(resp.data as Map);
      final etag = resp.headers.value('etag');
      _cache[_key('GET', '/v2/news/$id')] = _CacheEntry(data, etag);
      return data;
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        final resp2 = await _dio.get('/news/$id', cancelToken: cancelToken);
        final data = Map<String, dynamic>.from(resp2.data as Map);
        _cache[_key('GET', '/news/$id')] =
            _CacheEntry(data, resp2.headers.value('etag'));
        return data;
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> toggleFavoriteNews(String id) async {
    final resp = await _dio.post('/v2/news/$id/favorite');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<Map<String, dynamic>> getFavoriteNews({
    int page = 1,
    int limit = 20,
  }) async {
    final resp = await _dio.get(
      '/v2/news/favorites',
      queryParameters: {'page': page, 'limit': limit},
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  // -----
  // INTERAÇÕES v2
  // -----

  Future<void> openNews(
    String newsId, {
    Map<String, dynamic>? meta,
    CancelToken? cancelToken,
  }) async {
    try {
      final r = await _dio.post(
        '/v2/news/$newsId/open',
        data: {
          'meta': meta ?? const {'origin': 'app'}
        },
        options:
            Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
        cancelToken: cancelToken,
      );
      if (kDebugMode) {
        debugPrint('[API.openNews] id=$newsId status=${r.statusCode}');
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        debugPrint(
            '[API.openNews] id=$newsId ERROR status=${e.response?.statusCode}');
      }
      rethrow;
    }
  }

  Future<void> ackNews(
    String newsId, {
    CancelToken? cancelToken,
  }) async {
    try {
      final r = await _dio.post(
        '/v2/news/$newsId/ack',
        options: Options(
            validateStatus: (s) =>
                s != null && (s >= 200 && s < 300 || s == 404)),
        cancelToken: cancelToken,
      );
      if (kDebugMode) {
        debugPrint('[API.ackNews] id=$newsId status=${r.statusCode}');
      }
      if (r.statusCode == 404) {
        final r2 = await _dio.post(
          '/news/$newsId/acknowledge',
          options: Options(
              validateStatus: (s) => s != null && (s >= 200 && s < 300)),
          cancelToken: cancelToken,
        );
        if (kDebugMode) {
          debugPrint(
              '[API.ackNews] legacy /news/$newsId/acknowledge status=${r2.statusCode}');
        }
      }
    } on DioException catch (e) {
      if (kDebugMode) {
        debugPrint(
            '[API.ackNews] id=$newsId ERROR status=${e.response?.statusCode}');
      }
      rethrow;
    }
  }

  Future<void> reactToNews(
    String newsId,
    String reaction, {
    CancelToken? cancelToken,
  }) async {
    final rj = reaction.toLowerCase().trim();
    try {
      final r = await _dio.post(
        '/v2/news/$newsId/react',
        data: {'reaction': rj},
        options: Options(
            validateStatus: (s) =>
                s != null && (s >= 200 && s < 300 || s == 404)),
        cancelToken: cancelToken,
      );
      if (r.statusCode == 404) {
        await _dio.post(
          '/news/$newsId/reactions',
          data: {'reaction': rj},
          options: Options(
              validateStatus: (s) => s != null && (s >= 200 && s < 300)),
          cancelToken: cancelToken,
        );
      }
    } on DioException {
      rethrow;
    }
  }

  Future<void> unreactToNews(
    String newsId, {
    CancelToken? cancelToken,
  }) async {
    try {
      final r = await _dio.post(
        '/v2/news/$newsId/unreact',
        options: Options(
            validateStatus: (s) =>
                s != null && (s >= 200 && s < 300 || s == 404)),
        cancelToken: cancelToken,
      );
      if (r.statusCode == 404) {
        await _dio.delete(
          '/news/$newsId/reactions',
          options: Options(
              validateStatus: (s) => s != null && (s >= 200 && s < 300)),
          cancelToken: cancelToken,
        );
      }
    } on DioException {
      rethrow;
    }
  }

  Future<void> commentNews(
    String newsId,
    String text, {
    CancelToken? cancelToken,
  }) async {
    await _dio.post(
      '/v2/news/$newsId/comments',
      data: {'text': text},
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
  }

  Future<void> shareNews(
    String newsId, {
    String? target,
    Map<String, dynamic>? meta,
    CancelToken? cancelToken,
  }) async {
    final body = <String, dynamic>{
      'channel': target,
      if (meta != null) ...meta
    };
    await _dio.post(
      '/v2/news/$newsId/share',
      data: body,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
  }

  Future<List<Map<String, dynamic>>> getReactors(
    String newsId, {
    int limit = 50,
    int offset = 0,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/v2/news/$newsId/reactors',
      queryParameters: {'limit': limit, 'offset': offset},
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getCommenters(
    String newsId, {
    int limit = 50,
    int offset = 0,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/v2/news/$newsId/commenters',
      queryParameters: {'limit': limit, 'offset': offset},
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getSharers(
    String newsId, {
    int limit = 50,
    int offset = 0,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/v2/news/$newsId/sharers',
      queryParameters: {'limit': limit, 'offset': offset},
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  // -------
  // SURVEYS
  // -------

  Future<List<Map<String, dynamic>>> getSurveys({
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/modules/$companyId/surveys',
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getSurveyDetail(
    String id, {
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/modules/$companyId/surveys/$id',
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<void> postSurveyResponse({
    required String surveyId,
    required List<Map<String, dynamic>> answers,
    String? userId,
    CancelToken? cancelToken,
  }) async {
    final body = <String, dynamic>{
      'surveyId': surveyId,
      'answers': answers,
      if (userId != null && userId.isNotEmpty) 'userId': userId,
    };
    await _dio.post(
      '/modules/$companyId/surveys/responses',
      data: body,
      options: Options(
        contentType: Headers.jsonContentType,
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
  }

  // ==========================
  // FORMS (NOVO MÓDULO)
  // ==========================

// 🔥 NOVO: Método para buscar histórico granular
  Future<List<Map<String, dynamic>>> getMyFormInteractions({
    int limit = 50,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/forms/my/interactions',
      queryParameters: {'limit': limit, 'companyId': companyId},
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  /// Badges dos formulários (azul/vermelho)
  Future<Map<String, dynamic>> getFormBadges() async {
    // ATUALIZADO: Rota do Blueprint S2
    final resp = await _dio.get(
      '/v2/forms/analytics/badges',
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
    );
    // O backend S2 retorna { totalNew, byForm }
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Lista formulários publicados (ou todos, conforme backend).
  Future<List<Map<String, dynamic>>> getForms({
    Map<String, dynamic>? queryParameters,
    CancelToken? cancelToken,
  }) async {
    final qp = <String, dynamic>{
      'companyId': companyId,
      if (queryParameters != null) ...queryParameters,
    };
    final resp = await _dio.get(
      '/forms',
      queryParameters: qp,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  /// Detalhe do formulário (inclui fields).
  Future<Map<String, dynamic>> getFormDetail(
    String id, {
    Map<String, dynamic>? queryParameters, // ATUALIZADO (Fase 3)
    CancelToken? cancelToken,
  }) async {
    final qp = <String, dynamic>{
      'companyId': companyId,
      if (queryParameters != null) ...queryParameters, // Passa 'locale'
    };
    final resp = await _dio.get(
      '/forms/$id',
      queryParameters: qp,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Envia submissão do formulário (usa o endpoint que VOCÊ tem).
  Future<Map<String, dynamic>> postFormSubmission(
    String formId, {
    required List<Map<String, dynamic>> answers,
    Map<String, dynamic>? meta,
    List<Map<String, dynamic>>? attachments,
    bool? external,
    String? externalEmail,
    List<String>? spaceIds,
    List<String>? groupIds,
    CancelToken? cancelToken,
  }) async {
    final body = <String, dynamic>{
      'answers': answers,
      if (meta != null) 'meta': meta,
      if (attachments != null) 'attachments': attachments,
      if (external != null) 'external': external,
      if (externalEmail != null) 'externalEmail': externalEmail,
      if (spaceIds != null) 'spaceIds': spaceIds,
      if (groupIds != null) 'groupIds': groupIds,
    };

    // 1) app: /forms/:id/submit
    try {
      final resp = await _dio.post(
        '/forms/$formId/submit',
        queryParameters: {'companyId': companyId},
        data: body,
        options:
            Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
        cancelToken: cancelToken,
      );
      return Map<String, dynamic>.from(resp.data as Map);
    } on DioException catch (e) {
      if (e.response?.statusCode != 404 &&
          e.response?.statusCode != 400 &&
          e.response?.statusCode != 403) {
        rethrow;
      }
    }

    // 2) alias: /forms/:id/submissions
    final resp = await _dio.post(
      '/forms/$formId/submissions',
      queryParameters: {'companyId': companyId},
      data: body,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Minhas submissões de formulário
  Future<Map<String, dynamic>> getMyFormSubmissions({
    int page = 1,
    int pageSize = 50,
    String? userId,
    String? locale, // ATUALIZADO (Fase 3)
    CancelToken? cancelToken,
  }) async {
    final qp = <String, dynamic>{
      'companyId': companyId,
      'page': page,
      'pageSize': pageSize,
      if (userId != null && userId.isNotEmpty) 'userId': userId,
      if (locale != null && locale.isNotEmpty)
        'locale': locale, // Passa o locale
    };

    // ATUALIZADO: Chama o endpoint /forms/:id/submissions
    // com o 'id' especial 'my'
    final resp = await _dio.get(
      '/forms/my/submissions',
      queryParameters: qp,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Detalhe de uma submissão específica
  Future<Map<String, dynamic>> getFormSubmissionDetail(
    String formId,
    String submissionId, {
    String? locale, // ATUALIZADO (Fase 3)
    CancelToken? cancelToken,
  }) async {
    final qp = <String, dynamic>{
      'companyId': companyId,
      if (locale != null && locale.isNotEmpty)
        'locale': locale, // Passa o locale
    };
    final resp = await _dio.get(
      '/forms/$formId/submissions/$submissionId',
      queryParameters: qp,
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );

    debugPrint('===== SUBMISSION DETAIL ($formId / $submissionId) =====');
    debugPrint(resp.data.toString());

    return Map<String, dynamic>.from(resp.data as Map);
  }

  // ==================================
  // NOVO (Fase 1 - Chat S3)
  // ==================================

  /// Busca o histórico de chat para uma submissão
  Future<Map<String, dynamic>> getFormChatHistory(
    String formId,
    String submissionId, {
    required String actor, // 'user' ou 'rh'
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/forms/$formId/submissions/$submissionId/chat',
      queryParameters: {
        'companyId': companyId,
        'actor': actor,
      },
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Envia uma mensagem no chat
  Future<Map<String, dynamic>> postFormChatMessage(
    String formId,
    String submissionId, {
    required Map<String, dynamic> payload, // { message, actor }
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.post(
      '/forms/$formId/submissions/$submissionId/chat',
      queryParameters: {'companyId': companyId},
      data: payload,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }
  // ==========================
  // JOURNEYS
  // ==========================

  Future<List<Map<String, dynamic>>> getJourneyProgress({
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/journeys/progress/me',
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getJourneyDetail(
    String id, {
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/journeys/$id',
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<void> completeJourneyStep(
    String journeyId,
    String stepId, {
    Map<String, dynamic>? data,
    CancelToken? cancelToken,
  }) async {
    await _dio.post(
      '/journeys/$journeyId/steps/$stepId/complete',
      data: data,
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
  }

  Future<Map<String, dynamic>> getJourneyStepDetail(
    String journeyId,
    String stepId, {
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/journeys/$journeyId/steps/$stepId',
      options: Options(
        validateStatus: (s) => s != null && (s >= 200 && s < 300),
      ),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  // ==========================
  // CHAT (Socket.io Helper / API)
  // ==========================

  Future<List<Map<String, dynamic>>> getChatConversations(
      {CancelToken? cancelToken}) async {
    try {
      final resp = await _dio.get('/chat/conversations');
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    } catch (e) {
      debugPrint('[ApiClient] getChatConversations error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> createDirectConversation(String userId) async {
    final resp = await _dio.post('/chat/conversations', data: {
      'participantIds': [userId]
    });
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<List<Map<String, dynamic>>> getChatMessages(
      String conversationId) async {
    final resp = await _dio.get('/chat/conversations/$conversationId/messages');
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getChatUnreadCount() async {
    try {
      final resp = await _dio.get('/chat/unread-count');
      return Map<String, dynamic>.from(resp.data);
    } catch (e) {
      debugPrint('Error getting unread count: $e');
      return {'total': 0, 'byConversation': {}};
    }
  }

  Future<String> uploadFileBytes(List<int> bytes, String filename) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: filename),
    });

    final resp = await _dio.post('/uploads/file',
        data: formData,
        options: Options(headers: {
          'Content-Type': 'multipart/form-data',
        }));
    return resp.data['url'] as String;
  }

  Future<List<Map<String, dynamic>>> getGroups(
      {CancelToken? cancelToken}) async {
    final resp = await _dio.get('/groups',
        queryParameters: {'companyId': companyId},
        options:
            Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
        cancelToken: cancelToken);
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }
  // ---------------------------
  // CHAT (API Parity)
  // ---------------------------

  Future<Map<String, dynamic>> getUnreadCount() async {
    try {
      final resp = await _dio.get('/chat/unread-count');
      return Map<String, dynamic>.from(resp.data as Map);
    } catch (_) {
      return {'total': 0, 'byConversation': {}};
    }
  }

  Future<String> uploadChatFile(List<int> bytes, String fileName) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
    });
    final resp = await _dio.post('/uploads/chat', data: formData);
    // Assuming backend returns { url: ... }
    return resp.data['url'] as String;
  }

  Future<Map<String, dynamic>> getSocialFeed({
    int page = 1,
    int limit = 20,
    List<String>? channelIds,
    CancelToken? cancelToken,
  }) async {
    final qp = {
      'page': page,
      'limit': limit,
      if (channelIds != null && channelIds.isNotEmpty)
        'channelIds': channelIds.join(','),
      'companyId': companyId,
    };
    final resp = await _dio.get(
      '/social/feed',
      queryParameters: qp,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  // Admin Methods
  Future<void> addParticipant(String conversationId, String userId) async {
    await _dio.post(
      '/chat/conversations/$conversationId/participants',
      data: {'userId': userId},
    );
  }

  Future<void> promoteParticipant(String conversationId, String userId) async {
    await _dio.post(
        '/chat/conversations/$conversationId/participants/$userId/promote');
  }

  Future<void> removeParticipant(String conversationId, String userId) async {
    await _dio.post(
        '/chat/conversations/$conversationId/participants/$userId/remove');
  }

  Future<void> clearChatHistory(String conversationId) async {
    await _dio.post('/chat/conversations/$conversationId/clear');
  }

  Future<void> markChatAsRead(String conversationId) async {
    await _dio.post('/chat/conversations/$conversationId/mark-read');
  }

  Future<void> deleteMessage(String messageId,
      {bool forEveryone = true}) async {
    final mode = forEveryone ? 'all' : 'me';
    await _dio.delete('/chat/messages/$messageId?for=$mode');
  }

  // ==========================
  // SOCIAL & UPLOADS
  // ==========================

  Future<Map<String, dynamic>> createSocialPost({
    required String channelId,
    required String content,
    List<Map<String, dynamic>>? media,
    CancelToken? cancelToken,
  }) async {
    final body = {
      'channelId': channelId,
      'content': content,
      if (media != null) 'media': media,
    };
    final resp = await _dio.post(
      '/social/posts',
      // API expects companyId via header, but just in case query
      queryParameters: {'companyId': companyId},
      data: body,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<String> uploadFile(
    String filePath, {
    String? type, // 'image', 'video'
    CancelToken? cancelToken,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });

    final resp = await _dio.post(
      '/uploads/file',
      data: formData,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );

    // Response expected: { url: "..." }
    return resp.data['url'] as String;
  }

  Future<Map<String, dynamic>> getMessageInfo(String messageId) async {
    final response = await _coalescedGet('/chat/messages/$messageId/info');
    return response.data;
  }
}
