import 'package:shared_preferences/shared_preferences.dart';

class LocalFormStore {
  static const _keySeen = 'forms_seen_ids';

  // Recupera lista de IDs já vistos
  Future<Set<String>> getSeenIds() async {
    final sp = await SharedPreferences.getInstance();
    return (sp.getStringList(_keySeen) ?? []).toSet();
  }

  // Marca um ID como visto
  Future<void> markAsSeen(String id) async {
    final sp = await SharedPreferences.getInstance();
    final list = (sp.getStringList(_keySeen) ?? []).toSet();
    if (list.add(id)) {
      await sp.setStringList(_keySeen, list.toList());
    }
  }

  // Limpa memória (opcional, para debug)
  Future<void> clear() async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(_keySeen);
  }
}
