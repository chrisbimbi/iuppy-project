// lib/core/providers.dart
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../app/theme/theme.dart';
import '../core/env/app_env.dart';
import '../data/remote/api_client.dart';
import '../data/local/app_database.dart';

// ========== ENV ==========
final envProvider = Provider<EnvConfig>((ref) {
  return const EnvConfig(
    apiBaseUrl: AppEnv.apiBaseUrl,
    appScheme: AppEnv.appScheme,
    companyId: AppEnv.companyId,
    companyKey: AppEnv.companyKey,
    appName: AppEnv.appName,
  );
});

// ========== DB ==========
final dbProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

// ========== AUTH ==========
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

// Dio com interceptor de Authorization (lê o token do auth state)
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
    InterceptorsWrapper(
      onRequest: (o, h) {
        final token = auth.accessToken;
        if (token != null && token.isNotEmpty) {
          o.headers['Authorization'] = 'Bearer $token';
        }
        h.next(o);
      },
    ),
  );
  return dio;
});

// Auth controller usa um Dio SEM interceptor para evitar ciclo
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

// ========== API CLIENT ==========
final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = ref.watch(dioProvider);
  final env = ref.watch(envProvider);
  return ApiClient(dio, env.companyId);
});

// ========== SETTINGS + MODULES ==========
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

  return CompanySettingsState(branding, enabled);
});

// ========== THEME ==========
final appThemeProvider = StateProvider<AppThemePair>((ref) {
  return buildThemes(
    BrandingColors(
      primary: const Color(0xFF22B4FF),
      background: const Color(0xFFF5F7FB),
      textOnBackground: const Color(0xFF090E48),
    ),
  );
});

// ========== REPOSITORIES ==========
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
    final list = await api.getChannels(spaceId: spaceId);
    await db.cacheChannels(list);
    return list;
  }

  Future<List<Map<String, dynamic>>> getCached({String? spaceId}) =>
      ref.read(dbProvider).getChannels(spaceId: spaceId);
}

class NewsRepo {
  final Ref ref;
  NewsRepo(this.ref);

  Future<List<Map<String, dynamic>>> listByChannel(String channelId) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final list = await api.getNewsByChannel(channelId);
    await db.cacheNews(list);
    return list;
  }

  Future<Map<String, dynamic>> getById(String id) =>
      ref.read(apiClientProvider).getNewsDetail(id);

  Future<List<Map<String, dynamic>>> latest({int limit = 3}) async {
    final db = ref.read(dbProvider);
    return db.getNews(limit: limit);
  }
}

class SurveysRepo {
  final Ref ref;
  SurveysRepo(this.ref);

  Future<List<Map<String, dynamic>>> list({int limit = 3}) async {
    final api = ref.read(apiClientProvider);
    final db = ref.read(dbProvider);
    final list = await api.getSurveys();
    await db.cacheSurveys(list);
    final cached = await db.getSurveys(limit: limit);
    return cached;
  }

  Future<Map<String, dynamic>> getById(String id) =>
      ref.read(apiClientProvider).getSurveyDetail(id);

  /// Envia respostas usando o endpoint oficial
  Future<void> sendResponse({
    required String surveyId,
    required List<Map<String, dynamic>> answers,
    String? userId, // ainda não temos no AuthState; pode ficar null
  }) async {
    await ref.read(apiClientProvider).postSurveyResponse(
          surveyId: surveyId,
          answers: answers,
          userId: userId,
        );
  }
}
