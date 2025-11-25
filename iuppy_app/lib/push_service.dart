import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:http/http.dart' as http;

const AndroidNotificationChannel _androidChannel = AndroidNotificationChannel(
  'high_importance_channel',
  'High Importance Notifications',
  description: 'This channel is used for important notifications.',
  importance: Importance.max,
);

final FlutterLocalNotificationsPlugin _local =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
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

  // 🔥 NOVO: Callback para avisar o app que chegou dados novos
  VoidCallback? _onNotificationReceived;

  void setDeepLinkHandler(void Function(String? link) handler) {
    _onDeepLink = handler;
  }

  // 🔥 NOVO: Configura o handler de refresh
  void setNotificationRefreshHandler(VoidCallback handler) {
    _onNotificationReceived = handler;
  }

  String? _normalizeDeepLink(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final schema = const String.fromEnvironment('NEWS_DEEPLINK_SCHEMA',
        defaultValue: 'iuppydev');
    final path = const String.fromEnvironment('NEWS_DEEPLINK_PATH',
            defaultValue: '/news/article')
        .replaceFirst(RegExp(r'^/+'), '');
    final clean = raw.trim();

    if (clean.startsWith('iuppy://')) return clean;

    final schemaRe = RegExp(r'^[a-zA-Z][a-zA-Z0-9+\-.]*://');
    if (schemaRe.hasMatch(clean)) {
      final fixed = clean.replaceFirst(RegExp(r':///+'), '://');
      final m = RegExp(r'/contents/([0-9a-fA-F\-]{36})$').firstMatch(fixed);
      if (m != null) return '$schema://$path/${m.group(1)}';
      return fixed;
    }

    final m2 = RegExp(r'^/contents/([0-9a-fA-F\-]{36})$').firstMatch(clean);
    if (m2 != null) return '$schema://$path/${m2.group(1)}';

    final m3 = RegExp(r'^([0-9a-fA-F\-]{36})$').firstMatch(clean);
    if (m3 != null) return '$schema://$path/${m3.group(1)}';

    return clean;
  }

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

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    const initSettings =
        InitializationSettings(android: androidInit, iOS: iosInit);

    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (resp) async {
        final payload = resp.payload;
        debugPrint('[FCM][LOCAL] tap payload="$payload"');
        if (payload != null) {
          final norm = _normalizeDeepLink(payload);
          if (norm != null) _onDeepLink?.call(norm);
        }
      },
    );

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

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground Message: ${message.notification?.title}');

      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null && Platform.isAndroid) {
        _local.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              _androidChannel.id,
              _androidChannel.name,
              channelDescription: _androidChannel.description,
              icon: android.smallIcon ?? '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
          payload: message.data['deepLink'],
        );
      }

      // 🔥 GATILHO: Avisa que chegou novidade (para atualizar badges)
      _onNotificationReceived?.call();
    });

    FirebaseMessaging.onMessageOpenedApp.listen(_handleOpenFromTray);

    debugPrint('[FCM] initialized');
    _initialized = true;
  }

  // ... (Manter métodos updateBackendAuthToken, printDebugToken, askPermissionAndRegister, _handleOpenFromTray, _sendTokenToBackend, _safePostJson, _maskToken IGUAIS)
  // Copie o restante do arquivo anterior, não houve mudança neles.
  // ...

  void updateBackendAuthToken(String? accessToken) {
    _accessToken = accessToken;
  }

  Future<void> printDebugToken() async {
    try {
      final fcm = await FirebaseMessaging.instance.getToken();
      debugPrint('[FCM] current FCM token: $fcm');
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
      await messaging.requestPermission(alert: true, badge: true, sound: true);
    } else if (Platform.isAndroid) {
      final androidImpl = _local.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      await androidImpl?.requestNotificationsPermission();
    }
    String? token;
    try {
      token = await messaging.getToken();
    } catch (e) {
      debugPrint('[FCM] getToken error: $e');
    }
    if (token != null && token.isNotEmpty) {
      await _sendTokenToBackend(token: token!);
      _lastTokenSent = token;
    }
    messaging.onTokenRefresh.listen((t) async {
      if (t != _lastTokenSent) {
        await _sendTokenToBackend(token: t);
        _lastTokenSent = t;
      }
    });
  }

  void _handleOpenFromTray(RemoteMessage m) {
    final deepLinkRaw = m.data['deepLink'];
    final deepLink = _normalizeDeepLink(deepLinkRaw?.toString());
    final withParams = (deepLink == null)
        ? null
        : _appendPushParams(deepLink, messageId: m.messageId);
    debugPrint(
        '[FCM] onMessageOpenedApp deepLinkRaw=$deepLinkRaw normalized=$deepLink');
    if (withParams != null) _onDeepLink?.call(withParams);
  }

  Future<void> _sendTokenToBackend({required String token}) async {
    final v2Uri = Uri.parse('$_apiBaseUrl/v2/notifications/register-device');
    final v2Payload = <String, dynamic>{
      'platform': Platform.isIOS ? 'ios' : 'android',
      'token': token,
    };
    final v2Res = await _safePostJson(v2Uri, v2Payload, _accessToken);
    if (v2Res != null && v2Res.statusCode >= 200 && v2Res.statusCode < 300) {
      debugPrint('[FCM] token registered (v2)');
      return;
    }
    final v1Uri = Uri.parse('$_apiBaseUrl/notifications/register-device');
    final v1Payload = <String, dynamic>{
      'userId': _userId,
      'companyId': _companyId,
      'platform': Platform.isIOS ? 'ios' : 'android',
      'token': token,
      'deviceId': null,
      'userAgent': null,
      'locale': _locale,
    };
    await _safePostJson(v1Uri, v1Payload, _accessToken);
  }

  Future<http.Response?> _safePostJson(
      Uri uri, Map<String, dynamic> body, String? bearer) async {
    try {
      return await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (bearer != null && bearer.isNotEmpty)
            'Authorization': 'Bearer $bearer',
        },
        body: const JsonEncoder().convert(body),
      );
    } catch (e) {
      debugPrint('[FCM] HTTP error: $e');
      return null;
    }
  }
}
