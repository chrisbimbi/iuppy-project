// lib/push_service.dart (FINAL)
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:http/http.dart' as http;

const AndroidNotificationChannel _androidChannel = AndroidNotificationChannel(
  'news_channel', // 👈 deve bater com o channel do Manifest (strings.xml)
  'News & Updates',
  description: 'Notificações de conteúdos e avisos',
  importance: Importance.high,
);

final FlutterLocalNotificationsPlugin _local =
    FlutterLocalNotificationsPlugin();

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  // Se quiser processar algo em BG, faça aqui (sem UI).
}

class PushService {
  PushService._();
  static final PushService instance = PushService._();

  bool _initialized = false;
  String? _lastTokenSent;

  void Function(String? link)? _onDeepLink;
  void setDeepLinkHandler(void Function(String? link) handler) {
    _onDeepLink = handler;
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
        if (payload != null) _onDeepLink?.call(payload);
      },
    );

    // 👇 ANDROID 13+: peça permissão para mostrar notificações
    try {
      final androidImpl = _local.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      final granted = await androidImpl?.requestNotificationsPermission();
      debugPrint('[FCM] Android notifications permission granted? $granted');
    } catch (e) {
      debugPrint('[FCM] requestNotificationsPermission error: $e');
    }

    // Garante que o canal existe (mesmo ID do Manifest)
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

    debugPrint('[FCM] initialized; APNs auto (iOS): ${Platform.isIOS}');
    _initialized = true;
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
    String? appVersion,
    String? locale,
    Map<String, dynamic>? extra,
  }) async {
    final messaging = FirebaseMessaging.instance;

    if (Platform.isIOS) {
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
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
          userId: userId,
          companyId: companyId,
          apiBaseUrl: apiBaseUrl,
          appVersion: appVersion,
          locale: locale,
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
    final deepLink = m.data['deepLink'];

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
      payload: deepLink,
    );
  }

  void _handleOpenFromTray(RemoteMessage m) {
    final deepLink = m.data['deepLink'];
    debugPrint('[FCM] onMessageOpenedApp deepLink=$deepLink data=${m.data}');
    _onDeepLink?.call(deepLink?.toString());
  }

  Future<void> _sendTokenToBackend({
    required String token,
    required String userId,
    required String companyId,
    required String apiBaseUrl,
    String? appVersion,
    String? locale,
    Map<String, dynamic>? extra,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/devices/register');
    final payload = {
      'userId': userId,
      'companyId': companyId,
      'platform': Platform.isIOS ? 'ios' : 'android',
      'fcmToken': token,
      'appVersion': appVersion,
      'locale': locale,
      if (extra != null) ...extra,
    };

    try {
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: const JsonEncoder().convert(payload),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        debugPrint('[FCM] token registrado com sucesso');
      } else {
        debugPrint(
            '[FCM] falha ao registrar token: ${res.statusCode} ${res.body}');
      }
    } catch (e) {
      debugPrint('[FCM] erro ao registrar token: $e');
    }
  }
}
