// lib/core/providers.dart
import 'dart:async';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../app/theme/theme.dart';
import '../data/local/app_database.dart';
import '../data/remote/api_client.dart';
import '../features/news/local_news_store.dart';
import '../features/surveys/local_survey_store.dart';
import '../push_service.dart';
import '../features/forms/providers/forms_provider.dart';
// 🔥 IMPORT NOVO
import '../features/forms/local_form_store.dart';

/// =============== NAV KEY (compartilhado) ===============
final rootNavigatorKeyProvider =
    Provider<GlobalKey<NavigatorState>>((ref) => GlobalKey<NavigatorState>());

/// ================= ENV =================
final envProvider = Provider<EnvConfig>((ref) {
  return const EnvConfig(
    apiBaseUrl: AppEnv.apiBaseUrl,
    appScheme: AppEnv.appScheme,
    companyId: AppEnv.companyId,
    companyKey: AppEnv.companyKey,
    appName: AppEnv.appName,
  );
});

final apiBaseUrlProvider =
    Provider<String>((ref) => ref.watch(envProvider).apiBaseUrl);

/// ================= DB =================
final dbProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

/// ================= AUTH =================
class AuthState {
  final String? accessToken;
  final String? userName;
  const AuthState({this.accessToken, this.userName});
  AuthState copyWith({String? accessToken, String? userName}) => AuthState(
        accessToken: accessToken ?? this.accessToken,
        userName: userName ?? this.userName,
      );
}

class AuthController extends StateNotifier<AuthState> {
  final Dio _authDio;
  final CookieJar _cookieJar;

  AuthController(this._authDio, this._cookieJar) : super(const AuthState()) {
    _authDio.interceptors.add(CookieManager(_cookieJar));
  }

  final _ctrl = StreamController<AuthState>.broadcast();
  Stream<AuthState> get stream => _ctrl.stream;

  Future<void> login(String email, String password) async {
    final resp = await _authDio
        .post('/auth/login', data: {'email': email, 'password': password});
    final token = (resp.data is Map && resp.data['accessToken'] != null)
        ? resp.data['accessToken'] as String
        : '';
    state = AuthState(accessToken: token, userName: email.split('@').first);
    _ctrl.add(state);
  }

  void setAccessToken(String? token) {
    state = state.copyWith(accessToken: token ?? '');
    _ctrl.add(state);
  }

  Future<void> logout() async {
    state = const AuthState();
    try {
      await _cookieJar.deleteAll();
    } catch (_) {}
    _ctrl.add(state);
  }

  @override
  void dispose() {
    _ctrl.close();
    super.dispose();
  }
}

final cookieJarProvider = Provider<CookieJar>((ref) {
  throw StateError('cookieJarProvider deve ser sobrescrito no main.dart');
});

final dioProvider = Provider<Dio>((ref) {
  final env = ref.watch(envProvider);
  final auth = ref.watch(authControllerProvider);
  final jar = ref.watch(cookieJarProvider);
  final navKey = ref.watch(rootNavigatorKeyProvider);

  final dio = Dio(BaseOptions(
    baseUrl: env.apiBaseUrl,
    headers: {'Accept': 'application/json'},
  ));

  dio.interceptors.add(CookieManager(jar));

  dio.interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
    final token = auth.accessToken;
    if (token != null && token.isNotEmpty) {
      o.headers['Authorization'] = 'Bearer $token';
    }
    h.next(o);
  }));

  Completer<String?>? _refreshing;

  final refreshDio = Dio(BaseOptions(
    baseUrl: env.apiBaseUrl,
    headers: {'Accept': 'application/json'},
  ))
    ..interceptors.add(CookieManager(jar));

  Future<String?> _doRefresh() async {
    try {
      final r = await refreshDio.post('/auth/refresh');
      final newToken = (r.data is Map && r.data['accessToken'] != null)
          ? '${r.data['accessToken']}'
          : '';
      if (newToken.isEmpty) return null;
      ref.read(authControllerProvider.notifier).setAccessToken(newToken);
      debugPrint('[AUTH] refresh OK');
      return newToken;
    } catch (e) {
      debugPrint('[AUTH] refresh FAILED: $e');
      return null;
    }
  }

  Future<Response> _retry(Dio client, RequestOptions ro) {
    return client.request(
      ro.path,
      data: ro.data,
      queryParameters: ro.queryParameters,
      options: Options(
        method: ro.method,
        headers: ro.headers,
        responseType: ro.responseType,
        contentType: ro.contentType,
        followRedirects: ro.followRedirects,
        listFormat: ro.listFormat,
        receiveTimeout: ro.receiveTimeout,
        sendTimeout: ro.sendTimeout,
        validateStatus: ro.validateStatus,
      ),
      cancelToken: ro.cancelToken,
      onReceiveProgress: ro.onReceiveProgress,
      onSendProgress: ro.onSendProgress,
    );
  }

  dio.interceptors.add(InterceptorsWrapper(onError: (err, handler) async {
    final status = err.response?.statusCode ?? 0;
    final path = err.requestOptions.path;
    final isAuth = path.startsWith('/auth/login') ||
        path.startsWith('/auth/refresh') ||
        path.startsWith('/auth/logout');
    final retried = err.requestOptions.extra['__ret'] == true;

    if (status == 401 && !isAuth && !retried) {
      if (_refreshing == null) {
        _refreshing = Completer<String?>();
        _refreshing!.complete(await _doRefresh());
      }
      final newTok = await _refreshing!.future;
      _refreshing = null;

      if (newTok != null && newTok.isNotEmpty) {
        err.requestOptions.extra['__ret'] = true;
        try {
          final resp = await _retry(dio, err.requestOptions);
          return handler.resolve(resp);
        } catch (_) {}
      }

      await ref.read(authControllerProvider.notifier).logout();

      final ctx = navKey.currentContext;
      if (ctx != null) {
        ScaffoldMessenger.of(ctx).clearSnackBars();
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(
              content: Text('Sessão expirada. Faça login novamente.')),
        );

        final router = GoRouter.of(ctx);
        final routeInfo = router.routeInformationProvider.value;
        final currentLocation = (routeInfo.location ?? '/home');
        final from = Uri.encodeComponent(currentLocation);
        final target = currentLocation.startsWith('/login')
            ? '/login'
            : '/login?from=$from';

        router.go(target);
      }
      return;
    }
    return handler.next(err);
  }));

  return dio;
});

/// ================= LOCAL STORES =================
final localSurveyStoreProvider =
    Provider<LocalSurveyStore>((ref) => LocalSurveyStore());
final localNewsStoreProvider =
    Provider<LocalNewsStore>((ref) => LocalNewsStore());

// 🔥 NOVO: Store de Formulários Vistos
final localFormStoreProvider =
    Provider<LocalFormStore>((ref) => LocalFormStore());
// 🔥 NOVO: Gatilho de atualização visual ao marcar como visto
final formsSeenVersionProvider = StateProvider<int>((_) => 0);

final newsSeenVersionProvider = StateProvider<int>((_) => 0);
final feedVersionProvider = StateProvider<int>((_) => 0);

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final env = ref.watch(envProvider);
  final jar = ref.watch(cookieJarProvider);
  final dio = Dio(BaseOptions(
    baseUrl: env.apiBaseUrl,
    headers: {'Accept': 'application/json'},
  ))
    ..interceptors.add(CookieManager(jar))
    ..interceptors.add(LogInterceptor(
      request: true,
      requestBody: true,
      error: true,
      responseBody: false,
      logPrint: (o) => debugPrint('[AUTH DIO] $o'),
    ));
  return AuthController(dio, jar);
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = ref.watch(dioProvider);
  final env = ref.watch(envProvider);
  return ApiClient(dio, env.companyId);
});

/// ================= USER PROFILE =================
class UserProfile {
  final String? id;
  final String? email;
  final String? name;
  final String? displayName;
  final Set<String> groups;

  const UserProfile({
    this.id,
    this.email,
    this.name,
    this.displayName,
    required this.groups,
  });

  factory UserProfile.fromJson(Map<String, dynamic> j) {
    List<String> _toStrList(dynamic v) {
      if (v == null) return const [];
      if (v is List) return v.map((e) => '$e').toList();
      return const [];
    }

    final g = <String>{
      ..._toStrList(j['groups']),
      ..._toStrList(j['visibleGroups']),
    }..removeWhere((e) => e.trim().isEmpty);
    return UserProfile(
      id: j['id']?.toString(),
      email: j['email']?.toString(),
      name: j['name']?.toString(),
      displayName: j['displayName']?.toString(),
      groups: g,
    );
  }
}

final userProfileProvider = FutureProvider<UserProfile?>((ref) async {
  final token = ref.watch(authControllerProvider).accessToken;
  if (token == null || token.isEmpty) return null;
  final api = ref.read(apiClientProvider);
  try {
    final raw = await api.getMe();
    if (raw.isEmpty) return null;
    return UserProfile.fromJson(raw);
  } catch (_) {
    return null;
  }
});

final userGroupsProvider = Provider<Set<String>>((ref) {
  final me = ref.watch(userProfileProvider).maybeWhen(
        data: (u) => u?.groups ?? const <String>{},
        orElse: () => const <String>{},
      );
  return me;
});

bool _isVisibleForGroups(Map item, Set<String> userGroups) {
  Iterable<String> _extract(dynamic v) {
    if (v == null) return const <String>[];
    if (v is List) return v.map((e) => '$e');
    return const <String>[];
  }

  final req = <String>{
    ..._extract(item['visibleGroups']),
    ..._extract(item['groups']),
    ..._extract(item['visibleGroupIds']),
  }..removeWhere((e) => e.trim().isEmpty);
  if (req.isEmpty) return true;
  return req.any(userGroups.contains);
}

/// ================= SETTINGS + THEME =================
class CompanyBranding {
  final String? logoUrl;
  final String appTitle;
  final String appSubtitle;
  final int primary;
  final int background;
  final int textOnBackground;
  CompanyBranding({
    this.logoUrl,
    required this.appTitle,
    required this.appSubtitle,
    required this.primary,
    required this.background,
    required this.textOnBackground,
  });
  factory CompanyBranding.fromJson(Map<String, dynamic> j) => CompanyBranding(
        logoUrl: j['logoUrl'] as String?,
        appTitle: j['appTitle'] ?? 'Iuppy',
        appSubtitle: j['appSubtitle'] ?? 'Comunicação Inteligente',
        primary: _toIntColor(j['primary']) ?? 0xFF22B4FF,
        background: _toIntColor(j['background']) ?? 0xFFF5F7FB,
        textOnBackground: _toIntColor(j['textOnBackground']) ?? 0xFF0A0E48,
      );
  static int? _toIntColor(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is String) {
      String s = v;
      if (s.startsWith('#')) s = s.substring(1);
      return int.tryParse('FF${s.toUpperCase()}', radix: 16);
    }
    return null;
  }
}

class CompanySettingsState {
  final CompanyBranding branding;
  final Set<String> enabledModules;
  CompanySettingsState(this.branding, this.enabledModules);
}

final companySettingsProvider =
    FutureProvider<CompanySettingsState>((ref) async {
  final api = ref.read(apiClientProvider);
  final settings = await api.getCompanySettings();
  final modules = await api.getCompanyModules();
  final branding = CompanyBranding.fromJson(settings['branding'] ?? {});
  final enabled = modules
      .where((m) => (m['enabled'] ?? false) == true)
      .map((m) => m['key'].toString())
      .toSet();
  final theme = buildThemes(
    BrandingColors(
      primary: Color(branding.primary),
      background: Color(branding.background),
      textOnBackground: Color(branding.textOnBackground),
    ),
  );
  ref.read(appThemeProvider.notifier).state = theme;
  return CompanySettingsState(branding, enabled);
});

final appThemeProvider = StateProvider<AppThemePair>((ref) {
  return buildThemes(
    BrandingColors(
      primary: const Color(0xFF22B4FF),
      background: const Color(0xFFF5F7FB),
      textOnBackground: const Color(0xFF090E48),
    ),
  );
});

/// ================= REPOSITORIES =================
final spacesRepoProvider = Provider((ref) => SpacesRepo(ref));
final channelsRepoProvider = Provider((ref) => ChannelsRepo(ref));
final newsRepoProvider = Provider((ref) => NewsRepo(ref));
final surveysRepoProvider = Provider((ref) => SurveysRepo(ref));

class SpacesRepo {
  final Ref ref;
  SpacesRepo(this.ref);
  Future<List<Map<String, dynamic>>> fetchAndCache() async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final list = await api.getSpaces();
    await db.cacheSpaces(list);
    return list;
  }

  Future<List<Map<String, dynamic>>> getCached() =>
      ref.read(dbProvider).getSpaces();
}

class ChannelsRepo {
  final Ref ref;
  ChannelsRepo(this.ref);
  Future<List<Map<String, dynamic>>> fetchAndCache({String? spaceId}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final userGroups = ref.read(userGroupsProvider);
    final list = await api.getChannels(spaceId: spaceId);
    final filtered =
        list.where((c) => _isVisibleForGroups(c, userGroups)).toList();
    await db.cacheChannels(filtered);
    return filtered;
  }

  Future<List<Map<String, dynamic>>> getCached({String? spaceId}) =>
      ref.read(dbProvider).getChannels(spaceId: spaceId);
}

class NewsRepo {
  final Ref ref;
  NewsRepo(this.ref);
  static const _fallbackThumb =
      'https://iuppy.com.br/wp-content/uploads/2025/05/automacao-fluxos-1.png';
  Map<String, dynamic> _normalize(
      Map raw,
      String baseUrl,
      Map<String, Map<String, dynamic>> channelById,
      Map<String, String> spaceNameById) {
    final m = Map<String, dynamic>.from(raw);
    final imgsDyn = (m['highlightImages'] as List?) ?? const [];
    final imgs = <String>[];
    for (final e in imgsDyn) {
      final url = (e is Map ? e['url'] : e)?.toString() ?? '';
      if (url.startsWith('http')) imgs.add(url);
    }
    if (imgs.isEmpty) imgs.add(_fallbackThumb);
    m['highlightImages'] = imgs;
    final attsDyn = (m['attachments'] as List?) ?? const [];
    final atts = <String>[];
    for (final e in attsDyn) {
      final url = (e is Map ? e['url'] : e)?.toString() ?? '';
      if (url.startsWith('http')) atts.add(url);
    }
    m['attachments'] = atts;
    final channelId = (m['channelId'] ?? '').toString();
    final ch = channelById[channelId];
    if (ch != null) {
      m['channelName'] = (ch['name'] ?? '').toString();
      final spId = (ch['spaceId'] ?? '').toString();
      m['spaceId'] = spId;
      m['spaceName'] = spaceNameById[spId] ?? '';
    } else {
      m['channelName'] = (m['channelName'] ?? '').toString();
      m['spaceId'] = (m['spaceId'] ?? '').toString();
      m['spaceName'] = (m['spaceName'] ?? '').toString();
    }
    return m;
  }

  Future<Map<String, Map<String, dynamic>>> _channelsById() async {
    final channels = await ref.read(channelsRepoProvider).getCached();
    return {
      for (final c in channels)
        (c['id'] ?? '').toString(): Map<String, dynamic>.from(c)
    };
  }

  Future<Map<String, String>> _spacesNameById() async {
    final spaces = await ref.read(spacesRepoProvider).getCached();
    return {
      for (final s in spaces)
        (s['id'] ?? '').toString(): (s['name'] ?? '').toString()
    };
  }

  static DateTime? _parseDate(dynamic v) {
    if (v == null) return null;
    try {
      return DateTime.tryParse(v.toString());
    } catch (_) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> listByChannel(String channelId) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final base = ref.read(apiBaseUrlProvider);
    try {
      final remote = await api.getNewsByChannel(channelId);
      final channelsMap = await _channelsById();
      final spacesMap = await _spacesNameById();
      final filtered = remote
          .where((n) => (n['isPublished'] ?? false) == true)
          .where(
              (n) => channelsMap.containsKey((n['channelId'] ?? '').toString()))
          .map((n) => _normalize(n, base, channelsMap, spacesMap))
          .toList();
      await db.cacheNews(filtered);
      return filtered;
    } catch (_) {
      final cached = await db.getNews();
      return cached
          .map((e) => Map<String, dynamic>.from(e))
          .where((n) =>
              (n['channelId']?.toString() ?? '') == channelId &&
              (n['isPublished'] ?? false) == true)
          .toList();
    }
  }

  Future<List<Map<String, dynamic>>> listLatest({int limit = 10}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final base = ref.read(apiBaseUrlProvider);
    try {
      final remote = await api.getNews();
      final channelsMap = await _channelsById();
      final spacesMap = await _spacesNameById();
      final visible = remote
          .where((n) => (n['isPublished'] ?? false) == true)
          .where(
              (n) => channelsMap.containsKey((n['channelId'] ?? '').toString()))
          .map((n) => _normalize(n, base, channelsMap, spacesMap))
          .toList();
      visible.sort((a, b) {
        final da = _parseDate(a['updatedAt']) ??
            _parseDate(a['createdAt']) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        final dbb = _parseDate(b['updatedAt']) ??
            _parseDate(b['createdAt']) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        return dbb.compareTo(da);
      });
      await db.cacheNews(visible);
      return (limit > 0 && visible.length > limit)
          ? visible.take(limit).toList()
          : visible;
    } catch (_) {
      final cached =
          (limit > 0) ? await db.getNews(limit: limit) : await db.getNews();
      final filtered = cached
          .map((e) => Map<String, dynamic>.from(e))
          .where((n) => (n['isPublished'] ?? false) == true)
          .toList();
      filtered.sort((a, b) {
        final da = _parseDate(a['updatedAt']) ??
            _parseDate(a['createdAt']) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        final dbb = _parseDate(b['updatedAt']) ??
            _parseDate(b['createdAt']) ??
            DateTime.fromMillisecondsSinceEpoch(0);
        return dbb.compareTo(da);
      });
      return (limit > 0 && filtered.length > limit)
          ? filtered.take(limit).toList()
          : filtered;
    }
  }

  Future<List<Map<String, dynamic>>> homeFeedRemoteFirst(
      {String? spaceId, int limit = 10, int? maxItems}) async {
    final cap = (maxItems != null && maxItems > 0) ? maxItems : limit;
    final all = await listLatest(limit: 0);
    final filtered = (spaceId == null || spaceId.isEmpty)
        ? all
        : all.where((n) => (n['spaceId'] ?? '').toString() == spaceId).toList();
    return (cap > 0 && filtered.length > cap)
        ? filtered.take(cap).toList()
        : filtered;
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final api = ref.read(apiClientProvider);
    final base = ref.read(apiBaseUrlProvider);
    try {
      final n = await api.getNewsDetail(id);
      final channelsMap = await _channelsById();
      final spacesMap = await _spacesNameById();
      return _normalize(n, base, channelsMap, spacesMap);
    } catch (_) {
      final cached = await ref.read(dbProvider).getNews();
      return cached.map((e) => Map<String, dynamic>.from(e)).firstWhere(
          (e) => (e['id'] ?? '').toString() == id,
          orElse: () => <String, dynamic>{});
    }
  }

  Future<UnreadCounters> unreadCounters() async {
    final db = ref.read(dbProvider);
    final store = ref.read(localNewsStoreProvider);
    final visibleChannels = await ref.read(channelsRepoProvider).getCached();
    final visibleChannelIds =
        visibleChannels.map((c) => (c['id'] ?? '').toString()).toSet();
    final all = await db.getNews(limit: 1000);
    final news = all
        .map((e) => Map<String, dynamic>.from(e))
        .where((n) => (n['isPublished'] ?? true) == true)
        .where((n) =>
            visibleChannelIds.contains((n['channelId'] ?? '').toString()))
        .toList();
    final total =
        await store.countUnread(news.map((n) => (n['id'] ?? '').toString()));
    final bySpace = await store.countUnreadByKey(news, 'spaceId');
    final byChannel = await store.countUnreadByKey(news, 'channelId');
    return UnreadCounters(total: total, bySpace: bySpace, byChannel: byChannel);
  }
}

class UnreadCounters {
  final int total;
  final Map<String, int> bySpace;
  final Map<String, int> byChannel;
  const UnreadCounters(
      {required this.total, required this.bySpace, required this.byChannel});
}

class SurveysRepo {
  final Ref ref;
  SurveysRepo(this.ref);
  bool _isVisible(Map<String, dynamic> s) {
    final status = (s['status'] ?? '').toString().toLowerCase();
    if (status != 'published' && status != 'active') return false;
    final schedule = (s['scheduleSurvey'] ?? false) == true;
    final expire = (s['expireSurvey'] ?? false) == true;
    DateTime? startsAt;
    DateTime? endsAt;
    try {
      final sa = s['startsAt']?.toString();
      if (sa != null && sa.isNotEmpty) startsAt = DateTime.tryParse(sa);
      final ea = s['endsAt']?.toString();
      if (ea != null && ea.isNotEmpty) endsAt = DateTime.tryParse(ea);
    } catch (_) {}
    final now = DateTime.now().toUtc();
    if (schedule && startsAt != null && startsAt.isAfter(now)) return false;
    if (expire && endsAt != null && endsAt.isBefore(now)) return false;
    return true;
  }

  Future<List<Map<String, dynamic>>> list({int limit = 3}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    try {
      final remote = await api.getSurveys();
      final filtered = remote.where(_isVisible).toList();
      await db.cacheSurveys(filtered);
      return (limit > 0 && filtered.length > limit)
          ? filtered.take(limit).toList()
          : filtered;
    } catch (_) {
      final cached = (limit > 0)
          ? await db.getSurveys(limit: limit)
          : await db.getSurveys();
      final filtered = cached.where(_isVisible).toList();
      return (limit > 0 && filtered.length > limit)
          ? filtered.take(limit).toList()
          : filtered;
    }
  }

  Future<Map<String, dynamic>> getById(String id) =>
      ref.read(apiClientProvider).getSurveyDetail(id);
  Future<void> sendResponse(
          {required String surveyId,
          required List<Map<String, dynamic>> answers,
          String? userId}) =>
      ref.read(apiClientProvider).postSurveyResponse(
          surveyId: surveyId, answers: answers, userId: userId);
}

// ====================================================
// 🔥 PROVIDER DE NOVOS FORMULÁRIOS (Para aba Disponíveis)
// ====================================================
final newFormsCountProvider = FutureProvider.autoDispose<int>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  // Assiste mudanças na lista de IDs vistos
  ref.watch(formsSeenVersionProvider);

  // Pega lista de formulários disponíveis
  final visibleForms = await ref.watch(formsListProvider.future);
  // Pega lista de IDs já vistos
  final seenIds = await ref.read(localFormStoreProvider).getSeenIds();

  final now = DateTime.now();
  final threeDaysAgo = now.subtract(const Duration(days: 3));

  int count = 0;
  for (final f in visibleForms) {
    final pid = f['id']?.toString() ?? '';
    // Se já viu, ignora
    if (seenIds.contains(pid)) continue;

    // Se for recente (< 3 dias), conta
    final pubStr = f['publishedAt']?.toString();
    if (pubStr != null) {
      final pubDate = DateTime.tryParse(pubStr);
      if (pubDate != null && pubDate.isAfter(threeDaysAgo)) {
        count++;
      }
    }
  }
  return count;
});

// ====================================================
// 🔥 BADGE GLOBAL (Sininho/Menu)
// ====================================================
final formsBadgesProvider = FutureProvider<int>((ref) async {
  // 1. Novos Formulários (Aba Disponíveis)
  final newForms = await ref.watch(newFormsCountProvider.future);

  // 2. Respostas Não Lidas (Aba Minhas Respostas)
  final unreadReplies = await ref.watch(userFormsUnreadCountProvider.future);

  return newForms + unreadReplies;
});

/// ===== Home badges =====
class HomeBadges {
  final int newsNew;
  final int formsNew;
  final int surveysPending;
  const HomeBadges(
      {this.newsNew = 0, this.formsNew = 0, this.surveysPending = 0});
}

final homeBadgesProvider = Provider<HomeBadges>((ref) {
  final counters = ref.watch(unreadCountersProvider);
  final newsNew = counters.maybeWhen(data: (d) => d.total, orElse: () => 0);

  final formsNew =
      ref.watch(formsBadgesProvider).maybeWhen(data: (v) => v, orElse: () => 0);

  final surveysPending = 0;

  return HomeBadges(
      newsNew: newsNew, formsNew: formsNew, surveysPending: surveysPending);
});

final unreadCountersProvider = FutureProvider<UnreadCounters>((ref) async {
  ref.watch(newsSeenVersionProvider);
  return ref.read(newsRepoProvider).unreadCounters();
});

final homeFeedProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String?>(
        (ref, String? spaceId) async {
  ref.watch(feedVersionProvider);
  return ref.read(newsRepoProvider).homeFeedRemoteFirst(spaceId: spaceId);
});

/// ========= PUSH BOOTSTRAP =========
/// Observa (1) o token de backend pra manter o Bearer no PushService
/// e (2) o /auth/me pra registrar o FCM assim que o usuário estiver resolvido.
/// (3) Registra o listener para atualizar Badges em tempo real.
final pushBootstrapProvider = Provider<void>((ref) {
  // 1) Sincroniza token Auth
  ref.listen<AuthState>(authControllerProvider, (prev, next) async {
    final tok = next.accessToken;
    await PushService.instance.init();
    PushService.instance.updateBackendAuthToken(tok);
  });

  // 2) Registra FCM ao logar
  ref.listen<AsyncValue<UserProfile?>>(userProfileProvider, (prev, next) async {
    if (!next.hasValue) return;
    final me = next.value;
    if (me?.id == null || me!.id!.isEmpty) return;

    final env = ref.read(envProvider);
    final auth = ref.read(authControllerProvider);

    await PushService.instance.init();
    PushService.instance.updateBackendAuthToken(auth.accessToken);

    // 🔥 NOVO: Registra o handler de refresh global
    PushService.instance.setNotificationRefreshHandler(() {
      debugPrint('[BOOTSTRAP] Push recebido! Atualizando badges e listas...');

      // 1. Invalida Badge Global e News
      ref.invalidate(unreadCountersProvider);
      ref.invalidate(formsBadgesProvider);
      ref.invalidate(newFormsCountProvider);
      ref.invalidate(userFormsUnreadCountProvider);

      // 2. Invalida Listas (Para aparecer o item novo ou mudar status)
      ref.invalidate(formsListProvider);
      ref.invalidate(myFormsSubmissionsProvider);
      ref.invalidate(homeFeedProvider);

      // 3. Opcional: Bump versão do feed se necessário
      // ref.read(feedVersionProvider.notifier).state++;
    });

    await PushService.instance.askPermissionAndRegister(
      userId: me.id!,
      companyId: env.companyId,
      apiBaseUrl: env.apiBaseUrl,
      accessToken: auth.accessToken,
      appVersion: null,
      locale: null,
    );
  });
});

/// ========= Utils =========
class AppEnv {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL',
      defaultValue: 'http://10.0.2.2:4000');
  static const appScheme =
      String.fromEnvironment('APP_SCHEME', defaultValue: 'iuppy');
  static const companyId =
      String.fromEnvironment('COMPANY_ID', defaultValue: '');
  static const companyKey =
      String.fromEnvironment('COMPANY_KEY', defaultValue: '');
  static const appName =
      String.fromEnvironment('APP_NAME', defaultValue: 'Iuppy');
}

class EnvConfig {
  final String apiBaseUrl;
  final String appScheme;
  final String companyId;
  final String companyKey;
  final String appName;
  const EnvConfig(
      {required this.apiBaseUrl,
      required this.appScheme,
      required this.companyId,
      required this.companyKey,
      required this.appName});
}
