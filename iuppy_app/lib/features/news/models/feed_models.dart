class FeedCounters {
  final int totalUnread;
  final Map<String, int> bySpace;
  final Map<String, int> byChannel;

  FeedCounters({
    required this.totalUnread,
    required this.bySpace,
    required this.byChannel,
  });

  factory FeedCounters.fromJson(Map<String, dynamic> j) => FeedCounters(
        totalUnread: j['totalUnread'] ?? 0,
        bySpace: Map<String, int>.from(j['bySpace'] ?? {}),
        byChannel: Map<String, int>.from(j['byChannel'] ?? {}),
      );
}

class FeedItemCounts {
  final int uniqueOpens;
  final int acks;
  final int reactionsTotal;
  final int commentsTotal;
  final int sharesTotal;

  FeedItemCounts({
    required this.uniqueOpens,
    required this.acks,
    required this.reactionsTotal,
    required this.commentsTotal,
    required this.sharesTotal,
  });

  factory FeedItemCounts.fromJson(Map<String, dynamic> j) => FeedItemCounts(
        uniqueOpens: j['uniqueOpens'] ?? 0,
        acks: j['acks'] ?? 0,
        reactionsTotal: j['reactionsTotal'] ?? 0,
        commentsTotal: j['commentsTotal'] ?? 0,
        sharesTotal: j['sharesTotal'] ?? 0,
      );
}

class FeedItemSettings {
  final bool acknowledgementRequired;
  final bool allowReactions;
  final bool allowComments;
  final bool commentsRequireModeration;
  final bool shareEnabled;

  FeedItemSettings({
    required this.acknowledgementRequired,
    required this.allowReactions,
    required this.allowComments,
    required this.commentsRequireModeration,
    required this.shareEnabled,
  });

  factory FeedItemSettings.fromJson(Map<String, dynamic> j) => FeedItemSettings(
        acknowledgementRequired: j['acknowledgementRequired'] ?? false,
        allowReactions: j['allowReactions'] ?? true,
        allowComments: j['allowComments'] ?? false,
        commentsRequireModeration: j['commentsRequireModeration'] ?? false,
        shareEnabled: j['shareEnabled'] ?? false,
      );
}

class FeedUserState {
  final bool isRead;
  final String? readAt;
  final String? myReaction;

  FeedUserState({
    required this.isRead,
    this.readAt,
    this.myReaction,
  });

  factory FeedUserState.fromJson(Map<String, dynamic> j) => FeedUserState(
        isRead: j['isRead'] ?? false,
        readAt: j['readAt'],
        myReaction: j['myReaction'],
      );
}

class FeedAttachment {
  final String? name;
  final String url;

  FeedAttachment({this.name, required this.url});

  factory FeedAttachment.fromJson(dynamic j) {
    if (j is String) return FeedAttachment(url: j);
    return FeedAttachment(name: j['name'], url: j['url']);
  }
}

class FeedItem {
  final String id;
  final String createdAt;
  final String? updatedAt;

  final String title;
  final String? subtitle;
  final String? excerpt;

  final List<String> highlightImages;
  final List<FeedAttachment> attachments;

  final String? spaceId;
  final String? spaceName;
  final String? channelId;
  final String? channelName;

  final FeedItemSettings settings;
  final FeedUserState userState;
  final FeedItemCounts counts;

  FeedItem({
    required this.id,
    required this.createdAt,
    this.updatedAt,
    required this.title,
    this.subtitle,
    this.excerpt,
    required this.highlightImages,
    required this.attachments,
    this.spaceId,
    this.spaceName,
    this.channelId,
    this.channelName,
    required this.settings,
    required this.userState,
    required this.counts,
  });

  factory FeedItem.fromJson(Map<String, dynamic> j) => FeedItem(
        id: j['id'],
        createdAt: j['createdAt'],
        updatedAt: j['updatedAt'],
        title: j['title'],
        subtitle: j['subtitle'],
        excerpt: j['excerpt'],
        highlightImages:
            (j['highlightImages'] as List<dynamic>? ?? []).cast<String>(),
        attachments: (j['attachments'] as List<dynamic>? ?? [])
            .map((e) => FeedAttachment.fromJson(e))
            .toList(),
        spaceId: j['spaceId'],
        spaceName: j['spaceName'],
        channelId: j['channelId'],
        channelName: j['channelName'],
        settings: FeedItemSettings.fromJson(j['settings'] ?? const {}),
        userState: FeedUserState.fromJson(j['userState'] ?? const {}),
        counts: FeedItemCounts.fromJson(j['counts'] ?? const {}),
      );
}

class MeFeedResponse {
  final List<FeedItem> items;
  final FeedCounters counters;
  final String? nextCursor;
  final String etag;
  final String serverTime;

  MeFeedResponse({
    required this.items,
    required this.counters,
    this.nextCursor,
    required this.etag,
    required this.serverTime,
  });

  factory MeFeedResponse.fromJson(Map<String, dynamic> j) => MeFeedResponse(
        items: (j['items'] as List<dynamic>? ?? [])
            .map((e) => FeedItem.fromJson(e))
            .toList(),
        counters: FeedCounters.fromJson(j['counters'] ?? const {}),
        nextCursor: j['nextCursor'],
        etag: j['etag'] ?? '',
        serverTime: j['serverTime'] ?? '',
      );
}
