// lib/main.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:cookie_jar/cookie_jar.dart';

import 'push_service.dart';
import 'app/router.dart';
import 'core/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 🔐 CookieJar persistente no diretório do app (evita “Read-only file system”)
  final dir = await getApplicationSupportDirectory();
  final jarPath = p.join(dir.path, 'cookies'); // p.ex. /data/.../cookies
  final jar = PersistCookieJar(storage: FileStorage(jarPath));

  await PushService.instance.init();

  runApp(
    ProviderScope(
      // 👉 injeta a MESMA instância para todo o app (auth/login, refresh e dio principal)
      overrides: [cookieJarProvider.overrideWithValue(jar)],
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

    // Deep links via push
    PushService.instance.setDeepLinkHandler((link) {
      if (link == null || link.isEmpty) return;
      final uri = Uri.parse(link);
      final segments = <String>[];
      if (uri.host.isNotEmpty) segments.add(uri.host);
      if (uri.pathSegments.isNotEmpty) segments.addAll(uri.pathSegments);
      final path = '/${segments.join('/')}';
      final query = uri.hasQuery ? '?${uri.query}' : '';
      ref.read(appRouterProvider).go(path + query);
    });

    PushService.instance.consumeInitialMessageIfAny();
    PushService.instance.printDebugToken();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<UserProfile?>>(
      userProfileProvider,
      (prev, next) async {
        if (next.hasValue && next.value?.id != null) {
          final env = ref.read(envProvider);
          await PushService.instance.askPermissionAndRegister(
            userId: next.value!.id!,
            companyId: env.companyId,
            apiBaseUrl: env.apiBaseUrl,
          );
        }
      },
    );

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
