import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  bool _showLogo = false;
  CompanySettingsState? _loadedSettings;
  String? _error;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      // 1. Carrega dados + Tempo mínimo de "suspense"
      final minWait = Future.delayed(const Duration(seconds: 2));
      final settingsFuture = ref.read(companySettingsProvider.future);

      final results = await Future.wait([minWait, settingsFuture]);

      if (!mounted) return;

      final settings = results[1] as CompanySettingsState;

      setState(() {
        _loadedSettings = settings;
        _showLogo = true; // 💥 BOOM: Logo aparece
      });

      // 2. Tempo de apreciação da marca
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;

      // 3. Navegação
      final auth = ref.read(authControllerProvider);
      final isAuthed = (auth.accessToken ?? '').isNotEmpty;

      if (isAuthed) {
        context.go('/home');
      } else {
        context.go('/login', extra: settings);
      }
    } catch (e) {
      if (mounted) {
        setState(() =>
            _error = 'Não foi possível conectar.\nVerifique sua internet.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Cor de fundo baseada na marca (bem suave)
    final brandColor = _loadedSettings != null
        ? Color(_loadedSettings!.branding.primary)
        : Colors.blue; // Fallback enquanto carrega

    return Scaffold(
      body: Stack(
        children: [
          // Fundo Animado
          AnimatedContainer(
            duration: const Duration(seconds: 1),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: _showLogo
                    ? [
                        Colors.white,
                        brandColor.withValues(alpha: 0.05)
                      ] // Gradiente sutil quando carrega
                    : [Colors.white, Colors.white], // Branco puro no início
              ),
            ),
          ),

          // Conteúdo Central
          Center(
            child: _error != null
                ? _ErrorView(error: _error!, onRetry: _bootstrap)
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // A LOGO COM GLOW MÁGICO
                      AnimatedOpacity(
                        duration: const Duration(milliseconds: 1200),
                        opacity: _showLogo ? 1.0 : 0.0,
                        curve: Curves.easeOut,
                        child: TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0.6, end: 1.0),
                          duration: const Duration(milliseconds: 1000),
                          curve: Curves.easeOutBack, // Efeito elástico "Pop"
                          builder: (context, scale, child) {
                            return Transform.scale(
                              scale: scale,
                              child: _LogoOrTitle(
                                logoUrl: _loadedSettings?.branding.logoUrl,
                                title: _loadedSettings?.branding.appTitle ??
                                    'Iuppy',
                                color: brandColor,
                              ),
                            );
                          },
                        ),
                      ),

                      // Loader que some quando a logo aparece
                      if (!_showLogo)
                        const Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _LogoOrTitle extends StatelessWidget {
  final String? logoUrl;
  final String title;
  final Color color;

  const _LogoOrTitle({this.logoUrl, required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    // Se tiver logo, mostra ela GIGANTE com GLOW
    if (logoUrl != null && logoUrl!.isNotEmpty) {
      return Stack(
        alignment: Alignment.center,
        children: [
          // 1. O Glow (Aura) atrás da logo
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.3), // Cor da marca transparente
                  blurRadius: 100, // MUITO blur (espalhado)
                  spreadRadius: 30, // Espalha bastante
                ),
              ],
            ),
          ),

          // 2. A Logo em si
          Container(
            constraints: const BoxConstraints(
              maxWidth: 320, // Bem largo
              maxHeight: 200, // Bem alto
            ),
            padding: const EdgeInsets.all(20),
            child: Image.network(
              logoUrl!,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) =>
                  _TitleText(title: title, color: color),
            ),
          ),
        ],
      );
    }

    // Fallback se não tiver imagem
    return _TitleText(title: title, color: color);
  }
}

class _TitleText extends StatelessWidget {
  final String title;
  final Color color;
  const _TitleText({required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Glow para o texto também
        Container(
          width: 150,
          height: 60,
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.25),
                blurRadius: 80,
                spreadRadius: 40,
              ),
            ],
          ),
        ),
        Text(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 40, // Fonte gigante
            fontWeight: FontWeight.w900,
            color: color,
            letterSpacing: 2.0,
          ),
        ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorView({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.wifi_off_rounded, size: 48, color: Colors.grey.shade300),
        const SizedBox(height: 16),
        Text(
          error,
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey.shade500),
        ),
        const SizedBox(height: 24),
        TextButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: const Text('Tentar novamente'),
        )
      ],
    );
  }
}
