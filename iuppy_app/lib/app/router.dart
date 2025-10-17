import 'dart:async';
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

Uri _normalizeDeepLinkUri(Uri uri) {
  if (uri.hasScheme &&
      uri.scheme.isNotEmpty &&
      uri.scheme != 'http' &&
      uri.scheme != 'https') {
    if (uri.host == 'surveys') {
      return Uri(
        path: '/surveys${uri.path}',
        query: uri.query.isEmpty ? null : uri.query,
        fragment: uri.fragment.isEmpty ? null : uri.fragment,
      );
    }
    if (uri.host == 'news') {
      return Uri(
        path: '/news${uri.path}',
        query: uri.query.isEmpty ? null : uri.query,
        fragment: uri.fragment.isEmpty ? null : uri.fragment,
      );
    }
    return Uri(
      path: uri.path.isEmpty ? '/' : uri.path,
      query: uri.query.isEmpty ? null : uri.query,
      fragment: uri.fragment.isEmpty ? null : uri.fragment,
    );
  }
  return uri;
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
  final navigatorKey = ref.watch(rootNavigatorKeyProvider);

  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final isLoggedIn = (auth.accessToken ?? '').isNotEmpty;

      final normalized = _normalizeDeepLinkUri(state.uri);
      final path = normalized.path;
      final loggingIn = path == '/login';

      if (!isLoggedIn) {
        if (!loggingIn && path != '/') {
          final from = Uri.encodeComponent(normalized.toString());
          return '/login?from=$from';
        }
        return null;
      }

      if (loggingIn) {
        final fromParam = state.uri.queryParameters['from'];
        if (fromParam != null && fromParam.isNotEmpty) {
          final decoded = Uri.decodeComponent(fromParam);
          final goTo = _normalizeDeepLinkUri(Uri.parse(decoded));
          return goTo.toString();
        }
        return '/home';
      }

      if (path == '/') return '/home';

      return null;
    },
    errorBuilder: (context, state) {
      final uri = _normalizeDeepLinkUri(state.uri);
      if (uri.path != state.uri.path) {
        Future.microtask(() => context.go(uri.toString()));
        return const SizedBox.shrink();
      }
      return Scaffold(
        appBar: AppBar(
          title: const Text('Página não encontrada'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              final r = GoRouter.of(context);
              if (r.canPop()) {
                r.pop();
              } else {
                r.go('/home');
              }
            },
          ),
        ),
        body: Center(
          child: Text('Rota inválida: ${state.uri.toString()}'),
        ),
      );
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashPage()),
      GoRoute(
        path: '/login',
        builder: (_, s) => LoginPage(from: s.uri.queryParameters['from']),
      ),
      GoRoute(path: '/home', builder: (_, __) => const HomePage()),
      GoRoute(
        path: '/news/channel/:channelId',
        builder: (_, s) =>
            NewsChannelListPage(channelId: s.pathParameters['channelId']!),
      ),
      GoRoute(
        path: '/news/article/:id',
        name: 'news-detail',
        pageBuilder: (context, state) {
          final cameFromPush =
              (state.uri.queryParameters['cameFromPush'] ?? '') == '1';
          final mid = state.uri.queryParameters['mid'];
          return MaterialPage(
            key: state.pageKey,
            child: NewsDetailPage(
              id: state.pathParameters['id']!,
              cameFromPush: cameFromPush,
              pushMessageId: mid,
            ),
          );
        },
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
  const _Stub({required this.title, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            final r = GoRouter.of(context);
            if (r.canPop()) {
              r.pop();
            } else {
              r.go('/home');
            }
          },
          tooltip: 'Voltar',
        ),
      ),
      body: const Center(child: Text('Em breve')),
    );
  }
}
