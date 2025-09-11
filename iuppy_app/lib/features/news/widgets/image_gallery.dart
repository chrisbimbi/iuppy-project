import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:image_gallery_saver/image_gallery_saver.dart';
import 'package:share_plus/share_plus.dart';

Future<void> openImageGalleryDialog(BuildContext context, List<String> urls,
    {int initialIndex = 0}) async {
  final pageCtrl = PageController(initialPage: initialIndex);
  int index = initialIndex;

  Future<void> _download(String url) async {
    final resp = await Dio().get<List<int>>(url,
        options: Options(responseType: ResponseType.bytes));
    final result =
        await ImageGallerySaver.saveImage(Uint8List.fromList(resp.data!));
    final ok = (result['isSuccess'] ?? false) == true;
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Imagem salva na galeria' : 'Falha ao salvar'),
      ));
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
              onPressed: () => Share.share(urls[index]),
            ),
            IconButton(
              tooltip: 'Baixar',
              icon: const Icon(Icons.download_rounded),
              onPressed: () => _download(urls[index]),
            ),
          ],
        ),
        body: PhotoViewGallery(
          pageController: pageCtrl,
          onPageChanged: (i) => setState(() => index = i),
          pageOptions: urls
              .map((u) => PhotoViewGalleryPageOptions(
                    imageProvider: NetworkImage(u),
                    heroAttributes: PhotoViewHeroAttributes(tag: u),
                  ))
              .toList(),
          backgroundDecoration: const BoxDecoration(color: Colors.black),
        ),
      ),
    ),
  );
}
