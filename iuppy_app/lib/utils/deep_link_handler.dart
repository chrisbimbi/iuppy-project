import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

class DeepLinkHandler {
  /// Processa o payload do Push e navega para a rota correta
  static void handleNotificationClick(
      Map<String, dynamic> data, GoRouter router) {
    debugPrint('[DeepLinkHandler] Processing payload: $data');

    // 1. Tenta extrair o link explícito
    String? link = data['link'] ?? data['deep_link'] ?? data['deepLink'];

    // 2. Fallback: Se não tem link, monta baseado no tipo/ID
    if ((link == null || link.isEmpty) && data['type'] == 'news') {
      final newsId = data['id'] ?? data['newsId'];
      if (newsId != null) {
        link = '/news/article/$newsId';
      }
    }

    if (link != null && link.isNotEmpty) {
      final normalizedPath = _normalize(link);
      debugPrint('🔗 Deep Link Normalizado: $normalizedPath');

      // Usa push para manter a stack de navegação (botão voltar funciona)
      router.push(normalizedPath);
    }
  }

  /// Normaliza a URI (converte iuppy://host/path -> /host/path ou /path)
  static String _normalize(String rawLink) {
    try {
      final uri = Uri.parse(rawLink);

      // Se for path absoluto simples (/news/...)
      if (!uri.hasScheme) {
        return rawLink.startsWith('/') ? rawLink : '/$rawLink';
      }

      // 🔥 CORREÇÃO 1: Aceitar 'iuppy' E 'iuppydev'
      if (uri.scheme == 'iuppy' || uri.scheme == 'iuppydev') {
        // 🔥 CORREÇÃO 2: Mapear host 'contents' (legado) para a rota certa '/news/article'
        if (uri.host == 'contents') {
          // O path original é /UUID. O resultado deve ser /news/article/UUID
          return '/news/article${uri.path}';
        }

        // Caso padrão (ex: iuppydev://news/article/123)
        final buffer = StringBuffer();

        // Se o host não for o domínio principal (ex: iuppy.com), ele faz parte da rota
        // Ex: host 'news' vira '/news'
        if (uri.host.isNotEmpty && !uri.host.contains('.')) {
          buffer.write('/');
          buffer.write(uri.host);
        }

        // Adiciona o path
        if (uri.path.isNotEmpty) {
          if (!uri.path.startsWith('/') && buffer.isEmpty) buffer.write('/');
          buffer.write(uri.path);
        }

        // Adiciona query params se houver
        if (uri.hasQuery) {
          buffer.write('?${uri.query}');
        }

        final result = buffer.toString();
        return result.isEmpty ? '/' : result;
      }

      // Fallback para http/https
      return uri.path;
    } catch (e) {
      debugPrint('[DeepLinkHandler] Erro ao normalizar: $e');
      return '/';
    }
  }
}
