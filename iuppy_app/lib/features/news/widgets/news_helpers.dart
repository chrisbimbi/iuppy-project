String? fmtDate(String? iso) {
  if (iso == null || iso.isEmpty) return null;
  final dt = DateTime.tryParse(iso)?.toLocal();
  if (dt == null) return null;
  String two(int n) => n < 10 ? '0$n' : '$n';
  final yy = dt.year % 100;
  return '${two(dt.day)}/${two(dt.month)}/${two(yy)} - ${two(dt.hour)}:${two(dt.minute)}';
}

List<String> extractChannelNames(Map<String, dynamic> data,
    {List<String> fallbackSingle = const []}) {
  final ch = data['channels'];
  if (ch is List) {
    final names = ch
        .map((e) {
          if (e is String) return e;
          if (e is Map && e['name'] != null) return e['name'].toString();
          return '';
        })
        .where((s) => s.trim().isNotEmpty)
        .cast<String>()
        .toList();
    if (names.isNotEmpty) return names;
  }
  return fallbackSingle;
}

List<String> parseHighlightImages(dynamic rawImages) {
  final src = (rawImages as List?) ?? const [];
  return src
      .map((e) {
        if (e is String) return e;
        if (e is Map && e['url'] != null) return e['url'].toString();
        return '';
      })
      .where((u) => u.startsWith('http'))
      .toList();
}

List<({String name, String url})> parseAttachments(dynamic rawAttachments) {
  return ((rawAttachments as List?) ?? const [])
      .map((e) {
        if (e is String) {
          return (
            name: Uri.tryParse(e)?.pathSegments.last ?? 'arquivo',
            url: e
          );
        } else if (e is Map) {
          final url = (e['url'] ?? '').toString();
          final name = (e['name'] ?? Uri.tryParse(url)?.pathSegments.last ?? '')
              .toString();
          return (name: name, url: url);
        }
        return (name: 'arquivo', url: '');
      })
      .where((t) => t.url.startsWith('http'))
      .toList();
}
