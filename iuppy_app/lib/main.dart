// lib/main.dart (FINAL)
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/push_service.dart';

import 'app/router.dart';
import 'core/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushService.instance.init();
  runApp(const ProviderScope(child: IuppyApp()));
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

    // Navegação de deep links vinda de push
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

    // Se o app abriu pela notificação (app finalizado)
    PushService.instance.consumeInitialMessageIfAny();

    // 👉 imprime token mesmo sem login (pra debug)
    PushService.instance.printDebugToken();
  }

  @override
  Widget build(BuildContext context) {
    // Aqui PODE usar ref.listen
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
