import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../../core/providers.dart';

class PremiumNewsCard extends HookConsumerWidget {
  final Map<String, dynamic> news;
  final VoidCallback onTap;

  const PremiumNewsCard({required this.news, required this.onTap, super.key});

  int _num(dynamic v) {
    if (v is num) return v.toInt();
    if (v == null) return 0;
    return int.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = (news['title'] ?? '').toString().trim();
    final subtitle = (news['subtitle'] ?? '').toString().trim();
    final when = _fmtDate((news['updatedAt'] ?? news['createdAt'])?.toString());
    final settings = (news['settings'] as Map?) ?? const {};

    // Lógica de Ack
    final hasAckRequired =
        (settings['acknowledgementRequired'] ?? false) == true;
    final userState = (news['userState'] as Map?) ?? {};
    final isAcknowledged = (userState['acknowledged'] ?? false) == true;

    // Lógica de Pin
    final isPinned = (settings['pinToTop'] ?? false) == true;

    // Lógica de Like
    final myReaction = userState['myReaction'];
    final iLiked = myReaction != null;

    // Lógica de Interações (View, Comment, Share)
    final hasViewed = (userState['hasViewed'] ?? false) == true;
    final hasCommented = (userState['hasCommented'] ?? false) == true;
    final hasShared = (userState['hasShared'] ?? false) == true;

    // Lógica de Favorito
    final initialFavorited = (news['isFavorited'] ?? false) == true;
    final isFavorited = useState(initialFavorited);

    final attachments =
        ((news['attachments'] as List?) ?? const []).cast<String>();
    final thumb = _firstHttpUrl(news['highlightImages'] as List?);
    final channel = (news['channelName'] ?? '').toString();

    // Métricas
    final metrics = (news['metrics'] as Map?) ?? const {};
    final reacts = _num(metrics['reactionsTotal'] ?? news['reactionsTotal']);
    final shares = _num(metrics['sharesTotal'] ?? news['sharesTotal']);
    final views = _num(metrics['viewsTotal'] ?? news['viewsTotal']);
    final saves = _num(metrics['favoritesTotal'] ??
        metrics['favorites'] ??
        news['favoritesTotal'] ??
        news['savesTotal']);

    // Lógica de Comentários
    final commentsRequireModeration =
        (settings['allowComments'] ?? false) == true &&
            (settings['commentsRequireModeration'] ?? false) == true;

    final approvedComments = _num(
      metrics['commentsApprovedTotal'] ??
          metrics['commentsApproved'] ??
          metrics['approvedComments'] ??
          metrics['comments_approved'] ??
          metrics['approved'],
    );

    final totalComments =
        _num(metrics['commentsTotal'] ?? news['commentsTotal']);
    final comments =
        commentsRequireModeration ? approvedComments : totalComments;

    // final reactorsSample = ((news['reactorsSample'] as List?) ?? const [])
    //     .whereType<Map>()
    //     .map((m) => (
    //           name: (m['name'] ?? '').toString(),
    //           avatar: (m['avatarUrl'] ?? '').toString(),
    //         ))
    //     .toList();

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. IMAGEM HERO
              if (thumb != null)
                Stack(
                  children: [
                    SizedBox(
                      height: 160,
                      width: double.infinity,
                      child: Image.network(
                        thumb,
                        fit: BoxFit.cover,
                        errorBuilder: (ctx, err, stack) => Container(
                          color: Colors.grey[100],
                          child: const Center(
                              child: Icon(Icons.broken_image_outlined,
                                  color: Colors.grey)),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.4),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    // PIN & FAVORITE
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isPinned)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 4,
                                  )
                                ],
                              ),
                              child: const Icon(Icons.push_pin,
                                  size: 16, color: Colors.black),
                            ),
                          GestureDetector(
                            onTap: () async {
                              isFavorited.value = !isFavorited.value;
                              await ref.read(newsRepoProvider).toggleFavorite(
                                  (news['id'] ?? '').toString());
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 4,
                                  )
                                ],
                              ),
                              child: Icon(
                                isFavorited.value
                                    ? Icons.bookmark
                                    : Icons.bookmark_border,
                                size: 18,
                                color: isFavorited.value
                                    ? Colors.blue
                                    : Colors.black87,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              else
                // Se não tem imagem, mostra pin/fav no topo direito do card
                Padding(
                  padding: const EdgeInsets.only(top: 12, right: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (isPinned)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Icon(Icons.push_pin,
                              size: 20, color: Colors.grey[400]),
                        ),
                      GestureDetector(
                        onTap: () async {
                          isFavorited.value = !isFavorited.value;
                          await ref
                              .read(newsRepoProvider)
                              .toggleFavorite((news['id'] ?? '').toString());
                        },
                        child: Icon(
                          isFavorited.value
                              ? Icons.bookmark
                              : Icons.bookmark_border,
                          size: 24,
                          color: isFavorited.value
                              ? Colors.blue
                              : Colors.grey[400],
                        ),
                      ),
                    ],
                  ),
                ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 2. CHIPS E DATA
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          if (channel.isNotEmpty)
                            _GlassChip(text: channel, isPrimary: true),

                          // Hashtags
                          if (news['hashtags'] != null &&
                              (news['hashtags'] as List).isNotEmpty)
                            ...(news['hashtags'] as List).take(2).map((tag) =>
                                Padding(
                                  padding: const EdgeInsets.only(left: 6),
                                  child: _GlassChip(text: '#$tag', isTag: true),
                                )),

                          if (hasAckRequired) ...[
                            const SizedBox(width: 8),
                            if (isAcknowledged)
                              const _GlassChip(text: 'Aceito', isSuccess: true)
                            else
                              const _GlassChip(
                                  text: 'Ação necessária', isAlert: true),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),

                    // 3. TÍTULO E SUBTÍTULO
                    Text(
                      title.isEmpty ? 'Sem título' : title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),

                    if (subtitle.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                          height: 1.3,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],

                    const SizedBox(height: 8),
                    Text(
                      when,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    if (attachments.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Icon(Icons.attach_file,
                              size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(
                            '${attachments.length} anexo(s)',
                            style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 12,
                                fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // 4. RODAPÉ DE MÉTRICAS
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border(
                    top: BorderSide(color: Colors.grey.shade100),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Views
                    _MetricItem(
                      icon: Icons.remove_red_eye_outlined,
                      count: views,
                      color: hasViewed
                          ? Colors.blue.shade500
                          : Colors.grey.shade600,
                      isActive: hasViewed,
                    ),
                    // Reações
                    _MetricItem(
                      icon: iLiked
                          ? Icons.favorite_rounded
                          : Icons.favorite_border_rounded,
                      count: reacts,
                      color:
                          iLiked ? Colors.red.shade500 : Colors.grey.shade600,
                      isActive: iLiked,
                    ),
                    // Comentários
                    _MetricItem(
                      icon: Icons.mode_comment_outlined,
                      count: comments,
                      color: hasCommented
                          ? Colors.blue.shade500
                          : Colors.grey.shade600,
                      isActive: hasCommented,
                    ),
                    // Compartilhamentos
                    _MetricItem(
                      icon: Icons.share_outlined,
                      count: shares,
                      color: hasShared
                          ? Colors.blue.shade500
                          : Colors.grey.shade600,
                      isActive: hasShared,
                    ),
                    // Salvamentos
                    _MetricItem(
                      icon: isFavorited.value
                          ? Icons.bookmark
                          : Icons.bookmark_border,
                      count: saves,
                      color: isFavorited.value
                          ? Colors.blue.shade500
                          : Colors.grey.shade600,
                      isActive: isFavorited.value,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String? _firstHttpUrl(List? arr) {
    if (arr == null) return null;
    for (final e in arr) {
      final s = '$e';
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
    }
    return null;
  }

  static String _fmtDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final d = dt.toLocal();
    final now = DateTime.now();
    final diff = now.difference(d);

    if (diff.inDays == 0) {
      if (diff.inHours == 0) return '${diff.inMinutes} min atrás';
      return '${diff.inHours}h atrás';
    } else if (diff.inDays == 1) {
      return 'Ontem';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} dias atrás';
    }

    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}/${two(d.month)}/${d.year}';
  }
}

class _GlassChip extends StatelessWidget {
  final String text;
  final bool isPrimary;
  final bool isAlert;
  final bool isSuccess;
  final bool isTag;

  const _GlassChip({
    required this.text,
    this.isPrimary = false,
    this.isAlert = false,
    this.isSuccess = false,
    this.isTag = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor = Colors.grey.shade100;
    Color textColor = Colors.grey.shade700;

    if (isPrimary) {
      bgColor = Colors.blue.shade50;
      textColor = Colors.blue.shade700;
    } else if (isAlert) {
      bgColor = Colors.orange.shade50;
      textColor = Colors.orange.shade800;
    } else if (isSuccess) {
      bgColor = Colors.green.shade50;
      textColor = Colors.green.shade700;
    } else if (isTag) {
      bgColor = Colors.purple.shade50;
      textColor = Colors.purple.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final IconData icon;
  final int count;
  final Color color;
  final bool isActive;

  const _MetricItem({
    required this.icon,
    required this.count,
    required this.color,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 4),
        Text(
          '$count',
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
            color: color,
          ),
        ),
      ],
    );
  }
}
