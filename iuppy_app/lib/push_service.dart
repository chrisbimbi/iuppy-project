import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:http/http.dart' as http;

const AndroidNotificationChannel _androidChannel = AndroidNotificationChannel(
  'news_channel',
  'News & Updates',
  description: 'Notificações de conteúdos e avisos',
  importance: Importance.high,
);

final FlutterLocalNotificationsPlugin _local =
    FlutterLocalNotificationsPlugin();

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('[FCM][BG] message data=${message.data}');
}

class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _initialized = false;
  String? _lastTokenSent;

  String? _accessToken;

  String? _userId;
  String? _companyId;
  String? _apiBaseUrl;
  String? _locale;
  String? _appVersion;

  void Function(String? link)? _onDeepLink;
  void setDeepLinkHandler(void Function(String? link) handler) {
    _onDeepLink = handler;
  }

  /// Converte qualquer payload "errado" em `iuppydev://news/article/<id>`
  String? _normalizeDeepLink(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final schema = const String.fromEnvironment('NEWS_DEEPLINK_SCHEMA',
        defaultValue: 'iuppydev');
    final path = const String.fromEnvironment('NEWS_DEEPLINK_PATH',
            defaultValue: '/news/article')
        .replaceFirst(RegExp(r'^/+'), '');
    final clean = raw.trim();

    // Caso correto já (schema://...)
    final schemaRe = RegExp(r'^[a-zA-Z][a-zA-Z0-9+\-.]*://');
    if (schemaRe.hasMatch(clean)) {
      // normaliza /// -> //
      final fixed = clean.replaceFirst(RegExp(r':///+'), '://');
      // se veio com /contents/<id> por engano, tentamos extrair o id
      final m = RegExp(r'/contents/([0-9a-fA-F\-]{36})$').firstMatch(fixed);
      if (m != null) {
        final id = m.group(1);
        final dl = '$schema://$path/$id';
        debugPrint('[DEEP] normalized(schema-mislink) in="$clean" out="$dl"');
        return dl;
      }
      return fixed;
    }

    // Se veio só "/contents/<id>"
    final m2 = RegExp(r'^/contents/([0-9a-fA-F\-]{36})$').firstMatch(clean);
    if (m2 != null) {
      final id = m2.group(1);
      final dl = '$schema://$path/$id';
      debugPrint('[DEEP] normalized(path) in="$clean" out="$dl"');
      return dl;
    }

    // Último recurso: se veio só o id
    final m3 = RegExp(r'^([0-9a-fA-F\-]{36})$').firstMatch(clean);
    if (m3 != null) {
      final id = m3.group(1);
      final dl = '$schema://$path/$id';
      debugPrint('[DEEP] normalized(id) in="$clean" out="$dl"');
      return dl;
    }

    debugPrint('[DEEP] could not normalize "$clean"');
    return clean;
  }

  /// Anexa `cameFromPush=1` e `mid=<messageId>` ao deep link
  String _appendPushParams(String deepLink, {String? messageId}) {
    final hasQuery = deepLink.contains('?');
    final qp = [
      'cameFromPush=1',
      if (messageId != null && messageId.isNotEmpty)
        'mid=${Uri.encodeComponent(messageId)}',
    ].join('&');
    return deepLink + (hasQuery ? '&' : '?') + qp;
  }

  Future<void> consumeInitialMessageIfAny() async {
    try {
      final msg = await FirebaseMessaging.instance.getInitialMessage();
      if (msg != null) _handleOpenFromTray(msg);
    } catch (_) {}
  }

  Future<void> init() async {
    if (_initialized) return;

    await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    const androidInit = AndroidInitializationSettings('ic_stat_notification');
    const iosInit = DarwinInitializationSettings();
    const initSettings =
        InitializationSettings(android: androidInit, iOS: iosInit);
    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (resp) async {
        final payload = resp.payload;
        final norm = _normalizeDeepLink(payload);
        debugPrint('[FCM][LOCAL] tap payload="$payload" norm="$norm"');
        if (norm != null) _onDeepLink?.call(norm);
      },
    );

    try {
      final androidImpl = _local.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final granted = await androidImpl?.requestNotificationsPermission();
      debugPrint('[FCM] Android notifications permission granted? $granted');
    } catch (e) {
      debugPrint('[FCM] requestNotificationsPermission error: $e');
    }

    await _local
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_androidChannel);

    if (Platform.isIOS) {
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleOpenFromTray);

    debugPrint('[FCM] initialized');
    _initialized = true;
  }

  void updateBackendAuthToken(String? accessToken) {
    _accessToken = accessToken;
    debugPrint(
        '[FCM] backend accessToken updated? ${accessToken != null && accessToken.isNotEmpty}');
  }

  Future<void> printDebugToken() async {
    try {
      final fcm = await FirebaseMessaging.instance.getToken();
      debugPrint('[FCM] current FCM token: $fcm');
      if (Platform.isIOS) {
        final apns = await FirebaseMessaging.instance.getAPNSToken();
        debugPrint('[FCM] current APNs token (iOS): $apns');
      }
    } catch (e) {
      debugPrint('[FCM] getToken error: $e');
    }
  }

  Future<void> askPermissionAndRegister({
    required String userId,
    required String companyId,
    required String apiBaseUrl,
    String? accessToken,
    String? appVersion,
    String? locale,
    Map<String, dynamic>? extra,
  }) async {
    _userId = userId;
    _companyId = companyId;
    _apiBaseUrl = apiBaseUrl;
    _appVersion = appVersion;
    _locale = locale;
    if (accessToken != null && accessToken.isNotEmpty)
      _accessToken = accessToken;

    final messaging = FirebaseMessaging.instance;

    if (Platform.isIOS) {
      final settings = await messaging.requestPermission(
          alert: true, badge: true, sound: true);
      debugPrint('[FCM] iOS permission: ${settings.authorizationStatus}');
    }

    String? token;
    try {
      token = await messaging.getToken();
      debugPrint('[FCM] getToken -> $token');
    } catch (e) {
      debugPrint('[FCM] getToken error: $e');
    }

    if (token != null && token.isNotEmpty) {
      await _sendTokenToBackend(
        token: token,
        userId: userId,
        companyId: companyId,
        apiBaseUrl: apiBaseUrl,
        accessToken: _accessToken,
        appVersion: appVersion,
        locale: locale,
        extra: extra,
      );
      _lastTokenSent = token;
    }

    messaging.onTokenRefresh.listen((t) async {
      debugPrint('[FCM] onTokenRefresh -> $t');
      if (t != _lastTokenSent) {
        await _sendTokenToBackend(
          token: t,
          userId: _userId ?? userId,
          companyId: _companyId ?? companyId,
          apiBaseUrl: _apiBaseUrl ?? apiBaseUrl,
          accessToken: _accessToken,
          appVersion: _appVersion ?? appVersion,
          locale: _locale ?? locale,
          extra: extra,
        );
        _lastTokenSent = t;
      }
    });
  }

  void _onForegroundMessage(RemoteMessage m) async {
    debugPrint(
        '[FCM] onMessage data=${m.data} notif=${m.notification?.title}/${m.notification?.body}');
    final notif = m.notification;
    final title = notif?.title ?? (m.data['title'] ?? 'Atualização');
    final body =
        notif?.body ?? (m.data['body'] ?? 'Você tem uma nova mensagem');
    final deepLinkRaw = m.data['deepLink'];
    final deepLink = _normalizeDeepLink(deepLinkRaw);

    // inclui cameFromPush/mid para o tap da notificação local
    final payload = (deepLink == null)
        ? null
        : _appendPushParams(deepLink, messageId: m.messageId);

    await _local.show(
      m.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          icon: 'ic_stat_notification',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: payload,
    );
  }

  void _handleOpenFromTray(RemoteMessage m) {
    final deepLinkRaw = m.data['deepLink'];
    final deepLink = _normalizeDeepLink(deepLinkRaw?.toString());
    final withParams = (deepLink == null)
        ? null
        : _appendPushParams(deepLink, messageId: m.messageId);
    debugPrint(
        '[FCM] onMessageOpenedApp deepLinkRaw=$deepLinkRaw normalized=$deepLink data=${m.data} mid=${m.messageId}');
    if (withParams != null) _onDeepLink?.call(withParams);
  }

  Future<void> _sendTokenToBackend({
    required String token,
    required String userId,
    required String companyId,
    required String apiBaseUrl,
    String? accessToken,
    String? appVersion,
    String? locale,
    Map<String, dynamic>? extra,
  }) async {
    final masked = _maskToken(token);

    // v2
    final v2Uri = Uri.parse('$apiBaseUrl/v2/notifications/register-device');
    final v2Payload = <String, dynamic>{
      'platform': Platform.isIOS ? 'ios' : 'android',
      'token': token,
      if (extra != null) ...extra,
    };
    debugPrint(
        '[FCM] registering token (v2) → $v2Uri token=$masked bearer=${accessToken != null && accessToken.isNotEmpty}');
    final v2Res = await _safePostJson(v2Uri, v2Payload, accessToken);
    if (v2Res != null && v2Res.statusCode >= 200 && v2Res.statusCode < 300) {
      debugPrint('[FCM] token registrado com sucesso (v2)');
      return;
    }

    // fallback
    final shouldFallback = () {
      if (v2Res == null) return true;
      if (v2Res.statusCode == 404) return true;
      if (v2Res.statusCode == 400 && (v2Res.body).contains('should not exist'))
        return true;
      return false;
    }();

    if (!shouldFallback) {
      final status = v2Res?.statusCode;
      final body = v2Res?.body;
      debugPrint('[FCM] falha ao registrar token (v2): $status $body');
      return;
    }

    final v1Uri = Uri.parse('$apiBaseUrl/notifications/register-device');
    final v1Payload = <String, dynamic>{
      'userId': userId,
      'companyId': companyId,
      'platform': Platform.isIOS ? 'ios' : 'android',
      'token': token,
      'deviceId': null,
      'userAgent': null,
      'locale': locale,
      if (extra != null) ...extra,
    };
    debugPrint(
        '[FCM] registering token (LEGACY) → $v1Uri token=$masked bearer=${accessToken != null && accessToken.isNotEmpty}');
    final v1Res = await _safePostJson(v1Uri, v1Payload, accessToken);

    if (v1Res != null && v1Res.statusCode >= 200 && v1Res.statusCode < 300) {
      debugPrint('[FCM] token registrado com sucesso (legacy)');
    } else {
      debugPrint(
          '[FCM] falha ao registrar token (legacy): ${v1Res?.statusCode} ${v1Res?.body}');
    }
  }

  Future<http.Response?> _safePostJson(
      Uri uri, Map<String, dynamic> body, String? bearer) async {
    try {
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (bearer != null && bearer.isNotEmpty)
            'Authorization': 'Bearer $bearer',
        },
        body: const JsonEncoder().convert(body),
      );
      return res;
    } catch (e) {
      debugPrint('[FCM] HTTP error → $e');
      return null;
    }
  }

  String _maskToken(String? t) {
    if (t == null || t.isEmpty) return '';
    if (t.length <= 12) {
      return '${t.substring(0, 2)}***${t.substring(t.length - 2)}';
    }
    return '${t.substring(0, 6)}***${t.substring(t.length - 6)}';
  }
}
