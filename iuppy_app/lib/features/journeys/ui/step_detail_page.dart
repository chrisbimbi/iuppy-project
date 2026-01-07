import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/gamification/ui/xp_award_dialog.dart';
import 'package:iuppy_app/features/forms/widgets/form_renderer.dart';
import 'package:iuppy_app/features/surveys/widgets/survey_renderer.dart';
import 'package:iuppy_app/features/forms/providers/forms_storage_provider.dart';
import 'package:iuppy_app/core/providers.dart';
import '../journey_providers.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:iuppy_app/features/news/widgets/web_sheet.dart';
import 'package:photo_view/photo_view.dart';

// Hybrid Video Type Enum
enum VideoSourceType { native, youtube, external }

class StepDetailPage extends ConsumerStatefulWidget {
  final String journeyId;
  final String stepId;

  const StepDetailPage({
    super.key,
    required this.journeyId,
    required this.stepId,
  });

  @override
  ConsumerState<StepDetailPage> createState() => _StepDetailPageState();
}

class _StepDetailPageState extends ConsumerState<StepDetailPage> {
  bool _isLoading = false;
  Map<String, dynamic>? _stepData;
  String? _errorMessage;
  bool _ackChecked = false;

  // Completion Logic States
  // YouTube
  YoutubePlayerController? _youtubeController;
  // Native
  VideoPlayerController? _nativeVideoController;
  ChewieController? _chewieController;

  VideoSourceType _videoSourceType = VideoSourceType.external;
  bool _isVideoCompleted = false;
  // Multi-document tracking
  List<Map<String, dynamic>> _attachments = [];
  Set<String> _openedAttachmentUrls = {};

  void _showWatchAlert() {
    showDialog(
        context: context,
        builder: (c) => AlertDialog(
              title: const Text('Atenção'),
              content: const Text(
                  'Você precisa assistir ao vídeo inteiro (pelo menos 90%) para completar este passo.'),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(c), child: const Text('Ok'))
              ],
            ));
  }

  @override
  void initState() {
    super.initState();
    _fetchStepDetails();
  }

  @override
  void dispose() {
    _youtubeController?.dispose();
    _nativeVideoController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  Future<void> _initHybridVideo(String url) async {
    // Safety: fail-safe disposal before re-init
    _youtubeController
        ?.dispose(); // Note: check if dispose is correct method in this package
    _nativeVideoController?.dispose();
    _chewieController?.dispose();
    _youtubeController = null;
    _nativeVideoController = null;
    _chewieController = null;

    // 1. Check if YouTube
    final ytId = YoutubePlayer.convertUrlToId(
        url); // Use package helper if valid, or fallback to mine
    if (ytId != null) {
      _videoSourceType = VideoSourceType.youtube;
      _youtubeController = YoutubePlayerController(
        initialVideoId: ytId,
        flags: const YoutubePlayerFlags(
          autoPlay: false,
          hideThumbnail: false,
          mute: false,
          enableCaption: false,
        ),
      );

      // Listen for events?
      // This package pushes events to the controller.value
      // We don't need explicit listeners strictly for 'init' but maybe for completion tracking later.
      return;
    }
// ... (Native check remains same) ...

    // 2. Check if Native (Firebase Storage) - or assuming standard video formats
    // Simple heuristic: Extension check or 'firebasestorage'
    final uri = Uri.tryParse(url);
    final isNative = uri != null &&
        (url.contains('firebasestorage') ||
            url.endsWith('.mp4') ||
            url.endsWith('.mov') ||
            url.endsWith('.webm'));

    if (isNative) {
      _videoSourceType = VideoSourceType.native;
      _nativeVideoController = VideoPlayerController.networkUrl(Uri.parse(url));
      await _nativeVideoController!.initialize();

      _chewieController = ChewieController(
        videoPlayerController: _nativeVideoController!,
        aspectRatio: _nativeVideoController!.value.aspectRatio,
        autoPlay: false,
        looping: false,
        allowFullScreen: true,
        allowMuting: true,
      );

      // Listen for Native Progress
      _nativeVideoController!.addListener(() {
        if (!_isVideoCompleted && _nativeVideoController!.value.isInitialized) {
          final pos = _nativeVideoController!.value.position;
          final dur = _nativeVideoController!.value.duration;
          if (dur.inSeconds > 0 && pos.inSeconds >= (dur.inSeconds * 0.9)) {
            if (mounted) setState(() => _isVideoCompleted = true);
          }
        }
      });
      setState(() {}); // Rebuild to show player
      return;
    }

    // 3. Fallback: External Link (Vimeo, Drive, Meet, etc)
    _videoSourceType = VideoSourceType.external;
  }

  Future<void> _fetchStepDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _openedAttachmentUrls = {}; // Reset
      _attachments = [];
    });
    try {
      final step = await ref
          .read(journeyServiceProvider)
          .getStepDetails(widget.journeyId, widget.stepId);

      // 1. Set Data First
      _stepData = step;

      // 2. Init Video (if needed) - AWAITING to block UI
      final mediaType = step['mediaType']?.toString().toUpperCase();
      final mediaUrl = step['mediaUrl']?.toString();

      if (mediaType == 'VIDEO' && mediaUrl != null) {
        await _initHybridVideo(mediaUrl);
      }

      // 3. Parse Attachments
      if (step['contentPayload'] != null &&
          step['contentPayload']['attachments'] != null) {
        _attachments = List<Map<String, dynamic>>.from(
            step['contentPayload']['attachments']);
      } else if (mediaType == 'DOCUMENT' && mediaUrl != null) {
        _attachments.add({'name': 'Documento', 'url': mediaUrl});
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Erro ao carregar detalhes do passo: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _completeStep() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(journeyServiceProvider).completeStep(
          widget.journeyId, widget.stepId,
          // Analytics Data
          // If Video, send percent 100 (as we only allow completion if 90%+)
          // If Document, send count
          // We can also send actual watch time if we tracked it precisely, but '100%' implies requirement met.
          data: {
            'percent': 100,
            'type': _stepData?['mediaType']?.toString().toUpperCase() ?? 'TEXT',
            'videoSource': _videoSourceType.toString().split('.').last,
            'completedAt': DateTime.now().toIso8601String(),
          });
      if (mounted) {
        // Show XP Award Dialog
        await XPAwardDialog.show(context, 10); // 10 XP base

        if (mounted) {
          context.pop();
          // Refresh progress
          ref.invalidate(journeyProgressProvider);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao concluir passo: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textPrimary = colorScheme.onSurface;
    final background = colorScheme.surface;

    if (_isLoading && _stepData == null) {
      return Scaffold(
        backgroundColor: background,
        appBar: AppBar(
          backgroundColor: background,
          iconTheme: IconThemeData(color: textPrimary),
          title: Text(
            'Carregando...',
            style: TextStyle(
              fontFamily: 'Space Mono',
              fontWeight: FontWeight.bold,
              color: textPrimary,
              fontSize: 16,
            ),
          ),
        ),
        body: Center(
            child: CircularProgressIndicator(color: colorScheme.primary)),
      );
    }

    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: background,
        appBar: AppBar(
          backgroundColor: background,
          iconTheme: IconThemeData(color: textPrimary),
          title: Text(
            'Erro',
            style: TextStyle(
              fontFamily: 'Space Mono',
              fontWeight: FontWeight.bold,
              color: textPrimary,
              fontSize: 16,
            ),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              _errorMessage!,
              style: TextStyle(color: textPrimary),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    if (_stepData == null) {
      return Scaffold(
        backgroundColor: background,
        appBar: AppBar(
          backgroundColor: background,
          iconTheme: IconThemeData(color: textPrimary),
          title: Text(
            'Passo não encontrado',
            style: TextStyle(
              fontFamily: 'Space Mono',
              fontWeight: FontWeight.bold,
              color: textPrimary,
              fontSize: 16,
            ),
          ),
        ),
        body: Center(
          child: Text(
            'Detalhes do passo não puderam ser carregados.',
            style: TextStyle(color: textPrimary),
          ),
        ),
      );
    }

    // Smart Fields Replacement
    final userProfile = ref.watch(userProfileProvider).value;
    final companySettings = ref.watch(companySettingsProvider).value;

    String replaceSmartFields(String text) {
      if (text.isEmpty) return text;
      var result = text;

      // User Fields
      if (userProfile != null) {
        final firstName = userProfile.name?.split(' ').first ?? '';
        final lastName = userProfile.name?.split(' ').last ?? '';
        result = result.replaceAll('{{user.firstName}}', firstName);
        result = result.replaceAll('{{user.lastName}}', lastName);
        result = result.replaceAll('{{user.name}}', userProfile.name ?? '');
        result = result.replaceAll('{{user.email}}', userProfile.email ?? '');
      }

      // Company Fields
      if (companySettings != null) {
        result = result.replaceAll(
            '{{company.name}}', companySettings.branding.appTitle);
      }

      return result;
    }

    final title = replaceSmartFields(_stepData!['title'] ?? 'Sem título');
    final contentPayload = _stepData!['contentPayload'] ?? {};
    final htmlContent = replaceSmartFields(contentPayload['htmlContent'] ?? '');
    final imageUrl = contentPayload['imageUrl'];

    // New Fields
    final contentType = _stepData!['contentType']?.toString().toUpperCase();
    final formConfig = _stepData!['formConfig'];
    final pollConfig = _stepData!['pollConfig'];

    final mediaType = _stepData!['mediaType']?.toString().toUpperCase();
    // final mediaUrl = _stepData!['mediaUrl']?.toString(); // Removed unused variable
    final requireAck = _stepData!['requireAck'] == true;
    final isCompleted = _stepData!['completed'] == true;

    // Read-only mode passed via extra
    final extra = GoRouterState.of(context).extra as Map<String, dynamic>?;
    final isReadOnly = extra?['isReadOnly'] == true || isCompleted;

    // Check if it's an embedded form/poll
    final isEmbeddedForm = contentType == 'FORM' && formConfig != null;
    final isEmbeddedPoll = contentType == 'POLL' && pollConfig != null;

    return Scaffold(
      backgroundColor: background,
      body: Stack(
        children: [
          // Content
          SingleChildScrollView(
            padding: const EdgeInsets.only(
                top: 100, bottom: 100), // Space for header and bottom button
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (imageUrl != null &&
                    imageUrl.isNotEmpty &&
                    mediaType != 'VIDEO')
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => Scaffold(
                            backgroundColor: Colors.black,
                            appBar: AppBar(
                              backgroundColor: Colors.black,
                              leading: IconButton(
                                icon: const Icon(Icons.close,
                                    color: Colors.white),
                                onPressed: () => Navigator.pop(context),
                              ),
                            ),
                            body: PhotoView(
                              imageProvider: NetworkImage(imageUrl),
                              minScale: PhotoViewComputedScale.contained,
                              maxScale: PhotoViewComputedScale.covered * 2,
                            ),
                          ),
                        ),
                      );
                    },
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.network(
                          imageUrl,
                          width: double.infinity,
                          height: 220,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              const SizedBox(
                                  height: 220,
                                  child: Center(
                                      child:
                                          Icon(Icons.broken_image, size: 50))),
                        ),
                      ),
                    ),
                  ),
                if (mediaType == 'VIDEO') ...[
                  if (_videoSourceType == VideoSourceType.youtube &&
                      _youtubeController != null)
                    Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: YoutubePlayer(
                        // key: UniqueKey(), // Removed to prevent crashing on iOS due to recreation

                        controller: _youtubeController!,
                        showVideoProgressIndicator: true,
                        progressIndicatorColor: Colors.amber,
                        progressColors: const ProgressBarColors(
                          playedColor: Colors.amber,
                          handleColor: Colors.amberAccent,
                        ),
                        onReady: () {
                          // Player is ready
                        },
                      ),
                    ),
                  if (_videoSourceType == VideoSourceType.native &&
                      _chewieController != null)
                    Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: AspectRatio(
                        aspectRatio: _nativeVideoController!.value.aspectRatio,
                        child: Chewie(
                          controller: _chewieController!,
                        ),
                      ),
                    ),
                  if (_videoSourceType == VideoSourceType.external)
                    Container(
                      margin: const EdgeInsets.all(16),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.ondemand_video,
                              size: 48, color: Colors.blueGrey),
                          const SizedBox(height: 16),
                          Text(
                            'Vídeo Externo',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Este vídeo está hospedado externamente. Clique abaixo para assistir.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: textPrimary.withValues(alpha: 0.7)),
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final url = _stepData!['mediaUrl'] as String?;
                                if (url != null) {
                                  final uri = Uri.parse(url);
                                  if (await canLaunchUrl(uri)) {
                                    await launchUrl(uri,
                                        mode: LaunchMode.externalApplication);
                                    // For external links, we can't track progress.
                                    // We assume if they clicked and returned, they might have watched.
                                    // OR we just rely on the Ack checkbox to force them to say "I watched".
                                  }
                                }
                              },
                              icon: const Icon(Icons.open_in_new),
                              label: const Text('Assistir Agora'),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],

                // DOCUMENT CARD LIST
                if (mediaType == 'DOCUMENT' && _attachments.isNotEmpty)
                  ..._attachments.map((att) {
                    final url = att['url'] as String;
                    final name = att['name'] ?? 'Documento';
                    final isOpened = _openedAttachmentUrls.contains(url);

                    return Container(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () async {
                            // Unified Logic: Open in WebView (BottomSheet)
                            // Android PDF Fix: Use Google Docs Viewer
                            var finalUrl = url;
                            if (Platform.isAndroid &&
                                (url.toLowerCase().endsWith('.pdf') ||
                                    url.toLowerCase().contains('.pdf?'))) {
                              finalUrl =
                                  'https://docs.google.com/gview?embedded=true&url=${Uri.encodeComponent(url)}';
                            }

                            await openWebSheet(context, finalUrl);

                            if (mounted) {
                              setState(() => _openedAttachmentUrls.add(url));
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: isOpened
                                        ? Colors.green.withValues(alpha: 0.1)
                                        : Colors.blue.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Icon(Icons.description_rounded,
                                      color:
                                          isOpened ? Colors.green : Colors.blue,
                                      size: 24),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'DOCUMENTO EM ANEXO',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.grey.shade600,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        name,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: textPrimary,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(
                                  isOpened
                                      ? Icons.check_circle
                                      : Icons.open_in_new_rounded,
                                  color: isOpened
                                      ? Colors.green
                                      : Colors.grey.shade400,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Space Mono',
                          color: textPrimary,
                          letterSpacing: -1.0,
                        ),
                      ),
                      const SizedBox(height: 24),
                      if (htmlContent.isNotEmpty)
                        HtmlWidget(
                          htmlContent,
                          textStyle: theme.textTheme.bodyLarge?.copyWith(
                            color: textPrimary.withValues(alpha: 0.8),
                            height: 1.6,
                            fontSize: 16,
                          ),
                          onTapUrl: (url) async {
                            // Fix for Android PDFs: WebView cannot render PDF natively.
                            // We use Google Docs Viewer if it's a PDF on Android.
                            var finalUrl = url;
                            if (Platform.isAndroid &&
                                (url.toLowerCase().endsWith('.pdf') ||
                                    url.toLowerCase().contains('.pdf?'))) {
                              finalUrl =
                                  'https://docs.google.com/gview?embedded=true&url=${Uri.encodeComponent(url)}';
                            }

                            // Opens in BottomSheet WebView (User Requirement)
                            openWebSheet(context, finalUrl);
                            return true;
                          },
                        ),

                      const SizedBox(height: 32),

                      // Embedded Form
                      if (isEmbeddedForm)
                        FormRenderer(
                          formConfig: formConfig,
                          isReadOnly: isReadOnly,
                          onSubmit: (answers, attachments) {
                            _handleFormSubmit(answers, attachments);
                          },
                        ),

                      // Embedded Poll
                      if (isEmbeddedPoll)
                        SurveyRenderer(
                          surveyConfig: pollConfig,
                          isReadOnly: isReadOnly,
                          onSubmit: (answers) {
                            _completeStepWithData(answers);
                          },
                        ),

                      if (requireAck &&
                          !isCompleted &&
                          !isEmbeddedForm &&
                          !isEmbeddedPoll) ...[
                        const SizedBox(height: 32),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: _ackChecked
                                ? Colors.green.withValues(alpha: 0.1)
                                : const Color(
                                    0xFFFFF9C4), // Light Yellow #FFF9C4
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: _ackChecked
                                    ? Colors.green.withValues(alpha: 0.3)
                                    : Colors.orange.withValues(alpha: 0.1)),
                          ),
                          child: Row(
                            children: [
                              Checkbox(
                                value: _ackChecked,
                                onChanged: (v) {
                                  if (v == true) {
                                    // Verify conditions before checking
                                    if (mediaType == 'VIDEO' &&
                                        !_isVideoCompleted) {
                                      // Native Check
                                      if (_videoSourceType ==
                                              VideoSourceType.native &&
                                          _nativeVideoController != null) {
                                        if (_nativeVideoController!
                                            .value.isInitialized) {
                                          final pos = _nativeVideoController!
                                              .value.position;
                                          final dur = _nativeVideoController!
                                              .value.duration;
                                          if (dur.inSeconds > 0 &&
                                              pos.inSeconds >=
                                                  (dur.inSeconds * 0.9)) {
                                            setState(() {
                                              _isVideoCompleted = true;
                                              _ackChecked = true;
                                            });
                                            return;
                                          }
                                        }
                                      }

                                      // YouTube Check
                                      if (_videoSourceType ==
                                              VideoSourceType.youtube &&
                                          _youtubeController != null) {
                                        final pos =
                                            _youtubeController!.value.position;
                                        final dur = _youtubeController!
                                            .metadata.duration;

                                        // Safety check for duration
                                        if (dur.inSeconds > 0 &&
                                            pos.inSeconds >=
                                                (dur.inSeconds * 0.9)) {
                                          setState(() {
                                            _isVideoCompleted = true;
                                            _ackChecked = true;
                                          });
                                          // Force rebuild if needed
                                        } else {
                                          _showWatchAlert();
                                        }
                                        return;
                                      }

                                      // External Check (Loose)
                                      if (_videoSourceType ==
                                          VideoSourceType.external) {
                                        // We trust them if they check the box, as we can't track.
                                        setState(() {
                                          _isVideoCompleted = true;
                                          _ackChecked = true;
                                        });
                                        return;
                                      }

                                      // Fallback for Native/Youtube if not complete
                                      _showWatchAlert();
                                      return;
                                    }
                                    if (mediaType == 'DOCUMENT' &&
                                        _attachments.isNotEmpty) {
                                      final allOpened = _attachments.every(
                                          (a) => _openedAttachmentUrls
                                              .contains(a['url']));

                                      if (!allOpened) {
                                        showDialog(
                                            context: context,
                                            builder: (c) => AlertDialog(
                                                  title: const Text('Atenção'),
                                                  content: const Text(
                                                      'Você precisa abrir todos os documentos em anexo para concordar que está ciente deste conteúdo.'),
                                                  actions: [
                                                    TextButton(
                                                        onPressed: () =>
                                                            Navigator.pop(c),
                                                        child: const Text('Ok'))
                                                  ],
                                                ));
                                        return;
                                      }
                                    }
                                    setState(() => _ackChecked = true);
                                  } else {
                                    setState(() => _ackChecked = false);
                                  }
                                },
                              ),
                              const Expanded(
                                child: Text(
                                  'Li e concordo com o conteúdo acima.',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Action Bar (Only for non-embedded or if completed)
          // For embedded, the submit button is inside the renderer
          if (!isEmbeddedForm && !isEmbeddedPoll)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: background,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: (isCompleted || isReadOnly)
                          ? null // Already completed or read-only
                          : () async {
                              // VALIDATION LOGIC

                              // 1. VIDEO CHECK
                              if (mediaType == 'VIDEO') {
                                if (!_isVideoCompleted) {
                                  // Double check state
                                  if (_videoSourceType ==
                                          VideoSourceType.native &&
                                      _nativeVideoController != null) {
                                    final pos =
                                        _nativeVideoController!.value.position;
                                    final dur =
                                        _nativeVideoController!.value.duration;
                                    if (dur.inSeconds > 0 &&
                                        pos.inSeconds >=
                                            (dur.inSeconds * 0.9)) {
                                      _isVideoCompleted = true;
                                    }
                                  } else if (_videoSourceType ==
                                          VideoSourceType.youtube &&
                                      _youtubeController != null) {
                                    final t = _youtubeController!
                                        .value.position.inSeconds;
                                    final d = _youtubeController!
                                        .metadata.duration.inSeconds;
                                    if (d > 0 && t > d * 0.9) {
                                      _isVideoCompleted = true;
                                    }
                                  } else if (_videoSourceType ==
                                      VideoSourceType.external) {
                                    // If external, and they are clicking "Complete" (and didn't require Ack or Ack is checked), we assume complete.
                                    // But if Ack is ON, Ack Check does logic.
                                    // If Ack is OFF, we might enforce "Click Link" at least once?
                                    // Let's assume if they are here without Ack blocking, and it is external, it is fine.
                                    _isVideoCompleted = true;
                                  }
                                }

                                if (!_isVideoCompleted) {
                                  _showWatchAlert();
                                  return;
                                }
                              }

                              // 2. DOCUMENT CHECK
                              if (mediaType == 'DOCUMENT' &&
                                  _attachments.isNotEmpty) {
                                final allOpened = _attachments.every((a) =>
                                    _openedAttachmentUrls.contains(a['url']));
                                if (!allOpened) {
                                  showDialog(
                                      context: context,
                                      builder: (c) => AlertDialog(
                                            title: const Text('Atenção'),
                                            content: const Text(
                                                'Você precisa abrir o(s) documento(s) em anexo para completar este passo.'),
                                            actions: [
                                              TextButton(
                                                  onPressed: () =>
                                                      Navigator.pop(c),
                                                  child: const Text('Ok'))
                                            ],
                                          ));
                                  return;
                                }
                              }

                              // 3. ACK CHECK
                              if (requireAck && !_ackChecked) {
                                // This shouldn't be reached if button is 'enabled' style but logic separation suggests checking.
                                // User requested: "Se ele não assiste... deve aparecer msg".
                                // For Ack, usually we disable button, but consistent UX might be popup too.
                                // But user said "Só é possível dar o Li e Aceito quando...". This implies the checkbox itself is disabled?
                                // "Se ele não abre o documento, deve aparecer um pop-up... e você precisa abrir para concordar"

                                // Wait, "Só é possível dar o Li e Aceito" -> Checkbox should be locked?
                                // Or checking it triggers the check?

                                // Let's implement: When clicking Checkbox, if requirements not met -> Show Popup & Don't Check.
                                // AND when clicking Complete, if not Checked -> Show Popup.

                                showDialog(
                                    context: context,
                                    builder: (c) => AlertDialog(
                                          title: const Text('Atenção'),
                                          content: const Text(
                                              'Você precisa confirmar a leitura para concluir.'),
                                          actions: [
                                            TextButton(
                                                onPressed: () =>
                                                    Navigator.pop(c),
                                                child: const Text('Ok'))
                                          ],
                                        ));
                                return;
                              }

                              _completeStep();
                            },
                      icon: Icon(isCompleted ? Icons.check : Icons.check_circle,
                          color: Colors.black),
                      label: Text(isCompleted
                          ? 'CONCLUÍDO'
                          : (isReadOnly
                              ? 'JORNADA CONCLUÍDA'
                              : 'MARCAR COMO CONCLUÍDO')),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: colorScheme.secondary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        textStyle: const TextStyle(
                          fontFamily: 'Space Mono',
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // Glass Header
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: ClipRRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  height: 100,
                  padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
                  decoration: BoxDecoration(
                    color: background.withValues(alpha: 0.8),
                    border: Border(
                      bottom: BorderSide(
                        color: textPrimary.withValues(alpha: 0.05),
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: Icon(Icons.arrow_back, color: textPrimary),
                        onPressed: () => context.pop(),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          title.toString().toUpperCase(),
                          style: TextStyle(
                            fontFamily: 'Space Mono',
                            fontWeight: FontWeight.bold,
                            color: textPrimary,
                            fontSize: 16,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleFormSubmit(Map<String, dynamic> answers,
      List<Map<String, dynamic>> rawAttachments) async {
    setState(() => _isLoading = true);
    try {
      List<Map<String, dynamic>> uploadedAttachments = [];

      if (rawAttachments.isNotEmpty) {
        final storage = ref.read(formsStorageProvider);
        // Use linkedFormId or a fallback if not present (though it should be for FORM type)
        // Corrected: Use _stepData instead of widget.step or widget.extra
        final formId =
            _stepData?['linkedFormId'] ?? 'journey_step_${widget.stepId}';

        for (final att in rawAttachments) {
          final path = att['path'] as String?;
          if (path != null) {
            final file = File(path);

            // Standardize filename: formTitle_userName_date.ext
            final user = ref.read(userProfileProvider).value;
            final userName = (user?.name ?? user?.email ?? 'unknown')
                .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');
            final formTitle = (_stepData?['title'] ?? 'form')
                .toString()
                .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');
            final dateStr = DateTime.now()
                .toIso8601String()
                .replaceAll(RegExp(r'[^a-zA-Z0-9]'), '');
            final ext = path.split('.').last;
            final customName = '${formTitle}_${userName}_$dateStr.$ext';

            final companyId = ref.read(envProvider).companyId;
            final uploaded = await storage.uploadFormFile(file,
                formId: formId,
                companyId: companyId,
                customFileName: customName);
            uploadedAttachments.add(uploaded.toJson());
          }
        }
      }

      final data = {
        ...answers,
        'attachments': uploadedAttachments,
      };

      await ref
          .read(journeyServiceProvider)
          .completeStep(widget.journeyId, widget.stepId, data: data);
      if (mounted) {
        await XPAwardDialog.show(context, 10);
        if (mounted) {
          context.pop();
          ref.invalidate(journeyProgressProvider);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _completeStepWithData(Map<String, dynamic> data) async {
    setState(() => _isLoading = true);
    try {
      await ref
          .read(journeyServiceProvider)
          .completeStep(widget.journeyId, widget.stepId, data: data);
      if (mounted) {
        await XPAwardDialog.show(context, 10);
        if (mounted) {
          context.pop();
          ref.invalidate(journeyProgressProvider);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
