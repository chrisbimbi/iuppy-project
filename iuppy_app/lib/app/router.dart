// lib/app/router.dart
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../core/providers.dart';
import '../features/splash/splash_page.dart';
import '../features/auth/login_page.dart';
import '../features/home/home_page.dart';
import '../features/news/news_channel_list_page.dart';
import '../features/news/news_detail_page.dart';
import '../features/surveys/surveys_list_page.dart';
import '../features/surveys/survey_detail_page.dart';

/// Listenable para o GoRouter reagir a mudanças vindas de um Stream.
class GoRouterRefreshStream extends ChangeNotifier {
  late final StreamSubscription _sub;
  GoRouterRefreshStream(Stream<dynamic> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }
  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

final _routerRefreshListenableProvider = Provider<GoRouterRefreshStream>((ref) {
  final authNotifier = ref.watch(authControllerProvider.notifier);
  final listenable = GoRouterRefreshStream(authNotifier.stream);
  ref.onDispose(listenable.dispose);
  return listenable;
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);
  final refreshListenable = ref.watch(_routerRefreshListenableProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final isLoggedIn =
          auth.accessToken != null && auth.accessToken!.isNotEmpty;
      final path = state.uri.path;
      final loggingIn = path == '/login';

      if (!isLoggedIn && !loggingIn && path != '/') {
        return '/login';
      }
      if (isLoggedIn && (loggingIn || path == '/')) {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/home', builder: (_, __) => const HomePage()),
      GoRoute(
        path: '/news/channel/:channelId',
        builder: (_, s) =>
            NewsChannelListPage(channelId: s.pathParameters['channelId']!),
      ),
      GoRoute(
        path: '/news/article/:id',
        builder: (_, s) => NewsDetailPage(id: s.pathParameters['id']!),
      ),
      GoRoute(path: '/surveys', builder: (_, __) => const SurveysListPage()),
      GoRoute(
        path: '/surveys/:id',
        builder: (_, s) => SurveyDetailPage(id: s.pathParameters['id']!),
      ),
      GoRoute(
          path: '/settings',
          builder: (_, __) => const _Stub(title: 'Configurações')),
      GoRoute(
          path: '/favorites',
          builder: (_, __) => const _Stub(title: 'Favoritos')),
      GoRoute(
          path: '/groups', builder: (_, __) => const _Stub(title: 'Grupos')),
      GoRoute(
          path: '/notifications',
          builder: (_, __) => const _Stub(title: 'Notificações')),
    ],
  );
});

class _Stub extends StatelessWidget {
  final String title;
  const _Stub({required this.title});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
            tooltip: 'Voltar',
          ),
          title: Text(title),
        ),
        body: const Center(child: Text('Em breve')));
  }
}
