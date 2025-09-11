// lib/features/surveys/local_survey_store.dart
import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// Armazena localmente quais enquetes já foram respondidas neste dispositivo.
/// Implementação simples via arquivo JSON em Application Support.
class LocalSurveyStore {
  LocalSurveyStore();

  bool _loaded = false;
  Set<String> _submitted = <String>{};

  Future<File> _file() async {
    final dir = await getApplicationSupportDirectory();
    return File(p.join(dir.path, 'survey_responses.json'));
  }

  Future<void> _ensureLoaded() async {
    if (_loaded) return;
    try {
      final f = await _file();
      if (await f.exists()) {
        final raw = await f.readAsString();
        final map = jsonDecode(raw) as Map<String, dynamic>;
        final list = (map['submitted'] as List?) ?? const [];
        _submitted = list.map((e) => e.toString()).toSet();
      }
    } catch (_) {
      // ignora erros de leitura/parse
      _submitted = <String>{};
    } finally {
      _loaded = true;
    }
  }

  Future<void> _save() async {
    try {
      final f = await _file();
      final json = jsonEncode({'submitted': _submitted.toList()});
      await f.writeAsString(json, flush: true);
    } catch (_) {
      // ignora erros de escrita
    }
  }

  Future<bool> hasSubmitted(String surveyId) async {
    await _ensureLoaded();
    return _submitted.contains(surveyId);
  }

  Future<void> markSubmitted(String surveyId) async {
    await _ensureLoaded();
    _submitted.add(surveyId);
    await _save();
  }

  // util para testes
  Future<void> clearAll() async {
    _loaded = false;
    _submitted.clear();
    final f = await _file();
    if (await f.exists()) await f.delete();
  }
}
