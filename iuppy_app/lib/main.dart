// lib/main.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'core/providers.dart';
import 'app/router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: IuppyApp()));
}

class IuppyApp extends ConsumerWidget {
  const IuppyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final env = ref.watch(envProvider);
    final themePair = ref.watch(appThemeProvider);
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: env.appName,
      theme: themePair.light,
      darkTheme: themePair.dark,
      themeMode: ThemeMode.system,
      routerConfig: router, // 👈 usa o GoRouter direto
    );
  }
}
