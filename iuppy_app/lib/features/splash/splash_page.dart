import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';
import '../../app/theme/theme.dart';

class SplashPage extends ConsumerWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(companySettingsProvider);
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Theme.of(context).colorScheme.primary.withOpacity(0.1),
              Theme.of(context).scaffoldBackgroundColor,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: FrostedGlass(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 8),
                Text('Bem-vindo',
                    style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                settings.when(
                  data: (s) => Text(s.branding.appSubtitle,
                      style: Theme.of(context).textTheme.bodyLarge),
                  loading: () => const Text('Carregando configurações...'),
                  error: (e, _) => Text('Erro: $e'),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  icon: const Icon(Icons.login),
                  label: const Text('Entrar'),
                  onPressed: () => context.push('/login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
