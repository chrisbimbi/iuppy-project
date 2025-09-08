// lib/data/local/app_database.dart
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

class Spaces extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  BoolColumn get active => boolean().withDefault(const Constant(true))();
  IntColumn get priority => integer().withDefault(const Constant(0))();
  @override
  Set<Column> get primaryKey => {id};
}

class Channels extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get description => text().nullable()();
  TextColumn get spaceId => text()();
  BoolColumn get active => boolean().withDefault(const Constant(true))();
  IntColumn get priority => integer().withDefault(const Constant(0))();
  @override
  Set<Column> get primaryKey => {id};
}

class NewsItems extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get content => text().nullable()();
  TextColumn get channelId => text()();
  DateTimeColumn get createdAt => dateTime().nullable()();
  BoolColumn get isPublished => boolean().withDefault(const Constant(true))();
  @override
  Set<Column> get primaryKey => {id};
}

class Surveys extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  BoolColumn get active => boolean().withDefault(const Constant(true))();
  DateTimeColumn get createdAt => dateTime().nullable()();
  @override
  Set<Column> get primaryKey => {id};
}

/// ATENÇÃO: o nome do getter não pode ser `text` (conflita com o builder `text()`).
class SurveyQuestions extends Table {
  TextColumn get id => text()();
  TextColumn get surveyId => text()();
  TextColumn get label => text()(); // <— era `text`
  TextColumn get type =>
      text()(); // single_choice, multiple_choice, text, scale...
  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [Spaces, Channels, NewsItems, Surveys, SurveyQuestions])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'iuppy.db'));

  @override
  int get schemaVersion => 1;

  // Cache upserts
  Future<void> cacheSpaces(List<Map<String, dynamic>> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(
        spaces,
        items
            .map((m) => SpacesCompanion.insert(
                  id: m['id'] as String,
                  name: m['name'] as String? ?? '',
                  description: Value(m['description'] as String?),
                  active: Value((m['active'] as bool?) ?? true),
                  priority: Value((m['priority'] as int?) ?? 0),
                ))
            .toList(),
      );
    });
  }

  Future<void> cacheChannels(List<Map<String, dynamic>> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(
        channels,
        items
            .map((m) => ChannelsCompanion.insert(
                  id: m['id'] as String,
                  name: m['name'] as String? ?? '',
                  description: Value(m['description'] as String?),
                  spaceId: m['spaceId'] as String? ??
                      (m['spaceIds'] is List &&
                              (m['spaceIds'] as List).isNotEmpty
                          ? (m['spaceIds'] as List).first as String
                          : ''),
                  active: Value((m['active'] as bool?) ?? true),
                  priority: Value((m['priority'] as int?) ?? 0),
                ))
            .toList(),
      );
    });
  }

  Future<void> cacheNews(List<Map<String, dynamic>> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(
        newsItems,
        items
            .map((m) => NewsItemsCompanion.insert(
                  id: m['id'] as String,
                  title: m['title'] as String? ?? '',
                  content: Value(m['content'] as String?),
                  channelId: m['channelId'] as String? ?? '',
                  createdAt: Value(DateTime.tryParse(
                      (m['createdAt'] ?? '') as String? ?? '')),
                  isPublished: Value((m['isPublished'] as bool?) ?? true),
                ))
            .toList(),
      );
    });
  }

  Future<void> cacheSurveys(List<Map<String, dynamic>> items) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(
        surveys,
        items
            .map((m) => SurveysCompanion.insert(
                  id: m['id'] as String,
                  title: m['title'] as String? ?? '',
                  description: Value(m['description'] as String?),
                  active: Value((m['active'] as bool?) ?? true),
                  createdAt: Value(DateTime.tryParse(
                      (m['createdAt'] ?? '') as String? ?? '')),
                ))
            .toList(),
      );

      // cache de perguntas se vierem no payload
      final q = <SurveyQuestionsCompanion>[];
      for (final m in items) {
        final List qs = (m['questions'] as List?) ?? const [];
        for (final e in qs) {
          final me = Map<String, dynamic>.from(e as Map);
          q.add(SurveyQuestionsCompanion.insert(
            id: me['id'] as String,
            surveyId: m['id'] as String,
            label: me['text'] as String? ?? '', // API 'text' -> coluna 'label'
            type: me['type'] as String? ?? 'text',
          ));
        }
      }
      if (q.isNotEmpty) {
        b.insertAllOnConflictUpdate(surveyQuestions, q);
      }
    });
  }

  // Queries
  Future<List<Map<String, dynamic>>> getSpaces() async {
    final rows = await select(spaces).get();
    return rows
        .map((r) => {
              'id': r.id,
              'name': r.name,
              'description': r.description,
              'priority': r.priority,
              'active': r.active
            })
        .toList();
  }

  Future<List<Map<String, dynamic>>> getChannels({String? spaceId}) async {
    final q = select(channels);
    if (spaceId != null && spaceId.isNotEmpty) {
      q.where((tbl) => tbl.spaceId.equals(spaceId));
    }
    final rows = await q.get();
    return rows
        .map((r) => {
              'id': r.id,
              'name': r.name,
              'description': r.description,
              'spaceId': r.spaceId
            })
        .toList();
  }

  Future<List<Map<String, dynamic>>> getNews({int limit = 3}) async {
    final q = (select(newsItems)
      ..orderBy([
        (t) => OrderingTerm(expression: t.createdAt, mode: OrderingMode.desc)
      ])
      ..limit(limit));
    final rows = await q.get();
    return rows
        .map((r) => {
              'id': r.id,
              'title': r.title,
              'channelId': r.channelId,
              'createdAt': r.createdAt?.toIso8601String()
            })
        .toList();
  }

  Future<List<Map<String, dynamic>>> getSurveys({int limit = 3}) async {
    final q = (select(surveys)
      ..orderBy([
        (t) => OrderingTerm(expression: t.createdAt, mode: OrderingMode.desc)
      ])
      ..limit(limit));
    final rows = await q.get();
    return rows
        .map((r) => {
              'id': r.id,
              'title': r.title,
              'createdAt': r.createdAt?.toIso8601String()
            })
        .toList();
  }
}
