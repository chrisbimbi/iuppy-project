import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:iuppy_app/data/remote/api_client.dart';

/// VM imutável consumida pela tela
class NewsDetailVM {
  final Map<String, dynamic> raw;

  // header
  final List<String> images;
  final String title;
  final String subtitle;

  final String? authorId;
  final String? authorName;
  final String? authorAvatarUrl;

  final String? createdAtStr;
  final String? updatedAtStr;

  final String? spaceName;
  final List<String> channelNames;

  // conteúdo
  final String contentHtml;
  final List<({String name, String url})> attachments;

  // flags
  final bool allowReactions;
  final bool allowComments;
  final bool commentsModerated;
  final bool shareEnabled;
  final bool ackRequired;
  final bool acknowledged;

  // interações/contagens
  final Map<String, int> reactsByType;
  final int totalReacts;
  final int commentsShown;
  final int shares;
  final String? myReaction;

  // amostras (react/comment/share)
  final List<({String name, String avatar})> reactorsSample;
  final List<({String name, String avatar})> commentersSample;
  final List<({String name, String avatar})> sharersSample;

  // prévias de comentários
  final List<({String name, String avatar, String text})> previewComments;

  // share metadata
  final String deeplink;
  final String shareText;

  const NewsDetailVM({
    required this.raw,
    required this.images,
    required this.title,
    required this.subtitle,
    required this.authorId,
    required this.authorName,
    required this.authorAvatarUrl,
    required this.createdAtStr,
    required this.updatedAtStr,
    required this.spaceName,
    required this.channelNames,
    required this.contentHtml,
    required this.attachments,
    required this.allowReactions,
    required this.allowComments,
    required this.commentsModerated,
    required this.shareEnabled,
    required this.ackRequired,
    required this.acknowledged,
    required this.reactsByType,
    required this.totalReacts,
    required this.commentsShown,
    required this.shares,
    required this.myReaction,
    required this.reactorsSample,
    required this.commentersSample,
    required this.sharersSample,
    required this.previewComments,
    required this.deeplink,
    required this.shareText,
  });

  NewsDetailVM copyWith({
    Map<String, dynamic>? raw,
    List<String>? images,
    String? title,
    String? subtitle,
    String? authorId,
    String? authorName,
    String? authorAvatarUrl,
    String? createdAtStr,
    String? updatedAtStr,
    String? spaceName,
    List<String>? channelNames,
    String? contentHtml,
    List<({String name, String url})>? attachments,
    bool? allowReactions,
    bool? allowComments,
    bool? commentsModerated,
    bool? shareEnabled,
    bool? ackRequired,
    bool? acknowledged,
    Map<String, int>? reactsByType,
    int? totalReacts,
    int? commentsShown,
    int? shares,
    String? myReaction,
    List<({String name, String avatar})>? reactorsSample,
    List<({String name, String avatar})>? commentersSample,
    List<({String name, String avatar})>? sharersSample,
    List<({String name, String avatar, String text})>? previewComments,
    String? deeplink,
    String? shareText,
  }) {
    return NewsDetailVM(
      raw: raw ?? this.raw,
      images: images ?? this.images,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      authorId: authorId ?? this.authorId,
      authorName: authorName ?? this.authorName,
      authorAvatarUrl: authorAvatarUrl ?? this.authorAvatarUrl,
      createdAtStr: createdAtStr ?? this.createdAtStr,
      updatedAtStr: updatedAtStr ?? this.updatedAtStr,
      spaceName: spaceName ?? this.spaceName,
      channelNames: channelNames ?? this.channelNames,
      contentHtml: contentHtml ?? this.contentHtml,
      attachments: attachments ?? this.attachments,
      allowReactions: allowReactions ?? this.allowReactions,
      allowComments: allowComments ?? this.allowComments,
      commentsModerated: commentsModerated ?? this.commentsModerated,
      shareEnabled: shareEnabled ?? this.shareEnabled,
      ackRequired: ackRequired ?? this.ackRequired,
      acknowledged: acknowledged ?? this.acknowledged,
      reactsByType: reactsByType ?? this.reactsByType,
      totalReacts: totalReacts ?? this.totalReacts,
      commentsShown: commentsShown ?? this.commentsShown,
      shares: shares ?? this.shares,
      myReaction: myReaction ?? this.myReaction,
      reactorsSample: reactorsSample ?? this.reactorsSample,
      commentersSample: commentersSample ?? this.commentersSample,
      sharersSample: sharersSample ?? this.sharersSample,
      previewComments: previewComments ?? this.previewComments,
      deeplink: deeplink ?? this.deeplink,
      shareText: shareText ?? this.shareText,
    );
  }
}

class NewsDetailController extends ChangeNotifier {
  final CancelToken _ct = CancelToken();
  bool _throttleAck = false;
  bool _throttleReact = false;
  DateTime? _lastReactAt;
  DateTime? _lastAckAt;

  NewsDetailController(
    this.onOpen, {
    required this.api,
    required this.env,
    required this.newsId,
  });

  final ApiClient api;
  final void Function()? onOpen;
  final dynamic env; // tem appScheme
  final String newsId;

  NewsDetailVM? _vm;
  NewsDetailVM? get vm => _vm;
  bool get loading => _vm == null;

  Map<String, dynamic>? _me; // cache para atualizações otimistas
  String get _meName =>
      (_me?['displayName'] as String?)?.trim().isNotEmpty == true
          ? _me!['displayName']
          : (('${_me?['name'] ?? ''}'.trim().isNotEmpty
              ? '${_me?['name']}'
              : 'Você'));

  String get _meAvatar {
    final m = _me ?? const {};
    final candidates = [
      m['avatarUrl'],
      m['avatar'],
      m['photoUrl'],
      m['photo'],
      m['imageUrl'],
      m['picture'],
      m['profileImage'],
      m['profileImageUrl'],
      m['profilePhoto'],
      m['profile_photo_url'],
      m['avatarPath'],
    ];
    String url = '';
    for (final c in candidates) {
      final s = (c == null) ? '' : '$c';
      final st = s.trim();
      if (st.isNotEmpty &&
          st.toLowerCase() != 'false' &&
          st.toLowerCase() != 'null') {
        url = st;
        break;
      }
    }
    return _normalizeUrl(url);
  }

  String _normalizeUrl(String u) {
    if (u.isEmpty) return '';
    final lo = u.toLowerCase();
    if (lo == 'false' || lo == 'null') return '';
    if (u.startsWith('http://') ||
        u.startsWith('https://') ||
        u.startsWith('data:image')) {
      return u;
    }
    final base = (api.baseUrl.isNotEmpty ? api.baseUrl : null) ??
        (env is Map ? (env['apiBaseUrl'] ?? env['baseUrl']) : null) ??
        (env?.apiBaseUrl) ??
        '';
    if (base is String && base.isNotEmpty) {
      final b = base.trim();
      final needsSlash = !(b.endsWith('/') || u.startsWith('/'));
      return '$b${needsSlash ? '/' : ''}$u';
    }
    return u;
  }

  bool _listHasMe(List<({String name, String avatar})> list) {
    final me = _meName.trim().toLowerCase();
    final a = _meAvatar.trim();
    return list.any((e) =>
        e.name.trim().toLowerCase() == me ||
        (a.isNotEmpty && e.avatar.trim() == a));
  }

  // ————————————————————— utils
  int _num(dynamic v) {
    if (v is num) return v.toInt();
    if (v == null) return 0;
    return int.tryParse('$v') ?? 0;
  }

  String? _fmtDate(String? iso) {
    if (iso == null || iso.isEmpty) return null;
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return null;
    String two(int n) => n < 10 ? '0$n' : '$n';
    final yy = dt.year % 100;
    return '${two(dt.day)}/${two(dt.month)}/${two(yy)} - ${two(dt.hour)}:${two(dt.minute)}';
  }

  List<String> _images(dynamic raw) {
    if (raw == null) return const [];
    if (raw is String) return raw.startsWith('http') ? [raw] : const [];
    if (raw is List) {
      return raw
          .map((e) => '$e')
          .where((s) => s.startsWith('http://') || s.startsWith('https://'))
          .toList();
    }
    return const [];
  }

  List<({String name, String url})> _attachments(dynamic raw) {
    if (raw is List) {
      return raw
          .map((e) => '$e')
          .where((s) => s.isNotEmpty)
          .map((u) => (name: '', url: u))
          .toList();
    }
    return const [];
  }

  List<String> _channelsFrom(dynamic data) {
    final names = <String>[];
    final v = data['channels'] ?? data['channelNames'];
    if (v is List) {
      for (final e in v) {
        final s = (e is Map ? (e['name'] ?? e['title']) : e) ?? '';
        final t = '$s'.trim();
        if (t.isNotEmpty) names.add(t);
      }
    }
    final single = '${data['channelName'] ?? ''}'.trim();
    if (single.isNotEmpty && !names.contains(single)) names.add(single);
    return names;
  }

  bool _moderated(Map s) {
    final keys = [
      'commentsRequireModeration',
      'moderateComments',
      'commentsModerated',
      'requireModeration',
      'moderation',
      'comments_moderated'
    ];
    for (final k in keys) {
      final v = s[k];
      if (v == true || (v is String && v.toLowerCase() == 'true')) return true;
    }
    return false;
  }

  // ————————————————————— LOAD
  Future<void> load() async {
    _me ??= await api.getMe(); // p/ otimistas (nome+avatar)

    final data = await api.getNewsDetail(newsId, cancelToken: _ct);
    if (kDebugMode) {
      debugPrint('[NEWS:$newsId] raw.userState=${data['userState']}');
      debugPrint('[NEWS:$newsId] raw.settings=${data['settings']}');
    }

    int _toInt(dynamic v, [int d = 0]) {
      if (v == null) return d;
      final n = int.tryParse('$v');
      return n ?? d;
    }

    List<Map<String, dynamic>> _asListOfMap(dynamic v) {
      final raw = (v is List) ? v : const [];
      return raw
          .where((e) => e is Map)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }

    String _str(dynamic v) => (v == null) ? '' : '$v';

    // Principais
    final title = _str(data['title']).trim();
    final subtitle = _str(data['subtitle']).trim();
    final spaceName = _str(data['spaceName']).trim();
    final channelNames = _channelsFrom(data);
    final contentHtml = _str(
      _str(data['contentHtml']).isNotEmpty
          ? data['contentHtml']
          : data['content'],
    );

    // Autor
    final authorId =
        _str(data['authorId']).trim().isEmpty ? null : _str(data['authorId']);
    final authorName = _str(data['authorName']).trim().isEmpty
        ? null
        : _str(data['authorName']);
    final authorAvatarUrl = _str(data['authorAvatarUrl']).trim().isEmpty
        ? null
        : _str(data['authorAvatarUrl']);

    // Settings
    final settings = (data['settings'] as Map?) ?? const {};
    final allowReactions = (settings['allowReactions'] ?? true) == true;
    final allowComments = (settings['allowComments'] ?? true) == true;
    final commentsModerated = _moderated(settings);
    final shareEnabled =
        (settings['allowSharing'] ?? settings['shareEnabled'] ?? true) == true;
    final ackRequired = (settings['acknowledgementRequired'] ?? false) == true;

    // Métricas
    final metrics = (data['metrics'] as Map?) ?? const {};
    final reactsByTypeRaw = (metrics['reactionsByType'] as Map?) ?? const {};
    final reactsByType = <String, int>{
      for (final e in reactsByTypeRaw.entries) '${e.key}': _toInt(e.value),
    };
    final totalReacts = _toInt(metrics['reactionsTotal']);
    final sharesTotal = _toInt(metrics['sharesTotal']);
    final commentsTotalBackend = _toInt(metrics['commentsTotal']);

    // Preview de comentários
    final previewCommentsRaw =
        _asListOfMap(data['previewComments'] ?? data['preview_comments']);
    List<({String name, String avatar, String text})> previewComments;
    if (previewCommentsRaw.isNotEmpty) {
      previewComments = previewCommentsRaw.map((m) {
        final name = _str(m['name'] ?? m['authorName']).trim();
        final avatar = _str(m['avatar'] ?? m['authorAvatarUrl']).trim();
        final text = _str(m['text']).trim();
        return (name: name, avatar: avatar, text: text);
      }).toList();
    } else {
      final legacySamples = (data['samples'] as Map?) ?? const {};
      final commentersSampleRaw =
          _asListOfMap(legacySamples['commenters'] ?? const []);
      previewComments = commentersSampleRaw
          .map((m) => (
                name: _str(m['name']).trim(),
                avatar: _str(m['avatar']).trim(),
                text: _str(m['text']).trim(),
              ))
          .where((r) => r.text.isNotEmpty)
          .toList();
    }

    final commentsShown = commentsTotalBackend > 0
        ? commentsTotalBackend
        : previewComments.length;

    // Previews “quem”
    List<({String name, String avatar})> _mapPreview(dynamic raw) {
      final list = _asListOfMap(raw);
      return list
          .map((m) => (
                name: _str(m['name']).trim(),
                avatar: _str(m['avatar']).trim(),
              ))
          .toList();
    }

    var reactorsSample = (data['reactorsPreview'] != null)
        ? _mapPreview(data['reactorsPreview'])
        : _mapPreview((data['samples'] as Map?)?['reactors']);
    final commentersSample = (data['commentersPreview'] != null)
        ? _mapPreview(data['commentersPreview'])
        : _mapPreview((data['samples'] as Map?)?['commenters']);
    final sharersSample = (data['sharersPreview'] != null)
        ? _mapPreview(data['sharersPreview'])
        : _mapPreview((data['samples'] as Map?)?['sharers']);

    // Estado do usuário
    final userState = (data['userState'] as Map?) ?? const {};
    final myReactionRaw = _str(userState['myReaction']).trim();
    final myReaction = myReactionRaw.isEmpty ? null : myReactionRaw;
    final acknowledged = userState['acknowledged'] == true ||
        (userState['acknowledged'] is String &&
            (userState['acknowledged'] as String).toLowerCase() == 'true');

    if (kDebugMode) {
      final us = (data['userState'] as Map?) ?? const {};
      debugPrint(
          '[NEWS:$newsId] derived ackRequired=$ackRequired acknowledged=$acknowledged');
      debugPrint(
          '[NEWS:$newsId] userState.openedAt=${us['openedAt']} acknowledgedAt=${us['acknowledgedAt']}');
    }
    // Se o backend incluiu o próprio usuário na amostra mas você NÃO reagiu,
    // removemos para não aparecer seu avatar indevidamente.
    if (myReaction == null) {
      reactorsSample = reactorsSample.where((p) {
        final sameName =
            p.name.trim().toLowerCase() == _meName.trim().toLowerCase();
        final sameAvatar = _normalizeUrl(p.avatar).trim().isNotEmpty &&
            _normalizeUrl(p.avatar).trim() == _meAvatar.trim();
        return !(sameName || sameAvatar);
      }).toList();
    }

    // Datas / imagens / anexos
    final createdAtStr = _fmtDate(_str(data['createdAt']));
    final updatedAtStr = _fmtDate(_str(data['updatedAt']));
    final images = _images(data['highlightImages']);
    final attachments = _attachments(data['attachments']);

    // Share
    final deeplink = '${env.appScheme}://news/article/$newsId';
    final shareText =
        _str(data['shareText'] ?? data['excerpt'] ?? title).trim();

    _vm = NewsDetailVM(
      raw: data,
      images: images,
      title: title,
      subtitle: subtitle,
      authorId: authorId,
      authorName: authorName,
      authorAvatarUrl: authorAvatarUrl,
      createdAtStr: createdAtStr,
      updatedAtStr: updatedAtStr,
      spaceName: spaceName.isEmpty ? null : spaceName,
      channelNames: channelNames,
      contentHtml: contentHtml,
      attachments: attachments,
      allowReactions: allowReactions,
      allowComments: allowComments,
      commentsModerated: commentsModerated,
      shareEnabled: shareEnabled,
      ackRequired: ackRequired,
      acknowledged: acknowledged,
      reactsByType: reactsByType,
      totalReacts: totalReacts,
      commentsShown: commentsShown,
      shares: sharesTotal,
      myReaction: myReaction,
      reactorsSample: reactorsSample,
      commentersSample: commentersSample,
      sharersSample: sharersSample,
      previewComments: previewComments,
      deeplink: deeplink,
      shareText: shareText,
    );

    // apenas carrega; o /open inicial é responsabilidade da página
    notifyListeners();
  }

  /// Envia OPEN sob-demanda
  Future<void> sendOpen({Map<String, dynamic>? meta}) async {
    try {
      onOpen?.call(); // atualiza badges/local store
      await api.openNews(newsId, meta: meta ?? const {'origin': 'app'});
      if (kDebugMode) {
        debugPrint('[NEWS:$newsId] open → 201 meta=$meta');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[NEWS:$newsId] open ERROR: $e (best-effort)');
      }
    }
  }

  // ————————————————————— helpers
  void _addToFrontUnique(
    List<({String name, String avatar})> list,
    ({String name, String avatar}) who,
  ) {
    final fixed = (
      name: (who.name.trim().isEmpty ? 'Você' : who.name),
      avatar: who.avatar
    );

    final i = list.indexWhere((e) =>
        e.name.trim().toLowerCase() == fixed.name.trim().toLowerCase() ||
        (e.avatar.trim().isNotEmpty && e.avatar.trim() == fixed.avatar.trim()));
    if (i >= 0) list.removeAt(i);
    list.insert(0, fixed);
  }

  // ————————————————————— actions
  Future<void> react(String kind) async {
    if (_throttleReact) return;
    final now = DateTime.now();
    if (_lastReactAt != null &&
        now.difference(_lastReactAt!).inMilliseconds < 500) return;
    _throttleReact = true;
    _lastReactAt = now;
    if (_vm == null) return;
    final s0 = _vm!;

    if (kDebugMode) {
      debugPrint(
          '[NEWS:$newsId] react($kind) BEFORE: my=${s0.myReaction} total=${s0.totalReacts} byType=${s0.reactsByType}');
    }

    String normalize(String k) {
      k = k.toLowerCase().trim();
      switch (k) {
        case 'curtir':
          return 'like';
        case 'amei':
        case 'love':
          return 'love';
        case 'aplauso':
        case 'clap':
          return 'clap';
        case 'sorriso':
        case 'smile':
          return 'smile';
        case 'neutro':
        case 'neutral':
          return 'neutral';
        case 'raiva':
        case 'angry':
          return 'angry';
        default:
          return k;
      }
    }

    final kindNorm = normalize(kind);

    // Se tocar a mesma → unreact
    if (s0.myReaction == kindNorm) {
      await unreact();
      return;
    }

    final by = Map<String, int>.from(s0.reactsByType);
    var total = s0.totalReacts;

    if (s0.myReaction != null) {
      final prev = s0.myReaction!;
      by[prev] = (by[prev] ?? 1) - 1;
      if ((by[prev] ?? 0) < 0) by[prev] = 0;
    } else {
      total += 1;
    }

    by[kindNorm] = (by[kindNorm] ?? 0) + 1;

    final reactors =
        List<({String name, String avatar})>.from(s0.reactorsSample);

    // Garante meu avatar presente SEMPRE que houver reação
    _addToFrontUnique(reactors, (name: _meName, avatar: _meAvatar));

    _vm = s0.copyWith(
      myReaction: kindNorm,
      reactsByType: by,
      totalReacts: total,
      reactorsSample: reactors,
    );
    notifyListeners();

    try {
      await api.reactToNews(newsId, kindNorm);
      if (kDebugMode) {
        debugPrint(
            '[NEWS:$newsId] react($kindNorm) AFTER: my=$kindNorm total=$total byType=${by.toString()}');
      }
    } catch (_) {
      _vm = s0; // rollback
      notifyListeners();
      if (kDebugMode) {
        debugPrint('[NEWS:$newsId] react($kindNorm) ERROR → rollback');
      }
    } finally {
      _throttleReact = false;
    }
  }

  Future<void> unreact() async {
    if (_vm == null || _vm!.myReaction == null) return;
    final s0 = _vm!;

    if (kDebugMode) {
      debugPrint(
          '[NEWS:$newsId] unreact() BEFORE: my=${s0.myReaction} total=${s0.totalReacts} byType=${s0.reactsByType}');
    }

    final by = Map<String, int>.from(s0.reactsByType);
    final k = s0.myReaction!;
    by[k] = (by[k] ?? 1) - 1;
    if ((by[k] ?? 0) < 0) by[k] = 0;

    // remove avatar do usuário da amostra
    final reactors = List<({String name, String avatar})>.from(
        s0.reactorsSample)
      ..removeWhere((e) =>
          e.name.trim().toLowerCase() == _meName.trim().toLowerCase() ||
          (e.avatar.trim().isNotEmpty && e.avatar.trim() == _meAvatar.trim()));

    _vm = s0.copyWith(
      myReaction: null,
      reactsByType: by,
      totalReacts: (s0.totalReacts - 1).clamp(0, 1 << 31),
      reactorsSample: reactors,
    );
    notifyListeners();

    try {
      await api.unreactToNews(newsId);
      if (kDebugMode) {
        debugPrint(
            '[NEWS:$newsId] unreact() AFTER: my=null total=${_vm!.totalReacts} byType=${by.toString()}');
      }
    } catch (_) {
      _vm = s0; // rollback
      notifyListeners();
      if (kDebugMode) {
        debugPrint('[NEWS:$newsId] unreact() ERROR → rollback');
      }
    }
  }

  Future<bool> comment(String text) async {
    if (_vm == null) return false;
    final s0 = _vm!;

    if (kDebugMode) {
      debugPrint(
          '[NEWS:$newsId] comment("$text") moderated=${s0.commentsModerated}');
    }

    await api.commentNews(newsId, text);

    if (!s0.commentsModerated) {
      final previews = List<({String name, String avatar, String text})>.from(
          s0.previewComments);
      previews.insert(0, (name: _meName, avatar: _meAvatar, text: text));

      final commenters =
          List<({String name, String avatar})>.from(s0.commentersSample);
      _addToFrontUnique(commenters, (name: _meName, avatar: _meAvatar));

      _vm = s0.copyWith(
        commentsShown: s0.commentsShown + 1,
        previewComments: previews.take(6).toList(),
        commentersSample: commenters.take(6).toList(),
      );
      notifyListeners();
    }
    return !s0.commentsModerated;
  }

  Future<void> trackShareSuccess({String? target}) async {
    if (_vm == null) return;
    final s0 = _vm!;

    await api.shareNews(newsId, target: target ?? 'app');

    final sharers = List<({String name, String avatar})>.from(s0.sharersSample);
    _addToFrontUnique(sharers, (name: _meName, avatar: _meAvatar));

    _vm = s0.copyWith(
      shares: s0.shares + 1,
      sharersSample: sharers.take(6).toList(),
    );
    notifyListeners();

    if (kDebugMode) {
      debugPrint('[NEWS:$newsId] share → shares=${_vm!.shares}');
    }
  }

  Future<void> acknowledge() async {
    await api.ackNews(newsId);
    if (_vm != null) {
      _vm = _vm!.copyWith(acknowledged: true);
      notifyListeners();
    }

    if (kDebugMode) {
      try {
        final verify = await api.getNewsDetail(newsId);
        final us = (verify['userState'] as Map?) ?? const {};
        debugPrint(
            '[NEWS:$newsId] VERIFY AFTER ACK -> ack=${us['acknowledged']} ackAt=${us['acknowledgedAt']} open=${us['opened']} openAt=${us['openedAt']}');
      } catch (e) {
        debugPrint('[NEWS:$newsId] VERIFY AFTER ACK FAILED: $e');
      }
    }
  }

  Future<List<({String name, String avatar})>> loadReactorsMore(
      {int limit = 50}) async {
    final rows = await api.getReactors(newsId, limit: limit);
    return rows
        .map(
            (m) => (name: '${m['name'] ?? ''}', avatar: '${m['avatar'] ?? ''}'))
        .toList();
  }

  Future<List<({String name, String avatar})>> loadCommentersMore(
      {int limit = 50}) async {
    final rows = await api.getCommenters(newsId, limit: limit);
    return rows
        .map(
            (m) => (name: '${m['name'] ?? ''}', avatar: '${m['avatar'] ?? ''}'))
        .toList();
  }

  Future<List<({String name, String avatar})>> loadSharersMore(
      {int limit = 50}) async {
    final rows = await api.getSharers(newsId, limit: limit);
    return rows
        .map(
            (m) => (name: '${m['name'] ?? ''}', avatar: '${m['avatar'] ?? ''}'))
        .toList();
  }

  Future<void> ack() async {
    if (_vm == null || _throttleAck) return;
    final now = DateTime.now();
    if (_lastAckAt != null && now.difference(_lastAckAt!).inMilliseconds < 800)
      return;
    _throttleAck = true;
    _lastAckAt = now;
    final s0 = _vm!;
    if (!s0.ackRequired || s0.acknowledged) {
      _throttleAck = false;
      return;
    }
    _vm = s0.copyWith(acknowledged: true);
    notifyListeners();
    try {
      await api.ackNews(newsId);
    } catch (_) {
      _vm = s0;
      notifyListeners();
    } finally {
      _throttleAck = false;
    }
  }

  @override
  void dispose() {
    if (!_ct.isCancelled) _ct.cancel('dispose');
    super.dispose();
  }
}
