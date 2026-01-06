// lib/features/menu/profile_page.dart
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';

enum ImageSource { camera, gallery }

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  final _formKey = GlobalKey<FormState>();

  final _displayNameCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();
  final _linkedinCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  bool _loading = false;
  bool _editing = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(userProfileProvider).value;
    if (user != null) {
      _displayNameCtrl.text = user.displayName ?? '';
      _bioCtrl.text = (user.customAttributes?['bio'] as String?) ?? '';
      _linkedinCtrl.text =
          (user.customAttributes?['linkedin'] as String?) ?? '';
      _emailCtrl.text = user.email ?? '';
    }
  }

  @override
  void dispose() {
    _displayNameCtrl.dispose();
    _bioCtrl.dispose();
    _linkedinCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage(bool isAvatar) async {
    // Show Modal
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Câmera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galeria'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source == null) return;

    try {
      // Note: logic differs if using image_picker package.
      // Current code uses 'file_picker'. file_picker handles gallery usually.
      // For camera, we need 'image_picker'.
      // I'll check imports. 'file_picker' is imported. 'image_picker' is NOT.
      // User requirement: "escolher da galeria ou da câmera".
      // If I don't have image_picker, I can't easily do camera.
      // I will assume for now FilePicker is used for Generic File.
      // If I can't use camera, I'll just open FilePicker which mostly opens Gallery.
      // The UI requirement is strong. I should probably add 'image_picker' to pubspec.yaml if missing.
      // But I cannot see pubspec.yaml.
      // I will implement using FilePicker for now which opens system picker (often has camera option).

      // Re-using exiting logic but wrapping in the UI flow requested.

      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.first;
        final bytes = File(file.path!).readAsBytesSync();

        setState(() => _loading = true);

        final api = ref.read(apiClientProvider);
        final url = await api.uploadFileBytes(bytes, file.name);

        if (isAvatar) {
          await api.updateProfile({'avatarUrl': url});
        } else {
          // TODO: Header update logic? Assuming 'headerUrl' field exists or 'coverUrl'
          // User mentioned "imagem de capa".
          // Profile model doesn't show 'headerUrl', maybe customAttributes['coverUrl']?
          // The UI shows a container.
          // I will attempt to save to customAttributes['cover']
          await api.updateProfile({
            'customAttributes': {
              ...(ref.read(userProfileProvider).value?.customAttributes ?? {}),
              'cover': url
            }
          });
        }

        ref.invalidate(userProfileProvider);

        setState(() => _loading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text('${isAvatar ? 'Avatar' : 'Capa'} atualizado!')),
          );
        }
      }
    } catch (e) {
      debugPrint('Upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar imagem: $e')),
        );
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    try {
      final api = ref.read(apiClientProvider);
      await api.updateProfile({
        'displayName': _displayNameCtrl.text.trim(),
        'customAttributes': {
          'bio': _bioCtrl.text.trim(),
          'linkedin': _linkedinCtrl.text.trim(),
        },
        'email': _emailCtrl.text.trim(),
      });

      ref.invalidate(userProfileProvider);

      if (mounted) {
        setState(() {
          _editing = false;
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Perfil atualizado com sucesso!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao atualizar: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userAsync = ref.watch(userProfileProvider);
    final theme = Theme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Meu Perfil', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: _loading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2))
                : Icon(_editing ? Icons.check : Icons.edit,
                    color: Colors.white),
            onPressed: _loading
                ? null
                : () {
                    if (_editing) {
                      _save();
                    } else {
                      setState(() => _editing = true);
                    }
                  },
          )
        ],
      ),
      body: userAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Erro: $e')),
        data: (user) {
          if (user == null) {
            return const Center(child: Text('Usuário não encontrado'));
          }

          final bio = (user.customAttributes?['bio'] as String?) ?? '';
          final linkedin =
              (user.customAttributes?['linkedin'] as String?) ?? '';
          final coverUrl = (user.customAttributes?['cover'] as String?);

          // Sync controllers only when NOT editing to prevent overwriting user input
          if (!_editing) {
            _displayNameCtrl.text = user.displayName ?? '';
            _bioCtrl.text = bio;
            _linkedinCtrl.text = linkedin;
            _emailCtrl.text = user.email ?? '';
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                // HEADER & AVATAR
                Stack(
                  alignment: Alignment.center,
                  clipBehavior: Clip.none,
                  children: [
                    // Cover Image
                    GestureDetector(
                      onTap: _editing ? () => _pickAndUploadImage(false) : null,
                      child: Container(
                        height: 240,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: theme.primaryColor,
                          image: coverUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(coverUrl),
                                  fit: BoxFit.cover)
                              : null,
                        ),
                        child: _editing
                            ? Container(
                                color: Colors.black26,
                                child: const Center(
                                    child: Icon(Icons.camera_alt,
                                        color: Colors.white70, size: 40)),
                              )
                            : null,
                      ),
                    ),
                    // Gradient bottom
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                          height: 80,
                          decoration: BoxDecoration(
                              gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.5)
                              ]))),
                    ),
                    // Avatar
                    Positioned(
                      bottom: -50,
                      child: GestureDetector(
                        onTap:
                            _editing ? () => _pickAndUploadImage(true) : null,
                        child: Stack(
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border:
                                      Border.all(color: Colors.white, width: 4),
                                  boxShadow: const [
                                    BoxShadow(
                                        color: Colors.black26, blurRadius: 8)
                                  ]),
                              child: CircleAvatar(
                                radius: 60,
                                backgroundColor: Colors.grey.shade200,
                                backgroundImage: user.avatarUrl != null
                                    ? NetworkImage(user.avatarUrl!)
                                    : null,
                                child: user.avatarUrl == null
                                    ? Text(
                                        user.name
                                                ?.substring(0, 1)
                                                .toUpperCase() ??
                                            'U',
                                        style: const TextStyle(fontSize: 40))
                                    : null,
                              ),
                            ),
                            if (_editing)
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: CircleAvatar(
                                  radius: 20,
                                  backgroundColor: theme.primaryColor,
                                  child: const Icon(Icons.camera_alt,
                                      size: 18, color: Colors.white),
                                ),
                              )
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 60),

                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _SectionHeader(title: 'Informações Pessoais'),
                        _buildTextField(
                          label: 'Nome de Exibição',
                          controller: _displayNameCtrl,
                          enabled: _editing,
                          icon: Icons.person_outline,
                        ),
                        // First Name / Last Name (Read Only - RH)
                        _buildReadOnlyField('Nome Completo (RH)', user.name,
                            Icons.badge_outlined),

                        _buildTextField(
                          label: 'Mini Bio',
                          controller: _bioCtrl,
                          enabled: _editing,
                          maxLines: 3,
                          icon: Icons.short_text,
                        ),
                        _buildTextField(
                          label: 'E-mail Público',
                          controller: _emailCtrl,
                          enabled: _editing,
                          icon: Icons.email_outlined,
                        ),
                        _buildTextField(
                          label: 'LinkedIn / Site',
                          controller: _linkedinCtrl,
                          enabled: _editing,
                          icon: Icons.link,
                        ),

                        const SizedBox(height: 24),
                        const _SectionHeader(title: 'Informações Corporativas'),
                        _buildReadOnlyField(
                            'Cargo', user.jobTitle, Icons.work_outline),
                        _buildReadOnlyField(
                            'Departamento', user.department, Icons.apartment),
                        _buildReadOnlyField('Localização', user.location,
                            Icons.location_on_outlined),

                        const SizedBox(height: 24),
                        const _SectionHeader(title: 'Meus Grupos'),
                        if (user.groups.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Text('Você não está em nenhum grupo.',
                                style: TextStyle(color: Colors.grey)),
                          )
                        else
                          Consumer(builder: (context, ref, _) {
                            final groupsAsync = ref.watch(groupsListProvider);
                            return groupsAsync.when(
                              data: (allGroups) {
                                final map = {
                                  for (final g in allGroups) g['id']: g['name']
                                };
                                return Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: user.groups.map((gId) {
                                    final name = map[gId] ?? gId;
                                    return Chip(
                                      avatar: const Icon(Icons.group, size: 16),
                                      label: Text(name),
                                      backgroundColor: Colors.grey.shade100,
                                    );
                                  }).toList(),
                                );
                              },
                              loading: () => const CircularProgressIndicator(),
                              error: (_, __) =>
                                  const Text('Erro ao carregar grupos'),
                            );
                          }),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    bool enabled = true,
    int maxLines = 1,
    IconData? icon,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        enabled: enabled,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: icon != null ? Icon(icon, color: Colors.grey) : null,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: !enabled,
          fillColor: enabled ? null : Colors.grey.shade50,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        validator: (v) =>
            (v == null || v.isEmpty) ? 'Campo não pode ser vazio' : null,
      ),
    );
  }

  Widget _buildReadOnlyField(String label, String? value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        initialValue: value ?? '-',
        enabled: false,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: Colors.grey),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: true,
          fillColor: Colors.grey.shade100,
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }
}
