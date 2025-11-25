// lib/features/notifications/notifications_provider.dart
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../core/providers.dart';
import '../forms/providers/forms_provider.dart';
import '../forms/local_form_store.dart';

enum NotificationType {
  news,
  formNew,
  formReply,
  survey,
}

class NotificationItem {
  final String id;
  final String title;
  final String? subtitle;
  final DateTime date;
  final NotificationType type;
  final bool isRead;
  final Map<String, dynamic> payload;
  final String? subtype;

  NotificationItem({
    required this.id,
    required this.title,
    this.subtitle,
    required this.date,
    required this.type,
    required this.isRead,
    required this.payload,
    this.subtype,
  });
}

final notificationsListProvider =
    FutureProvider.autoDispose<List<NotificationItem>>((ref) async {
  ref.watch(feedVersionProvider);
  ref.watch(formsRefreshProvider);
  ref.watch(formsSeenVersionProvider);

  final items = <NotificationItem>[];

  // 1. NOTÍCIAS
  try {
    final newsList = await ref
        .watch(homeFeedProvider(null).future)
        .catchError((_) => <Map<String, dynamic>>[]);
    final localNewsStore = ref.read(localNewsStoreProvider);

    for (final n in newsList) {
      final id = n['id']?.toString() ?? '';
      if (id.isEmpty) continue;

      final isRead = await localNewsStore.isRead(id);
      final dateStr =
          n['publishedAt']?.toString() ?? n['createdAt']?.toString();
      final date = DateTime.tryParse(dateStr ?? '') ?? DateTime.now();

      items.add(NotificationItem(
        id: id,
        title: n['title']?.toString() ?? 'Nova Notícia',
        subtitle: n['subtitle']?.toString() ?? 'Toque para ler mais.',
        date: date,
        type: NotificationType.news,
        isRead: isRead,
        payload: {'newsId': id},
      ));
    }
  } catch (_) {}

  // 2. NOVOS FORMULÁRIOS
  try {
    final formsList = await ref
        .watch(formsListProvider.future)
        .catchError((_) => <Map<String, dynamic>>[]);
    final seenIds = await ref.read(localFormStoreProvider).getSeenIds();

    final now = DateTime.now();
    final threeDaysAgo = now.subtract(const Duration(days: 3));

    for (final f in formsList) {
      final id = f['id']?.toString() ?? '';
      if (id.isEmpty) continue;

      final isRead = seenIds.contains(id);
      final pubStr = f['publishedAt']?.toString() ?? f['createdAt']?.toString();
      final pubDate = DateTime.tryParse(pubStr ?? '') ?? DateTime.now();

      if (pubDate.isAfter(threeDaysAgo) || !isRead) {
        final rawTitle = f['title'];
        String title = 'Novo Formulário';
        if (rawTitle is String) title = rawTitle;
        if (rawTitle is Map)
          title =
              rawTitle['pt-BR'] ?? rawTitle.values.first ?? 'Novo Formulário';

        items.add(NotificationItem(
          id: id,
          title: title,
          subtitle: 'Formulário disponível para preenchimento.',
          date: pubDate,
          type: NotificationType.formNew,
          isRead: isRead,
          payload: {'formId': id},
        ));
      }
    }
  } catch (_) {}

  // 3. INTERAÇÕES GRANULARES (Chat + Ações)
  try {
    // Pega o mapa de 'unread' para saber quantas mensagens novas temos por submissão
    final mySubs = await ref.watch(myFormsSubmissionsProvider.future);
    final subsList = (mySubs['items'] as List? ?? []);
    // chave = submissionId, valor = qtd não lida
    final unreadMap = {
      for (var s in subsList)
        s['submissionId'].toString(): (s['unreadChatCount'] as int? ?? 0)
    };

    // Busca histórico granular
    final interactions =
        await ref.read(formsRepoProvider).myInteractions(limit: 50);

    // Contador para saber quais são as 'top N' mensagens não lidas
    final processedCounts = <String, int>{};

    for (final item in interactions) {
      final subId = item['submissionId']?.toString() ?? '';
      final type = item['type']?.toString() ?? 'chat'; // chat, approve, reject

      final totalUnread = unreadMap[subId] ?? 0;
      final currentProcessed = processedCounts[subId] ?? 0;

      // Se ainda não "consumimos" todas as não lidas dessa submissão, este item é novo
      final isRead = currentProcessed >= totalUnread;
      if (!isRead) processedCounts[subId] = currentProcessed + 1;

      final date =
          DateTime.tryParse(item['date']?.toString() ?? '') ?? DateTime.now();

      final rawTitle = item['formTitle'];
      String title = 'Formulário';
      if (rawTitle != null) {
        if (rawTitle is String)
          title = rawTitle;
        else if (rawTitle is Map) title = rawTitle['pt-BR'] ?? 'Formulário';
      }

      String subtitle = item['message']?.toString() ?? '';
      String subtype = 'chat';

      if (type == 'approve') {
        subtitle = 'Sua solicitação foi Aprovada! 🎉';
        subtype = 'approve';
      } else if (type == 'reject') {
        subtitle = 'Sua solicitação foi Reprovada.';
        subtype = 'reject';
      } else {
        subtype = 'chat';
        if (subtitle.isEmpty) subtitle = 'Nova mensagem recebida.';
      }

      items.add(NotificationItem(
        id: item['id']?.toString() ?? '',
        title: title,
        subtitle: subtitle,
        date: date,
        type: NotificationType.formReply,
        isRead: isRead,
        subtype: subtype,
        payload: {
          'formId': item['formId'],
          'submissionId': subId,
        },
      ));
    }
  } catch (e) {
    debugPrint('[NotifProvider] Erro Interações: $e');
  }

  // 4. ENQUETES
  try {
    final surveysRepo = ref.read(surveysRepoProvider);
    final surveys = await surveysRepo
        .list(limit: 20)
        .catchError((_) => <Map<String, dynamic>>[]);

    for (final s in surveys) {
      final id = s['id']?.toString() ?? '';
      final title = s['title']?.toString() ?? 'Nova Enquete';
      final dateStr = s['startsAt']?.toString() ?? s['createdAt']?.toString();
      final date = DateTime.tryParse(dateStr ?? '') ?? DateTime.now();

      items.add(NotificationItem(
        id: id,
        title: title,
        subtitle: 'Participe da nossa pesquisa.',
        date: date,
        type: NotificationType.survey,
        isRead: true,
        payload: {'surveyId': id},
      ));
    }
  } catch (_) {}

  items.sort((a, b) => b.date.compareTo(a.date));

  return items;
});
