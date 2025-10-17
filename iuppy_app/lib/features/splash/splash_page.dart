// lib/features/splash/splash_page.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';
import '../../app/theme/theme.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();

    // Garante o fetch dos settings e, se já autenticado, manda pra Home.
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      // 1) Carrega os company settings (isso aplica o tema)
      CompanySettingsState? settings;
      try {
        settings = await ref.read(companySettingsProvider.future);
      } catch (_) {
        // silencioso — UI já mostra o erro via .when()
      }
      if (!mounted) return;

      // 2) Se já estiver autenticado, após carregar settings vamos pra Home
      final isAuthed =
          (ref.read(authControllerProvider).accessToken ?? '').isNotEmpty;
      if (isAuthed) {
        context.go('/home');
        return;
      }

      // 3) Se não está autenticado, fica na Splash (botão "Entrar" leva os settings via extra)
      setState(() {}); // só pra repintar se necessário
    });
  }

  @override
  Widget build(BuildContext context) {
    final settingsAsync = ref.watch(companySettingsProvider);

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
                settingsAsync.when(
                  data: (s) => Text(s.branding.appSubtitle,
                      style: Theme.of(context).textTheme.bodyLarge),
                  loading: () => const Text('Carregando configurações...'),
                  error: (e, _) => Text('Erro: $e'),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  icon: const Icon(Icons.login),
                  label: const Text('Entrar'),
                  onPressed: settingsAsync.maybeWhen(
                    data: (s) => () => context.push('/login', extra: s),
                    orElse: () => null, // desabilita enquanto carrega
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
