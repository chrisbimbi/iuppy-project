import 'package:flutter/material.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';

Future<void> openYoutubeDialog(BuildContext context, String videoId) async {
  final controller = YoutubePlayerController(
    initialVideoId: videoId,
    flags: const YoutubePlayerFlags(
      autoPlay: true,
      mute: false,
      forceHD: true,
    ),
  );

  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (_) => Dialog(
      insetPadding: const EdgeInsets.all(16),
      backgroundColor: Colors.black,
      child: AspectRatio(
        aspectRatio: 16 / 9,
        child: YoutubePlayer(
          controller: controller,
          showVideoProgressIndicator: true,
          progressIndicatorColor: Colors.amber,
        ),
      ),
    ),
  );

  controller.dispose();
}

/// tenta extrair id de uma URL youtube/embed ou watch
String? tryExtractYoutubeId(String url) {
  try {
    final u = Uri.parse(url);
    if (u.host.contains('youtube.com')) {
      if (u.pathSegments.contains('embed') && u.pathSegments.length >= 2) {
        return u.pathSegments.last;
      }
      if (u.path == '/watch') return u.queryParameters['v'];
    }
    if (u.host == 'youtu.be' && u.pathSegments.isNotEmpty) {
      return u.pathSegments.first;
    }
  } catch (_) {}
  return null;
}
