// lib/main.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';

import 'push_service.dart';
import 'app/router.dart';
import 'core/providers.dart';
// 🔥 Importe o novo helper
import 'utils/deep_link_handler.dart';

import 'package:shared_preferences/shared_preferences.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false; // Prevent crash if offline

  final prefs = await SharedPreferences.getInstance();

  CookieJar jar;
  if (kIsWeb) {
    // Web: Usa CookieJar em memória (não persiste entre reloads, mas funciona)
    jar = CookieJar();
  } else {
    // Mobile/Desktop: Usa FileStorage
    final dir = await getApplicationSupportDirectory();
    final jarPath = p.join(dir.path, 'cookies');
    jar = PersistCookieJar(storage: FileStorage(jarPath));
  }

  // Inicializa Push antes do RunApp
  await PushService.instance.init();

  runApp(
    ProviderScope(
      overrides: [
        cookieJarProvider.overrideWithValue(jar),
        sharedPreferencesProvider.overrideWithValue(prefs),
      ],
      child: const IuppyApp(),
    ),
  );
}

class IuppyApp extends ConsumerStatefulWidget {
  const IuppyApp({super.key});
  @override
  ConsumerState<IuppyApp> createState() => _IuppyAppState();
}

class _IuppyAppState extends ConsumerState<IuppyApp> {
  @override
  void initState() {
    super.initState();

    // 1. Configura o Handler Global de Deep Link (Push)
    PushService.instance.setDeepLinkHandler((link) {
      if (link == null || link.isEmpty) return;
      debugPrint('🔔 Deep Link Recebido no Main: $link');

      // Usa o helper centralizado para limpar a rota e navegar
      final router = ref.read(appRouterProvider);
      DeepLinkHandler.handleNotificationClick({'link': link}, router);
    });

    // 2. Consome notificação inicial (Caso o app tenha sido aberto pelo push)
    // Usa PostFrameCallback para garantir que o Router esteja pronto
    WidgetsBinding.instance.addPostFrameCallback((_) {
      PushService.instance.consumeInitialMessageIfAny();
      // Inicia o listener de tokens e badges
      ref.read(pushBootstrapProvider);
    });

    // Debug log
    PushService.instance.printDebugToken();
  }

  @override
  Widget build(BuildContext context) {
    // Mantém o provider de push ativo
    ref.watch(pushBootstrapProvider);

    final env = ref.watch(envProvider);
    final themePair = ref.watch(appThemeProvider);
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: env.appName,
      theme: themePair.light,
      darkTheme: themePair.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
