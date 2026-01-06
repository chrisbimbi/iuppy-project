// lib/features/surveys/local_survey_store.dart
import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';

class LocalSurveyStore {
  LocalSurveyStore();

  // ==============================================================
  // PARTE 1: CONTROLE DE ENVIO E RESPOSTAS (Arquivo JSON)
  // ==============================================================
  bool _loadedSubmitted = false;
  // Armazena ID -> Lista de Respostas (JSON)
  Map<String, List<dynamic>> _submittedData = {};

  Future<File> _submittedFile() async {
    final dir = await getApplicationSupportDirectory();
    return File(p.join(dir.path, 'survey_responses_v2.json'));
  }

  // 🔥 MIGRAÇÃO: Tenta recuperar arquivo antigo se o novo não existir
  Future<void> _migrateIfNeeded(File newFile) async {
    final dir = await getApplicationSupportDirectory();
    final oldFile = File(p.join(dir.path, 'survey_responses.json'));

    if (!(await newFile.exists()) && (await oldFile.exists())) {
      debugPrint('[SurveyStore] Migrando arquivo v1 -> v2');
      try {
        // Lê o antigo (era { submitted: [id1, id2] })
        final raw = await oldFile.readAsString();
        final map = jsonDecode(raw) as Map<String, dynamic>;
        final list = (map['submitted'] as List?) ?? [];

        // Converte para o formato novo (id -> []) porque não temos as respostas antigas,
        // mas sabemos que foi enviado.
        final newData = <String, List<dynamic>>{};
        for (final id in list) {
          newData[id.toString()] =
              []; // Lista vazia indica "enviado, mas sem dados locais"
        }

        // Salva no novo
        await newFile.writeAsString(jsonEncode(newData));
        // Deleta o antigo (opcional, pode manter como backup)
        // await oldFile.delete();
      } catch (e) {
        debugPrint('[SurveyStore] Erro na migração: $e');
      }
    }
  }

  Future<void> _ensureSubmittedLoaded() async {
    if (_loadedSubmitted) return;
    try {
      final f = await _submittedFile();
      await _migrateIfNeeded(f);

      if (await f.exists()) {
        final raw = await f.readAsString();
        final map = jsonDecode(raw) as Map<String, dynamic>;
        _submittedData = map.cast<String, List<dynamic>>();
      }
    } catch (_) {
      _submittedData = {};
    } finally {
      _loadedSubmitted = true;
    }
  }

  Future<void> _saveSubmitted() async {
    try {
      final f = await _submittedFile();
      final json = jsonEncode(_submittedData);
      await f.writeAsString(json, flush: true);
    } catch (_) {}
  }

  Future<bool> hasSubmitted(String surveyId) async {
    await _ensureSubmittedLoaded();
    return _submittedData.containsKey(surveyId);
  }

  Future<Set<String>> getSubmittedIds() async {
    await _ensureSubmittedLoaded();
    return _submittedData.keys.toSet();
  }

  Future<List<dynamic>?> getSubmissionAnswers(String surveyId) async {
    await _ensureSubmittedLoaded();
    return _submittedData[surveyId];
  }

  Future<void> markSubmitted(
      String surveyId, List<Map<String, dynamic>> answers) async {
    await _ensureSubmittedLoaded();
    _submittedData[surveyId] = answers;
    await _saveSubmitted();
  }

  // ==============================================================
  // PARTE 2: CONTROLE DE VISUALIZAÇÃO (Badge)
  // ==============================================================
  static const _keySeen = 'surveys_seen_ids';

  Future<Set<String>> getSeenIds() async {
    final sp = await SharedPreferences.getInstance();
    return (sp.getStringList(_keySeen) ?? []).toSet();
  }

  Future<void> markAsSeen(String id) async {
    final sp = await SharedPreferences.getInstance();
    final list = (sp.getStringList(_keySeen) ?? []).toSet();
    if (list.add(id)) {
      await sp.setStringList(_keySeen, list.toList());
    }
  }

  // --- Utils ---
  Future<void> clearAll() async {
    _loadedSubmitted = false;
    _submittedData.clear();
    final f = await _submittedFile();
    if (await f.exists()) await f.delete();

    final sp = await SharedPreferences.getInstance();
    await sp.remove(_keySeen);
  }
}
