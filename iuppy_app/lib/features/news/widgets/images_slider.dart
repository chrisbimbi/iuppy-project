import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class ImagesSlider extends StatefulWidget {
  const ImagesSlider({super.key, required this.urls, required this.onTap});
  final List<String> urls;
  final void Function(int index) onTap;

  @override
  State<ImagesSlider> createState() => _ImagesSliderState();
}

class _ImagesSliderState extends State<ImagesSlider> {
  final _ctrl = PageController();
  int _index = 0;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dots = List.generate(widget.urls.length, (i) => i);

    return Column(
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              fit: StackFit.expand,
              children: [
                PageView.builder(
                  controller: _ctrl,
                  onPageChanged: (i) => setState(() => _index = i),
                  itemCount: widget.urls.length,
                  itemBuilder: (_, i) {
                    final u = widget.urls[i];
                    return InkWell(
                      onTap: () => widget.onTap(i),
                      child: CachedNetworkImage(
                        imageUrl: u,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    );
                  },
                ),
                if (widget.urls.length > 1)
                  Positioned(
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: dots.map((i) {
                        final selected = i == _index;
                        return Container(
                          width: selected ? 8 : 6,
                          height: selected ? 8 : 6,
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          decoration: BoxDecoration(
                            color:
                                Colors.white.withOpacity(selected ? .95 : .55),
                            shape: BoxShape.circle,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
