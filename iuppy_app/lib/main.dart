import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'core/env/app_env.dart';
import 'core/providers.dart';
import 'app/router.dart';
import 'app/theme/theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final container = ProviderContainer();
  runApp(UncontrolledProviderScope(
    container: container,
    child: const IuppyApp(),
  ));
}

class IuppyApp extends ConsumerWidget {
  const IuppyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = ref.watch(appThemeProvider);
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: ref.watch(envProvider).appName,
      theme: theme.light,
      darkTheme: theme.dark,
      routerConfig: router,
    );
  }
}
