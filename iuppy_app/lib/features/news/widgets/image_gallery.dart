import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:image_gallery_saver_plus/image_gallery_saver_plus.dart';
import 'package:share_plus/share_plus.dart';

Future<void> openImageGalleryDialog(
  BuildContext context,
  List<String> urls, {
  int initialIndex = 0,
}) async {
  final pageCtrl = PageController(initialPage: initialIndex);
  int index = initialIndex;

  bool isSaveOk(dynamic result) {
    // A lib retorna um Map com 'isSuccess' e/ou 'success' dependendo da plataforma
    if (result is Map) {
      final v = result['isSuccess'] ?? result['success'];
      if (v is bool) return v;
      if (v is String) return v.toLowerCase() == 'true';
    }
    return false;
  }

  Future<void> download(String url) async {
    try {
      final resp = await Dio().get<List<int>>(
        url,
        options: Options(responseType: ResponseType.bytes),
      );

      final name = 'iuppy_${DateTime.now().millisecondsSinceEpoch}';
      final saveRes = await ImageGallerySaverPlus.saveImage(
        Uint8List.fromList(resp.data!),
        name: name,
        quality: 100,
      );

      final ok = isSaveOk(saveRes);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(ok ? 'Imagem salva na galeria' : 'Falha ao salvar')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao baixar: $e')),
        );
      }
    }
  }

  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (_) => StatefulBuilder(
      builder: (ctx, setState) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black,
          foregroundColor: Colors.white,
          title: Text('${index + 1}/${urls.length}'),
          actions: [
            IconButton(
              tooltip: 'Compartilhar',
              icon: const Icon(Icons.ios_share_rounded),
              onPressed: () =>
                  SharePlus.instance.share(ShareParams(text: urls[index])),
            ),
            IconButton(
              tooltip: 'Baixar',
              icon: const Icon(Icons.download_rounded),
              onPressed: () => download(urls[index]),
            ),
          ],
        ),
        body: PhotoViewGallery(
          pageController: pageCtrl,
          onPageChanged: (i) => setState(() => index = i),
          pageOptions: urls
              .map(
                (u) => PhotoViewGalleryPageOptions(
                  imageProvider: NetworkImage(u),
                  heroAttributes: PhotoViewHeroAttributes(tag: u),
                ),
              )
              .toList(),
          backgroundDecoration: const BoxDecoration(color: Colors.black),
        ),
      ),
    ),
  );
}
