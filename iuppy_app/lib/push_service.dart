// lib/push_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_app_badger/flutter_app_badger.dart';

const AndroidNotificationChannel _androidChannel = AndroidNotificationChannel(
  'news_channel',
  'Notificações',
  description: 'This channel is used for important notifications.',
  importance: Importance.max,
);

final FlutterLocalNotificationsPlugin _local =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  debugPrint('[FCM][BG] message data=${message.data}');

  // Update Badge in Background (Android)
  if (message.data.containsKey('badge')) {
    try {
      final badge = int.tryParse(message.data['badge'].toString());
      if (badge != null && await FlutterAppBadger.isAppBadgeSupported()) {
        FlutterAppBadger.updateBadgeCount(badge);
      }
    } catch (e) {
      debugPrint('[FCM][BG] Error updating badge: $e');
    }
  }
}

class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _initialized = false;
  bool _listenersRegistered = false; // 🔥 PREVINE DUPLICIDADE
  String? _lastTokenSent;
  String? _accessToken;
  String? _userId;
  String? _companyId;
  String? _apiBaseUrl;
  String? _locale;

  String? _pendingDeepLink; // Added buffer for race cond
  void Function(String? link)? _onDeepLink;
  // Alterado para Future para suportar await no bootstrap
  Future<void> Function(RemoteMessage? message)? _onNotificationReceived;

  void setDeepLinkHandler(void Function(String? link) handler) {
    _onDeepLink = handler;
    if (_pendingDeepLink != null) {
      debugPrint(
          '[PushService] Processing pending deep link: $_pendingDeepLink');
      handler(_pendingDeepLink);
      _pendingDeepLink = null;
    }
  }

  void setNotificationRefreshHandler(
      Future<void> Function(RemoteMessage? message) handler) {
    _onNotificationReceived = handler;
  }

  String? _normalizeDeepLink(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final clean = raw.trim();
    // A normalização pesada agora fica no DeepLinkHandler,
    // aqui só garantimos que a string passe.
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
      if (msg != null) {
        debugPrint('[FCM] Consuming Initial Message: ${msg.data}');
        _handleOpenFromTray(msg);
      }
    } catch (e) {
      debugPrint('[FCM] Error consuming initial message: $e');
    }
  }

  Future<void> init() async {
    if (_initialized) return;

    if (kIsWeb) {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: 'AIzaSyD-DU-6Mj6dHw16M9zyjearMLKrVVyrz4s',
          appId: '1:643342034012:web:a240360662660721d9f299',
          messagingSenderId: '643342034012',
          projectId: 'iuppy-app',
          authDomain: 'iuppy-app.firebaseapp.com',
          storageBucket: 'iuppy-app.firebasestorage.app',
        ),
      );
    } else {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform);
    }

    // Handler de background deve ser registrado apenas uma vez
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    const initSettings =
        InitializationSettings(android: androidInit, iOS: iosInit);

    await _local.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (resp) async {
        final payload = resp.payload;
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

    if (!kIsWeb && Platform.isIOS) {
      await Firebase.initializeApp(
          options: DefaultFirebaseOptions
              .currentPlatform); // Wait, this is init? No this is ForegroundNotificationOptions code block from previous View?
      // Ah wait, I need to match the TargetContent exactly from the previous view_file of push_service.dart
      // The previous view had:
      // if (Platform.isIOS) {
      //   await FirebaseMessaging.instance
      //       .setForegroundNotificationPresentationOptions(
      //     alert: true,
      //     badge: true,
      //     sound: true,
      //   );
      // }
      // I will replace that.
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    // 🔥 LÓGICA DE LISTENER ÚNICO
    if (!_listenersRegistered) {
      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
        debugPrint('[FCM] Foreground Message: ${message.notification?.title}');

        RemoteNotification? notification = message.notification;
        AndroidNotification? android = message.notification?.android;

        if (notification != null &&
            android != null &&
            !kIsWeb &&
            Platform.isAndroid) {
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
            payload: _getLinkFromData(message.data),
          );
        }

        // Notifica a UI (agora suporta async)
        if (_onNotificationReceived != null) {
          await _onNotificationReceived!(message);
        }
      });

      FirebaseMessaging.onMessageOpenedApp.listen((m) {
        debugPrint('[FCM] Opened form Tray (Background running)');
        _handleOpenFromTray(m);
      });

      _listenersRegistered = true;
    }

    debugPrint('[FCM] initialized');
    _initialized = true;
  }

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

    _locale = locale;
    if (accessToken != null && accessToken.isNotEmpty) {
      _accessToken = accessToken;
    }

    final messaging = FirebaseMessaging.instance;
    if (!kIsWeb && Platform.isIOS) {
      await messaging.requestPermission(alert: true, badge: true, sound: true);
    } else if (!kIsWeb && Platform.isAndroid) {
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
      await _sendTokenToBackend(token: token);
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
    final targetLink = _getLinkFromData(m.data);

    if (targetLink != null) {
      final withParams = _appendPushParams(targetLink, messageId: m.messageId);
      if (_onDeepLink != null) {
        _onDeepLink!(withParams);
      } else {
        debugPrint(
            '[PushService] DeepLink received but handler not set. Buffering: $withParams');
        _pendingDeepLink = withParams;
      }
    }
  }

  String? _getLinkFromData(Map<String, dynamic> data) {
    final deepLinkRaw = data['deepLink'] ?? data['link'];
    final deepLink = _normalizeDeepLink(deepLinkRaw?.toString());
    if (deepLink != null) return deepLink;

    if (data['type'] == 'news' && data['id'] != null) {
      return '/news/article/${data['id']}';
    }

    if (data['kind'] == 'JOURNEY_STEP' && data['journeyId'] != null) {
      return '/journeys/${data['journeyId']}';
    }

    if (data['type'] == 'chat' && data['conversationId'] != null) {
      return '/chat/${data['conversationId']}';
    }

    return null;
  }

  Future<void> _sendTokenToBackend({required String token}) async {
    final v2Uri = Uri.parse('$_apiBaseUrl/v2/notifications/register-device');

    final v2Payload = <String, dynamic>{
      'platform': kIsWeb ? 'web' : (Platform.isIOS ? 'ios' : 'android'),
      'token': token,
    };

    final v2Res = await _safePostJson(v2Uri, v2Payload, _accessToken);

    if (v2Res != null && v2Res.statusCode >= 200 && v2Res.statusCode < 300) {
      debugPrint('[FCM] ✅ TOKEN REGISTRADO (V2) OK');
      return;
    }

    // Fallback V1
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
          if (_companyId != null) 'x-company-id': _companyId!,
        },
        body: const JsonEncoder().convert(body),
      );
    } catch (e) {
      debugPrint('[FCM] HTTP error: $e');
      return null;
    }
  }

  Future<void> updateBadge(int count) async {
    if (kIsWeb) return;
    try {
      final isSupported = await FlutterAppBadger.isAppBadgeSupported();
      if (!isSupported) return;

      if (count > 0) {
        FlutterAppBadger.updateBadgeCount(count);
      } else {
        FlutterAppBadger.removeBadge();
      }
    } catch (e) {
      debugPrint('[PushService] Error updating badge: $e');
    }
  }

  Future<void> resetBadge() async {
    if (kIsWeb) return;
    try {
      final isSupported = await FlutterAppBadger.isAppBadgeSupported();
      if (!isSupported) return;
      FlutterAppBadger.removeBadge();
    } catch (e) {
      debugPrint('[PushService] Error resetting badge: $e');
    }
  }
}
