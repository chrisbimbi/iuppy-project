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
        buf.write('&${k}=${qp[k]}');
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
    // If a CancelToken is provided, do NOT coalesce to avoid one consumer
    // cancelling a shared request for others.
    final Options resolved = options ?? Options();
    resolved.validateStatus ??=
        (s) => s != null && (s == 304 || (s >= 200 && s < 300));

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
    if (kDebugMode) {
      _dio.interceptors.removeWhere((i) => i is LogInterceptor);
      _dio.interceptors.add(
        LogInterceptor(
          request: true,
          requestHeader: false,
          requestBody: true,
          responseHeader: false,
          responseBody: false,
          // Evita despejar exceptions no console quando tratamos 5xx manualmente
          error: false,
          logPrint: (o) => debugPrint('[DIO] $o'),
        ),
      );
      debugPrint('[ApiClient] companyId=$companyId');
    }
  }

  /// Exponibiliza o baseUrl para normalização de URLs no app.
  String get baseUrl => _dio.options.baseUrl;

  // Opcional (com o interceptor nem precisa usar)
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

  /// Seguro contra 5xx: não deixa o Dio lançar exceção (validateStatus: true)
  /// e decide o fallback manualmente.
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

    // 2xx: OK
    if (code >= 200 && code < 300) {
      return List<Map<String, dynamic>>.from(
        (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
      );
    }

    // 404 -> tenta rota legacy
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

    // 5xx (ou qualquer outro código fora dos tratáveis) -> retorna vazio
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
  // NEWS (legacy ainda usada em alguns lugares)
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
        // <— conforme combinado: meta dentro do body
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
        // fallback legado
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
    // no backend, channel undefined => 'external'
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

  // “VER MAIS” LISTAS
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
  // SURVEYS (restaurados)
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

  /// Lista formulários publicados (ou todos, conforme backend).
  Future<List<Map<String, dynamic>>> getForms({
    Map<String, dynamic>? queryParameters,
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/forms',
      queryParameters: queryParameters,
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
    CancelToken? cancelToken,
  }) async {
    final resp = await _dio.get(
      '/forms/$id',
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// Envia submissão do formulário.
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
    final resp = await _dio.post(
      '/forms/$formId/submissions',
      data: body,
      options:
          Options(validateStatus: (s) => s != null && (s >= 200 && s < 300)),
      cancelToken: cancelToken,
    );
    return Map<String, dynamic>.from(resp.data as Map);
  }
}
