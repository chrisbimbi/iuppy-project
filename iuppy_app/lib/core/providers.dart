import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../app/theme/theme.dart';
import '../core/env/app_env.dart';
import '../data/local/app_database.dart';
import '../data/remote/api_client.dart';
import '../features/surveys/local_survey_store.dart';
import '../features/news/local_news_store.dart';
import '../push_service.dart';

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

/// Útil para normalizações que dependem do host.
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
  AuthController(this._authDio) : super(const AuthState());
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

  Future<void> logout() async {
    state = const AuthState();
    _ctrl.add(state);
  }

  @override
  void dispose() {
    _ctrl.close();
    super.dispose();
  }
}

/// Dio com Authorization automaticamente
final dioProvider = Provider<Dio>((ref) {
  final env = ref.watch(envProvider);
  final auth = ref.watch(authControllerProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: env.apiBaseUrl,
      headers: {'Accept': 'application/json'},
    ),
  );
  dio.interceptors.add(
    InterceptorsWrapper(onRequest: (o, h) {
      final token = auth.accessToken;
      if (token != null && token.isNotEmpty) {
        o.headers['Authorization'] = 'Bearer $token';
      }
      h.next(o);
    }),
  );
  return dio;
});

/// ================= LOCAL STORES =================
final localSurveyStoreProvider = Provider<LocalSurveyStore>((ref) {
  return LocalSurveyStore();
});
final localNewsStoreProvider = Provider<LocalNewsStore>((ref) {
  return LocalNewsStore();
});

/// Auth controller usa um Dio SEM interceptor para evitar ciclo
final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) {
  final env = ref.watch(envProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: env.apiBaseUrl,
      headers: {'Accept': 'application/json'},
    ),
  );
  return AuthController(dio);
});

/// ================= API CLIENT =================
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

    // grupos podem vir em "groups" OU "visibleGroups"
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

/// Busca o usuário logado (usa /auth/me). Fallback = null.
final userProfileProvider = FutureProvider<UserProfile?>((ref) async {
  final api = ref.read(apiClientProvider);
  try {
    final raw = await api.getMe();
    if (raw.isEmpty) return null;
    return UserProfile.fromJson(raw);
  } catch (_) {
    return null;
  }
});

/// Atalho: conjunto de grupos do usuário (pode ser vazio).
final userGroupsProvider = Provider<Set<String>>((ref) {
  final me = ref.watch(userProfileProvider).maybeWhen(
        data: (u) => u?.groups ?? const <String>{},
        orElse: () => const <String>{},
      );
  return me;
});

/// Helper p/ checar visibilidade por grupos.
bool _isVisibleForGroups(Map item, Set<String> userGroups) {
  Iterable<String> _extract(dynamic v) {
    if (v == null) return const <String>[];
    if (v is List) return v.map((e) => '$e');
    return const <String>[];
  }

  // Procura campos comuns de visibilidade
  final req = <String>{
    ..._extract(item['visibleGroups']),
    ..._extract(item['groups']),
    ..._extract(item['visibleGroupIds']),
  }..removeWhere((e) => e.trim().isEmpty);

  // Sem grupos exigidos -> público
  if (req.isEmpty) return true;

  // Interseção com grupos do usuário
  return req.any(userGroups.contains);
}

/// ================= SETTINGS + THEME =================
class CompanyBranding {
  final String? logoUrl;
  final String appTitle;
  final String appSubtitle;
  final int primary; // hex
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

  // aplica tema
  final theme = buildThemes(
    BrandingColors(
      primary: Color(branding.primary),
      background: Color(branding.background),
      textOnBackground: Color(branding.textOnBackground),
    ),
  );
  ref.read(appThemeProvider.notifier).state = theme;

  // 🚀 Bootstrap de Push/FCM: quando settings carregaram, tenta registrar token
  try {
    final me = await ref.read(userProfileProvider.future);
    final env = ref.read(envProvider);
    if (me?.id != null && (env.companyId.isNotEmpty)) {
      // Inicializa serviço de Push (idempotente) e registra o token no backend
      await PushService.instance.init();
      await PushService.instance.askPermissionAndRegister(
        userId: me!.id!,
        companyId: env.companyId,
        apiBaseUrl: env.apiBaseUrl,
        // opcionalmente: appVersion/locale/extras
        appVersion: null,
        locale: null,
      );
    }
  } catch (_) {
    // silencioso; se falhar aqui, o app pode tentar novamente depois
  }

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

    // 🔒 filtro de visibilidade por grupos (client-side)
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
    Map<String, String> spaceNameById,
  ) {
    final m = Map<String, dynamic>.from(raw);

    // highlightImages (somente http/https)
    final imgsDyn = (m['highlightImages'] as List?) ?? const [];
    final imgs = <String>[];
    for (final e in imgsDyn) {
      final url = (e is Map ? e['url'] : e)?.toString() ?? '';
      if (url.startsWith('http')) imgs.add(url);
    }
    if (imgs.isEmpty) imgs.add(_fallbackThumb);
    m['highlightImages'] = imgs;

    // attachments (somente http/https)
    final attsDyn = (m['attachments'] as List?) ?? const [];
    final atts = <String>[];
    for (final e in attsDyn) {
      final url = (e is Map ? e['url'] : e)?.toString() ?? '';
      if (url.startsWith('http')) atts.add(url);
    }
    m['attachments'] = atts;

    // enrich: channel / space
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

  /// Lista por canal — remote-first + filtro por canal visível
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
      final List<Map<String, dynamic>> list =
          cached.map((e) => Map<String, dynamic>.from(e)).toList();

      return list
          .where((n) =>
              (n['channelId']?.toString() ?? '') == channelId &&
              (n['isPublished'] ?? false) == true)
          .toList();
    }
  }

  /// HOME FEED — remote-first, normaliza, ordena, cacheia e filtra por canal visível
  Future<List<Map<String, dynamic>>> listLatest({int limit = 10}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final base = ref.read(apiBaseUrlProvider);

    try {
      final remote = await api.getNews(); // sem filtro de canal
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

  /// Carrossel da Home (filtro opcional por space)
  Future<List<Map<String, dynamic>>> homeFeedRemoteFirst({
    String? spaceId,
    int limit = 10,
    int? maxItems,
  }) async {
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
      // ⚠️ Tipagem explícita pra evitar o crash do orElse
      final cached = await ref.read(dbProvider).getNews();
      final List<Map<String, dynamic>> all =
          cached.map((e) => Map<String, dynamic>.from(e)).toList();

      return all.firstWhere(
        (e) => (e['id'] ?? '').toString() == id,
        orElse: () => <String, dynamic>{},
      );
    }
  }

  /// Contadores para badges (Home/Drawer) — após filtro de canais visíveis
  Future<UnreadCounters> unreadCounters() async {
    final db = ref.read(dbProvider);
    final store = ref.read(localNewsStoreProvider);

    // conjunto de canais visíveis (já cache filtrado)
    final visibleChannels = await ref.read(channelsRepoProvider).getCached();
    final visibleChannelIds =
        visibleChannels.map((c) => (c['id'] ?? '').toString()).toSet();

    // notícias publicadas do cache e pertencentes a canais visíveis
    final all = await db.getNews(limit: 1000);
    final List<Map<String, dynamic>> list =
        all.map((e) => Map<String, dynamic>.from(e)).toList();

    final news = list
        .where((n) => (n['isPublished'] ?? true) == true)
        .where((n) =>
            visibleChannelIds.contains((n['channelId'] ?? '').toString()))
        .toList();

    // total e agrupamentos
    final total =
        await store.countUnread(news.map((n) => (n['id'] ?? '').toString()));
    final bySpace = await store.countUnreadByKey(news, 'spaceId');
    final byChannel = await store.countUnreadByKey(news, 'channelId');

    return UnreadCounters(total: total, bySpace: bySpace, byChannel: byChannel);
  }
}

/// DTO simples para os contadores de não lidas
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

/// ===== Home badges =====
class HomeBadges {
  final int newsNew;
  final int surveysPending;
  const HomeBadges({this.newsNew = 0, this.surveysPending = 0});
}

final homeBadgesProvider = StateProvider<HomeBadges>((_) => const HomeBadges());

/// Contadores por space/channel (Drawer)
final unreadCountersProvider = FutureProvider<UnreadCounters>((ref) async {
  return ref.read(newsRepoProvider).unreadCounters();
});
