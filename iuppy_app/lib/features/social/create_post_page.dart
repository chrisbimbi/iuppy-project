import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/social/services/social_storage_service.dart';

class CreatePostPage extends ConsumerStatefulWidget {
  const CreatePostPage({super.key});

  @override
  ConsumerState<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends ConsumerState<CreatePostPage> {
  final TextEditingController _textController = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  final List<XFile> _selectedImages = [];
  bool _isUploading = false;
  String? _selectedChannelId;

  // List of allowed channels to post to (SOCIAL type)
  List<Map<String, dynamic>> _allowedChannels = [];
  bool _isLoadingChannels = true;

  @override
  void initState() {
    super.initState();
    _fetchChannels();
  }

  Future<void> _fetchChannels() async {
    // Ideally we fetch from backend, or filtering existing channels provider.
    // For now assuming we fetch all channels and filter by type 'social' (if we had type info in list)
    // Or just all channels the user can see.
    try {
      final api = ref.read(apiClientProvider);
      final channels = await api.getChannels();
      // Filter? If 'type' is not available in list, we might just show all.
      // Let's assume for Social Wall we show all channels user has access to.
      setState(() {
        _allowedChannels = channels;
        if (_allowedChannels.isNotEmpty) {
          _selectedChannelId = _allowedChannels.first['id'].toString();
        }
        _isLoadingChannels = false;
      });
    } catch (e) {
      setState(() => _isLoadingChannels = false);
    }
  }

  Future<void> _pickImage() async {
    final List<XFile> images = await _picker.pickMultiImage();
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(images);
      });
    }
  }

  Future<void> _submitpost() async {
    if (_textController.text.trim().isEmpty && _selectedImages.isEmpty) return;
    if (_selectedChannelId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Selecione um canal')));
      return;
    }

    setState(() => _isUploading = true);
    final api = ref.read(apiClientProvider);

    try {
      final List<Map<String, dynamic>> media = [];
      final storage = ref.read(socialStorageServiceProvider);
      final tempPostId = DateTime.now().millisecondsSinceEpoch.toString();

      // Upload Images
      for (var img in _selectedImages) {
        final url = await storage.uploadPostImage(
          File(img.path),
          postId: tempPostId,
        );
        media.add({'type': 'image', 'url': url, 'meta': {}});
      }

      await api.createSocialPost(
        channelId: _selectedChannelId!,
        content: _textController.text,
        media: media,
      );

      if (mounted) {
        context.pop(true); // Return Success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Erro ao criar post: $e')));
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Criar Publicação'),
        actions: [
          TextButton(
            onPressed: _isUploading ? null : _submitpost,
            child: _isUploading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Publicar',
                    style: TextStyle(fontWeight: FontWeight.bold)),
          )
        ],
      ),
      body: Column(
        children: [
          if (_isLoadingChannels)
            const LinearProgressIndicator()
          else if (_allowedChannels.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: DropdownButtonFormField<String>(
                value: _selectedChannelId,
                decoration: const InputDecoration(labelText: 'Canal'),
                items: _allowedChannels.map((c) {
                  return DropdownMenuItem(
                    value: c['id'].toString(),
                    child: Text(c['name']?.toString() ?? 'Sem nome'),
                  );
                }).toList(),
                onChanged: (v) => setState(() => _selectedChannelId = v),
              ),
            ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                controller: _textController,
                maxLines: null,
                decoration: const InputDecoration(
                  hintText: 'No que você está pensando?',
                  border: InputBorder.none,
                ),
              ),
            ),
          ),
          if (_selectedImages.isNotEmpty)
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _selectedImages.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Stack(
                      children: [
                        Image.file(File(_selectedImages[index].path),
                            width: 100, height: 100, fit: BoxFit.cover),
                        Positioned(
                          right: 0,
                          top: 0,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedImages.removeAt(index);
                              });
                            },
                            child: const Icon(Icons.close,
                                color: Colors.white,
                                shadows: [
                                  Shadow(color: Colors.black, blurRadius: 2)
                                ]),
                          ),
                        )
                      ],
                    ),
                  );
                },
              ),
            ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                IconButton(
                  onPressed: _pickImage,
                  icon: const Icon(Icons.photo_library, color: Colors.green),
                ),
                // Add Camera or Video icons later
              ],
            ),
          )
        ],
      ),
    );
  }
}
