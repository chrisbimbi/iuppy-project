import 'package:shared_preferences/shared_preferences.dart';

class LocalNewsStore {
  static const _kSeen = 'seen_news_ids';

  Future<Set<String>> _load() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getStringList(_kSeen)?.toSet() ?? <String>{};
  }

  Future<void> _save(Set<String> s) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setStringList(_kSeen, s.toList());
  }

  Future<void> markRead(String id) async {
    if (id.isEmpty) return;
    final s = await _load();
    if (s.add(id)) {
      await _save(s);
    }
  }

  Future<void> markManyRead(Iterable<String> ids) async {
    final s = await _load();
    for (final id in ids) {
      if (id.isNotEmpty) s.add(id);
    }
    await _save(s);
  }

  Future<bool> isRead(String id) async {
    final s = await _load();
    return s.contains(id);
  }

  Future<int> countUnread(Iterable<String> ids) async {
    final s = await _load();
    var c = 0;
    for (final id in ids) {
      if (id.isNotEmpty && !s.contains(id)) c++;
    }
    return c;
  }

  /// Conta não lidas agrupando pelo campo [key] (ex.: 'spaceId', 'channelId').
  Future<Map<String, int>> countUnreadByKey(
      Iterable<Map<String, dynamic>> news, String key) async {
    final seen = await _load();
    final out = <String, int>{};
    for (final n in news) {
      final id = (n['id'] ?? '').toString();
      if (id.isEmpty || seen.contains(id)) continue;
      final k = (n[key] ?? '').toString();
      if (k.isEmpty) continue;
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }

  /// Retorna o conjunto completo de IDs lidos (para contadores agregados).
  Future<Set<String>> allSeenIds() => _load();
}
