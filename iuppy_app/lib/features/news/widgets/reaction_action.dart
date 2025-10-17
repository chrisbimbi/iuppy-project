import 'package:flutter/material.dart';

// Ícones (mantém os mesmos assets do app)
const _reactionAsset = <String, String>{
  'initial': 'assets/reactions_icons/initial-love.png',
  'like': 'assets/reactions_icons/like.png',
  'love': 'assets/reactions_icons/love.png',
  'clap': 'assets/reactions_icons/clap.png',
  'smile': 'assets/reactions_icons/smile.png',
  'neutral': 'assets/reactions_icons/neutral.png',
  'angry': 'assets/reactions_icons/angry.png',
};

Widget _png(String asset, {double size = 44, Key? key}) => Image.asset(asset,
    key: key, width: size, height: size, fit: BoxFit.contain);

/// Botão de reação controlado, mas com **estado visual local** para garantir
/// que o ícone resete imediatamente ao fazer `unreact()` mesmo que a árvore
/// acima ainda não tenha rebuildado.
class ReactionAction extends StatefulWidget {
  const ReactionAction({
    super.key,
    required this.currentKind,
    required this.onReact,
    required this.onUnreact,
  });

  final String? currentKind;
  final Future<void> Function(String kind) onReact;
  final Future<void> Function() onUnreact;

  @override
  State<ReactionAction> createState() => _ReactionActionState();
}

class _ReactionActionState extends State<ReactionAction> {
  String? _uiKind;
  bool _busy = false;

  static const _kinds = ['like', 'love', 'clap', 'smile', 'neutral', 'angry'];

  @override
  void initState() {
    super.initState();
    _uiKind = widget.currentKind;
  }

  @override
  void didUpdateWidget(covariant ReactionAction oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Se o estado vindo de cima mudou, sincroniza (server wins).
    if (oldWidget.currentKind != widget.currentKind && !_busy) {
      _uiKind = widget.currentKind;
    }
  }

  String get _assetForUiKind {
    final k = _uiKind;
    return _reactionAsset[k ?? 'initial']!;
  }

  Future<void> _pick(BuildContext context) async {
    // Logs de depuração (mantém próximo do que você imprimiu)
    // print('1) CURRENT KIND: ${_uiKind}');
    final box = context.findRenderObject() as RenderBox?;
    final overlay =
        Overlay.of(context).context.findRenderObject() as RenderBox?;
    if (box == null || overlay == null) return;

    final topLeft = box.localToGlobal(Offset.zero, ancestor: overlay);
    final topRight =
        box.localToGlobal(Offset(box.size.width, 0), ancestor: overlay);

    // Palette metrics
    const double itemSize = 38;
    const double gap = 10;
    const double hp = 12;
    const double vp = 8;
    final width =
        (_kinds.length * itemSize) + ((_kinds.length - 1) * gap) + (hp * 2);
    const double height = vp * 2 + itemSize;

    // Prefer ABOVE the button; fallback BELOW if no space
    double dx = (topLeft.dx + topRight.dx) / 2 - (width / 2);
    double dy = topLeft.dy - height - 8;

    // Clamp inside screen
    dx = dx.clamp(8.0, overlay.size.width - width - 8.0);
    final minTop = MediaQuery.of(context).padding.top + 8;
    if (dy < minTop) {
      dy = topLeft.dy + box.size.height + 8; // below
    }

    final picked = await showGeneralDialog<String>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'reactions',
      barrierColor: Colors.transparent,
      transitionDuration: const Duration(milliseconds: 120),
      pageBuilder: (c, a1, a2) {
        return Stack(children: [
          Positioned.fill(
              child: GestureDetector(onTap: () => Navigator.of(c).pop())),
          Positioned(
            left: dx,
            top: dy,
            child: Material(
              elevation: 6,
              color: Theme.of(c).colorScheme.surface,
              borderRadius: BorderRadius.circular(22),
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: hp, vertical: vp),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  for (int i = 0; i < _kinds.length; i++)
                    Padding(
                      padding: EdgeInsets.only(left: i == 0 ? 0 : gap),
                      child: InkResponse(
                        radius: 28,
                        onTap: () => Navigator.of(c).pop(_kinds[i]),
                        child: _png(_reactionAsset[_kinds[i]]!, size: itemSize),
                      ),
                    ),
                ]),
              ),
            ),
          ),
        ]);
      },
    );

    if (picked == null) return;
    // print('2) PICKED: $picked');

    if (_busy) return;
    setState(() => _busy = true);

    // **OTIMISTA**: atualiza ícone local imediatamente
    final prev = _uiKind;
    if (picked == _uiKind) {
      setState(() => _uiKind = null);
      try {
        await widget.onUnreact();
      } catch (_) {
        // Reverte em caso de falha
        setState(() => _uiKind = prev);
        rethrow;
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    } else {
      setState(() => _uiKind = picked);
      try {
        await widget.onReact(picked);
      } catch (_) {
        setState(() => _uiKind = prev);
        rethrow;
      } finally {
        if (mounted) setState(() => _busy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final asset = _assetForUiKind;

    return GestureDetector(
      key: ValueKey('reaction-${_uiKind ?? 'initial'}'),
      behavior: HitTestBehavior.opaque,
      onTap: _busy
          ? null
          : () async {
              if (_uiKind == null) {
                await _pick(context);
              } else {
                // Ícone volta imediatamente
                final prev = _uiKind;
                setState(() {
                  _busy = true;
                  _uiKind = null;
                });
                try {
                  await widget.onUnreact();
                } catch (_) {
                  if (mounted) setState(() => _uiKind = prev);
                  rethrow;
                } finally {
                  if (mounted) setState(() => _busy = false);
                }
              }
            },
      onLongPress: _busy ? null : () => _pick(context),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 120),
        child: _png(asset, key: ValueKey('img-${_uiKind ?? 'initial'}')),
      ),
    );
  }
}
