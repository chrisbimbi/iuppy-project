// lib/core/providers.dart
import 'dart:async';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/surveys/survey_providers.dart';

import '../app/theme/theme.dart';
import '../data/local/app_database.dart';
import '../data/remote/api_client.dart';
import '../features/news/local_news_store.dart';
import '../features/surveys/local_survey_store.dart';
import '../push_service.dart';
import '../features/forms/providers/forms_provider.dart';
import '../features/forms/local_form_store.dart';

/// =============== NAV KEY ===============
final rootNavigatorKeyProvider =
    Provider<GlobalKey<NavigatorState>>((ref) => GlobalKey<NavigatorState>());

/// ================= ENV =================
final envProvider = Provider<EnvConfig>((ref) {
  var baseUrl = AppEnv.apiBaseUrl;

  // 🔥 AUTO-FIX: Se for Web ou iOS e estiver apontando para 10.0.2.2 (Android Emulator), troca para localhost
  if ((kIsWeb || (Platform.isIOS && !kIsWeb)) && baseUrl.contains('10.0.2.2')) {
    baseUrl = baseUrl.replaceFirst('10.0.2.2', 'localhost');
  }

  var cid = AppEnv.companyId;
  if (cid.isEmpty) {
    debugPrint('⚠️ [EnvProvider] COMPANY_ID is empty! Using fallback.');
    cid = '000c0911-58b3-4c80-84bc-fe015eec1961';
  }

  return EnvConfig(
    apiBaseUrl: baseUrl,
    appScheme: AppEnv.appScheme,
    companyId: cid,
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
  final SharedPreferences _prefs;

  static const _tokenKey = 'auth_access_token';

  AuthController(this._authDio, this._cookieJar, this._prefs)
      : super(const AuthState()) {
    if (!kIsWeb) {
      _authDio.interceptors.add(CookieManager(_cookieJar));
    }
    _restoreToken();
  }

  void _restoreToken() {
    final savedToken = _prefs.getString(_tokenKey);
    if (savedToken != null && savedToken.isNotEmpty) {
      state = state.copyWith(accessToken: savedToken);
    }
  }

  final _ctrl = StreamController<AuthState>.broadcast();
  @override
  Stream<AuthState> get stream => _ctrl.stream;

  Future<void> login(String email, String password) async {
    final resp = await _authDio
        .post('/auth/login', data: {'email': email, 'password': password});
    final token = (resp.data is Map && resp.data['accessToken'] != null)
        ? resp.data['accessToken'] as String
        : '';

    if (token.isNotEmpty) {
      await _prefs.setString(_tokenKey, token);
    }

    state = AuthState(accessToken: token, userName: email.split('@').first);
    _ctrl.add(state);
  }

  void setAccessToken(String? token) {
    if (token != null && token.isNotEmpty) {
      _prefs.setString(_tokenKey, token);
    }
    state = state.copyWith(accessToken: token ?? '');
    _ctrl.add(state);
  }

  Future<void> logout() async {
    state = const AuthState();
    try {
      await _cookieJar.deleteAll();
      await _prefs.remove(_tokenKey);
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

final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw StateError(
      'sharedPreferencesProvider deve ser sobrescrito no main.dart');
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

  // if (!kIsWeb) {
  //   dio.interceptors.add(CookieManager(jar));
  // }

  dio.interceptors.add(InterceptorsWrapper(onRequest: (o, h) {
    final token = auth.accessToken;
    if (token != null && token.isNotEmpty) {
      o.headers['Authorization'] = 'Bearer $token';
    }
    h.next(o);
  }));

  Completer<String?>? refreshing;

  final refreshDio = Dio(BaseOptions(
    baseUrl: env.apiBaseUrl,
    headers: {'Accept': 'application/json'},
  ));

  if (!kIsWeb) {
    refreshDio.interceptors.add(CookieManager(jar));
  }

  Future<String?> doRefresh() async {
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

  Future<Response> retry(Dio client, RequestOptions ro) {
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
      if (refreshing == null) {
        refreshing = Completer<String?>();
        refreshing!.complete(await doRefresh());
      }
      final newTok = await refreshing!.future;
      refreshing = null;

      if (newTok != null && newTok.isNotEmpty) {
        err.requestOptions.extra['__ret'] = true;
        try {
          final resp = await retry(dio, err.requestOptions);
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
final localFormStoreProvider =
    Provider<LocalFormStore>((ref) => LocalFormStore());

final formsSeenVersionProvider = StateProvider<int>((_) => 0);
final newsSeenVersionProvider = StateProvider<int>((_) => 0);
final feedVersionProvider = StateProvider<int>((_) => 0);

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final env = ref.watch(envProvider);
  final jar = ref.watch(cookieJarProvider);
  final prefs = ref.watch(sharedPreferencesProvider);

  final dio = Dio(BaseOptions(
    baseUrl: env.apiBaseUrl,
    headers: {'Accept': 'application/json'},
  ));

  // if (!kIsWeb) {
  //   dio.interceptors.add(CookieManager(jar));
  // }

  dio.interceptors.add(LogInterceptor(
    request: true,
    requestBody: true,
    error: true,
    responseBody: false,
    logPrint: (o) => debugPrint('[AUTH DIO] $o'),
  ));

  return AuthController(dio, jar, prefs);
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
  final String? bio;
  final String? linkedin;
  final String? phone;
  final String? department;
  final String? jobTitle;
  final String? location;
  final String? avatarUrl;
  final Set<String> groups;
  final Map<String, dynamic>? customAttributes;

  const UserProfile({
    this.id,
    this.email,
    this.name,
    this.displayName,
    this.bio,
    this.linkedin,
    this.phone,
    this.department,
    this.jobTitle,
    this.location,
    this.avatarUrl,
    required this.groups,
    this.customAttributes,
  });

  factory UserProfile.fromJson(Map<String, dynamic> j) {
    List<String> toStrList(dynamic v) {
      if (v == null) return const [];
      if (v is List) return v.map((e) => '$e').toList();
      return const [];
    }

    final g = <String>{
      ...toStrList(j['groups']),
      ...toStrList(j['visibleGroups']),
    }..removeWhere((e) => e.trim().isEmpty);

    return UserProfile(
      id: j['id']?.toString(),
      email: j['email']?.toString(),
      name: j['name']?.toString(),
      displayName: j['displayName']?.toString(),
      bio: j['customAttributes']?['bio']?.toString(),
      linkedin: j['customAttributes']?['linkedin']?.toString(),
      phone: j['phone']?.toString(),
      department: j['department']?.toString(),
      jobTitle: j['jobTitle']?.toString(),
      location: j['location']?.toString(),
      avatarUrl: j['avatarUrl']?.toString(),
      groups: g,
      customAttributes: j['customAttributes'] as Map<String, dynamic>?,
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

final groupsListProvider =
    FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // Attempt fetch fresh, fallback to cache
  await ref.read(groupsRepoProvider).fetchAndCache();
  return ref.read(groupsRepoProvider).getCached();
});

bool _isVisibleForGroups(Map item, Set<String> userGroups) {
  Iterable<String> extract(dynamic v) {
    if (v == null) return const <String>[];
    if (v is List) return v.map((e) => '$e');
    return const <String>[];
  }

  final req = <String>{
    ...extract(item['visibleGroups']),
    ...extract(item['groups']),
    ...extract(item['visibleGroupIds']),
  }..removeWhere((e) => e.trim().isEmpty);

  if (req.isEmpty) return true;
  return req.any(userGroups.contains);
}

/// ================= SETTINGS =================
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
final groupsRepoProvider = Provider((ref) => GroupsRepo(ref));
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
    if (!kIsWeb) {
      await db.cacheSpaces(list);
    }
    return list;
  }

  Future<List<Map<String, dynamic>>> getCached() =>
      ref.read(dbProvider).getSpaces();
}

class GroupsRepo {
  final Ref ref;
  GroupsRepo(this.ref);

  Future<List<Map<String, dynamic>>> fetchAndCache() async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    try {
      final list = await api.getGroups();
      if (!kIsWeb) {
        await db.cacheGroups(list);
      }
      return list;
    } catch (e) {
      return getCached();
    }
  }

  Future<List<Map<String, dynamic>>> getCached() =>
      ref.read(dbProvider).getGroups();
}

class ChannelsRepo {
  final Ref ref;
  ChannelsRepo(this.ref);

  List<Map<String, dynamic>>? _memCache;

  Future<List<Map<String, dynamic>>> fetchAndCache({String? spaceId}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final userGroups = ref.read(userGroupsProvider);

    final list = await api.getChannels(spaceId: spaceId);

    if (list.isNotEmpty) {
      debugPrint(
          '[ChannelsRepo] First channel keys: ${list.first.keys.toList()}');
      debugPrint(
          '[ChannelsRepo] First channel spaceIds: ${list.first['spaceIds']}');
      debugPrint(
          '[ChannelsRepo] First channel space_ids: ${list.first['space_ids']}');
    }

    final filtered =
        list.where((c) => _isVisibleForGroups(c, userGroups)).toList();

    _memCache = filtered;
    if (!kIsWeb) {
      await db.cacheChannels(filtered);
    }
    return filtered;
  }

  Future<List<Map<String, dynamic>>> getCached({String? spaceId}) async {
    if (_memCache != null && (spaceId == null || spaceId.isEmpty)) {
      return _memCache!;
    }
    return ref.read(dbProvider).getChannels(spaceId: spaceId);
  }
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
    Map<String, String> spaceNameById,
  ) {
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
    m['hashtags'] = (m['hashtags'] as List?)?.map((e) => '$e').toList() ??
        []; // Ensure hashtags are preserved
    final channelId = (m['channelId'] ?? '').toString();
    final ch = channelById[channelId];
    if (ch != null) {
      m['channelName'] = (ch['name'] ?? '').toString();

      final spId = (ch['spaceId'] ?? '').toString();
      final spIds =
          (ch['spaceIds'] as List?)?.map((e) => e.toString()).toList() ?? [];
      if (spIds.isEmpty && spId.isNotEmpty) {
        spIds.add(spId);
      }

      m['spaceId'] = spId;
      m['spaceIds'] = spIds;
      m['spaceName'] = spaceNameById[spId] ?? '';
    } else {
      m['channelName'] = (m['channelName'] ?? '').toString();
      m['spaceId'] = (m['spaceId'] ?? '').toString();
      m['spaceIds'] = [];
      m['spaceName'] = (m['spaceName'] ?? '').toString();
    }

    // Metrics & Favorites
    m['viewsTotal'] = (m['viewsTotal'] ?? m['metrics']?['viewsTotal'] ?? 0);
    m['isFavorited'] =
        (m['isFavorited'] ?? m['userState']?['isFavorited'] ?? false) == true;
    m['myReaction'] = m['myReaction'] ?? m['userState']?['myReaction'];

    // Preserve interaction flags
    final us = (m['userState'] as Map?) ?? {};
    if (us.isNotEmpty) {
      m['userState'] = {
        ...us,
        'hasViewed': us['hasViewed'] ?? false,
        'hasCommented': us['hasCommented'] ?? false,
        'hasShared': us['hasShared'] ?? false,
      };
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

      if (!kIsWeb) {
        await db.cacheNews(filtered);
      }
      return filtered;
    } catch (_) {
      if (kIsWeb) return const [];
      final cached = await db.getNews();
      final List<Map<String, dynamic>> list =
          cached.map((e) => Map<String, dynamic>.from(e)).toList();

      return list
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

      if (!kIsWeb) {
        await db.cacheNews(visible);
      }
      return (limit > 0 && visible.length > limit)
          ? visible.take(limit).toList()
          : visible;
    } catch (_) {
      if (kIsWeb) return const [];
      final cached =
          (limit > 0) ? await db.getNews(limit: limit) : await db.getNews();
      final List<Map<String, dynamic>> list =
          cached.map((e) => Map<String, dynamic>.from(e)).toList();

      final filtered =
          list.where((n) => (n['isPublished'] ?? false) == true).toList();

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

  Future<List<Map<String, dynamic>>> homeFeedRemoteFirst({
    String? spaceId,
    int limit = 10,
    int? maxItems,
  }) async {
    final cap = (maxItems != null && maxItems > 0) ? maxItems : limit;
    final all = await listLatest(limit: 0);

    // DEBUG LOGGING
    if (spaceId != null && spaceId.isNotEmpty) {
      debugPrint('[NewsRepo] Filtering by spaceId: $spaceId');
      final count = all.where((n) {
        final ids =
            (n['spaceIds'] as List?)?.map((e) => e.toString()).toSet() ?? {};
        final sId = (n['spaceId'] ?? '').toString();
        if (sId.isNotEmpty) ids.add(sId);
        return ids.contains(spaceId);
      }).length;
      debugPrint(
          '[NewsRepo] Found $count items for space $spaceId out of ${all.length} total');
    }

    final filtered = (spaceId == null || spaceId.isEmpty)
        ? all
        : all.where((n) {
            final ids =
                (n['spaceIds'] as List?)?.map((e) => e.toString()).toSet() ??
                    {};
            final sId = (n['spaceId'] ?? '').toString();
            if (sId.isNotEmpty) ids.add(sId);
            return ids.contains(spaceId);
          }).toList();

    return (cap > 0 && filtered.length > cap)
        ? filtered.take(cap).toList()
        : filtered;
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final api = ref.read(apiClientProvider);
    final base = ref.read(apiBaseUrlProvider);
    final db = ref.read(dbProvider);

    try {
      final n = await api.getNewsDetail(id);

      // 🔥 FIX: Atualiza o cache local com os dados frescos da API
      // Isso garante que se a lista sobrescreveu com dados parciais, agora temos o completo.
      if (!kIsWeb) {
        await db.cacheNews([n]);
      }

      final channelsMap = await _channelsById();
      final spacesMap = await _spacesNameById();
      return _normalize(n, base, channelsMap, spacesMap);
    } catch (_) {
      final cached = await ref.read(dbProvider).getNews();
      final List<Map<String, dynamic>> all =
          cached.map((e) => Map<String, dynamic>.from(e)).toList();

      return all.firstWhere(
        (e) => (e['id'] ?? '').toString() == id,
        orElse: () => <String, dynamic>{},
      );
    }
  }

  Future<UnreadCounters> unreadCounters() async {
    final db = ref.read(dbProvider);
    final store = ref.read(localNewsStoreProvider);

    final visibleChannels = await ref.read(channelsRepoProvider).getCached();
    final visibleChannelIds =
        visibleChannels.map((c) => (c['id'] ?? '').toString()).toSet();

    if (kIsWeb) {
      return const UnreadCounters(total: 0, bySpace: {}, byChannel: {});
    }

    final all = await db.getNews(limit: 1000);
    final List<Map<String, dynamic>> list =
        all.map((e) => Map<String, dynamic>.from(e)).toList();

    final news = list
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

  Future<Map<String, dynamic>> toggleFavorite(String id) async {
    final api = ref.read(apiClientProvider);
    final res = await api.toggleFavoriteNews(id);
    api.invalidateNewsCache(id);
    return res;
  }

  Future<List<Map<String, dynamic>>> getFavorites({int page = 1}) async {
    final api = ref.read(apiClientProvider);
    final base = ref.read(apiBaseUrlProvider);
    final channelsMap = await _channelsById();
    final spacesMap = await _spacesNameById();

    final resp = await api.getFavoriteNews(page: page);
    final list = (resp['data'] as List?) ?? [];

    return list
        .map((e) => Map<String, dynamic>.from(e))
        .map((n) => _normalize(n, base, channelsMap, spacesMap))
        .toList();
  }
}

class UnreadCounters {
  final int total;
  final Map<String, int> bySpace;
  final Map<String, int> byChannel;
  const UnreadCounters({
    required this.total,
    required this.bySpace,
    required this.byChannel,
  });
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
      if (limit > 0 && filtered.length > limit) {
        return filtered.take(limit).toList();
      }
      return filtered;
    } catch (_) {
      final cached = (limit > 0)
          ? await db.getSurveys(limit: limit)
          : await db.getSurveys();
      final filtered = cached.where(_isVisible).toList();
      if (limit > 0 && filtered.length > limit) {
        return filtered.take(limit).toList();
      }
      return filtered;
    }
  }

  Future<Map<String, dynamic>> getById(String id) =>
      ref.read(apiClientProvider).getSurveyDetail(id);

  Future<void> sendResponse({
    required String surveyId,
    required List<Map<String, dynamic>> answers,
    String? userId,
  }) =>
      ref.read(apiClientProvider).postSurveyResponse(
            surveyId: surveyId,
            answers: answers,
            userId: userId,
          );
}

final newFormsCountProvider = FutureProvider.autoDispose<int>((ref) async {
  ref.watch(formsRefreshProvider);
  ref.watch(feedVersionProvider);
  ref.watch(formsSeenVersionProvider);

  final visibleForms = await ref.watch(formsListProvider.future);
  final seenIds = await ref.read(localFormStoreProvider).getSeenIds();

  final now = DateTime.now();
  final threeDaysAgo = now.subtract(const Duration(days: 3));

  int count = 0;
  for (final f in visibleForms) {
    final pid = f['id']?.toString() ?? '';
    if (seenIds.contains(pid)) continue;

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

final formsBadgesProvider = FutureProvider<int>((ref) async {
  final newForms = await ref.watch(newFormsCountProvider.future);
  final unreadReplies = await ref.watch(userFormsUnreadCountProvider.future);
  return newForms + unreadReplies;
});

class HomeBadges {
  final int newsNew;
  final int formsNew;
  final int surveysPending;
  const HomeBadges({
    this.newsNew = 0,
    this.formsNew = 0,
    this.surveysPending = 0,
  });
}

final homeBadgesProvider = Provider<HomeBadges>((ref) {
  final counters = ref.watch(unreadCountersProvider);
  final newsNew = counters.maybeWhen(
    data: (d) => d.total,
    orElse: () => 0,
  );

  final formsNew = ref.watch(formsBadgesProvider).maybeWhen(
        data: (v) => v,
        orElse: () => 0,
      );

  final surveysNew = ref.watch(newSurveysCountProvider).maybeWhen(
        data: (v) => v,
        orElse: () => 0,
      );

  return HomeBadges(
    newsNew: newsNew,
    formsNew: formsNew,
    surveysPending: surveysNew,
  );
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

// ========= PUSH BOOTSTRAP =========
final pushBootstrapProvider = Provider<void>((ref) {
  // 1) Mantém token atualizado
  ref.listen<AuthState>(authControllerProvider, (prev, next) async {
    final tok = next.accessToken;
    if (tok != null && tok.isNotEmpty) {
      await PushService.instance.init();
      PushService.instance.updateBackendAuthToken(tok);
    }
  });

  // 2) Registro e Handler
  final userAsync = ref.watch(userProfileProvider);

  userAsync.whenData((me) async {
    if (me?.id == null || me!.id!.isEmpty) return;

    final env = ref.read(envProvider);
    final auth = ref.read(authControllerProvider);

    await PushService.instance.init();
    PushService.instance.updateBackendAuthToken(auth.accessToken);

    // 🔥 HANDLER INTELIGENTE: Sync antes de Refresh
    // 🔥 HANDLER INTELIGENTE: Sync antes de Refresh
    PushService.instance.setNotificationRefreshHandler((message) async {
      debugPrint('[BOOTSTRAP] Push recebido! Sincronizando dados...');

      // If chat message, ignore heavy refresh in this global bootstrap handler
      // HomePage will handle chat specific updates if active
      if (message?.data['type'] == 'chat') {
        return;
      }

      // 1. Força busca das notícias mais recentes (Garante badge correto)
      await ref.read(newsRepoProvider).listLatest(limit: 10);

      // 2. Invalida os providers para UI atualizar
      ref.invalidate(unreadCountersProvider);
      ref.invalidate(formsBadgesProvider);
      ref.invalidate(newSurveysCountProvider);
      ref.invalidate(userFormsUnreadCountProvider);

      ref.invalidate(formsListProvider);
      ref.invalidate(surveysListProvider);
      ref.invalidate(myFormsSubmissionsProvider);
      ref.invalidate(homeFeedProvider);
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

  const EnvConfig({
    required this.apiBaseUrl,
    required this.appScheme,
    required this.companyId,
    required this.companyKey,
    required this.appName,
  });
}
