import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';
import '../../ui/widgets/premium_badge.dart';
import '../surveys/survey_providers.dart';
import '../journeys/journey_providers.dart'; // Import Journey Providers

class MenuDrawer extends ConsumerWidget {
  const MenuDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // 1. Dados
    final userAsync = ref.watch(userProfileProvider);
    final user = userAsync.valueOrNull;

    final companyState = ref.watch(companySettingsProvider);
    final branding = companyState.maybeWhen(
      data: (d) => d.branding,
      orElse: () => null,
    );
    final enabled = companyState.maybeWhen(
      data: (d) => d.enabledModules,
      orElse: () => <String>{},
    );

    // 2. Badges
    final unreadNews = ref.watch(unreadCountersProvider).maybeWhen(
          data: (d) => d,
          orElse: () =>
              const UnreadCounters(total: 0, bySpace: {}, byChannel: {}),
        );

    final unreadForms = ref.watch(formsBadgesProvider).maybeWhen(
          data: (val) => val,
          orElse: () => 0,
        );

    final unreadSurveys = ref.watch(newSurveysCountProvider).maybeWhen(
          data: (val) => val,
          orElse: () => 0,
        );

    final unreadJourneys = ref.watch(journeyBadgesProvider).maybeWhen(
          data: (val) => val,
          orElse: () => 0,
        );

    // 3. Rota Atual (Para marcar seleção)
    final String currentPath = GoRouterState.of(context).uri.toString();

    return Drawer(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      width: 320, // Um pouco mais largo para o estilo brutalista
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(0), // Brutalist: Zero radius or small
          bottomRight: Radius.circular(0),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // =================================================
            // 1. HEADER: LOGO GRANDE + PERFIL
            // =================================================
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Column(
                children: [
                  // A) LOGO CENTRALIZADA E BONITA
                  if (branding?.logoUrl != null &&
                      branding!.logoUrl!.isNotEmpty)
                    Container(
                      height: 60,
                      alignment: Alignment.center,
                      child: Image.network(
                        branding.logoUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) =>
                            _FallbackAppName(branding),
                      ),
                    )
                  else
                    _FallbackAppName(branding),

                  const SizedBox(height: 32),

                  // B) CARTÃO DO USUÁRIO (Brutalist)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      children: [
                        // Avatar com borda
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              )
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 24,
                            backgroundColor: Colors.grey.shade200,
                            backgroundImage: (user?.id != null)
                                ? const NetworkImage(
                                    'https://i.pravatar.cc/150?img=12')
                                : null,
                            child: (user?.id == null)
                                ? Icon(Icons.person_outline,
                                    color: Colors.grey.shade500)
                                : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Nome e E-mail
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.displayName ?? user?.name ?? 'Visitante',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: Colors.black87,
                                  fontFamily: 'Space Mono',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                user?.email ?? 'Bem-vindo',
                                style: TextStyle(
                                  color: Colors.grey.shade500,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  fontFamily: 'Space Mono',
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // =================================================
            // 2. LISTA DE NAVEGAÇÃO
            // =================================================
            Expanded(
              child: ListView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                children: [
                  const _SectionLabel('PRINCIPAL'),

                  const SizedBox(height: 8),
                  _PillMenuItem(
                    icon: Icons.home_outlined, // Igual NavBar
                    label: 'Início',
                    route: '/home',
                    currentPath: currentPath,
                    onTap: () => context.go('/home'),
                  ),
                  const SizedBox(height: 8),
                  if (enabled.contains('news'))
                    _NewsTree(unread: unreadNews, currentPath: currentPath),
                  const SizedBox(height: 8),
                  if (enabled.contains('surveys'))
                    _PillMenuItem(
                      icon: Icons.poll_outlined, // Outlined
                      label: 'Enquetes',
                      route: '/surveys',
                      currentPath: currentPath,
                      badgeCount: unreadSurveys,
                      onTap: () => context.push('/surveys'),
                    ),
                  const SizedBox(height: 8),
                  if (enabled.contains('forms'))
                    _PillMenuItem(
                      icon: Icons.assignment_outlined, // Outlined
                      label: 'Formulários',
                      route: '/forms',
                      currentPath: currentPath,
                      badgeCount: unreadForms,
                      onTap: () => context.push('/forms'),
                    ),
                  const SizedBox(height: 8),
                  if (enabled.contains('social'))
                    _PillMenuItem(
                      icon: Icons.rss_feed_outlined,
                      label: 'Social Wall',
                      route: '/social/feed',
                      currentPath: currentPath,
                      onTap: () => context.push('/social/feed'),
                    ),
                  const SizedBox(height: 8),
                  if (enabled.contains('journeys'))
                    _PillMenuItem(
                      icon: Icons.flag_outlined, // Outlined
                      label: 'Jornadas',
                      route: '/journeys',
                      currentPath: currentPath,
                      badgeCount: unreadJourneys,
                      onTap: () => context.push('/journeys'),
                    ),
                  // 🔥 NR-1
                  const SizedBox(height: 8),
                  if (enabled.contains('nr1'))
                    _PillMenuItem(
                      icon: Icons.security,
                      label: 'NR-1',
                      route: '/modules/nr1',
                      currentPath: currentPath,
                      onTap: () => context.push('/modules/nr1'),
                      badgeCount: 0,
                    ),
                  const SizedBox(height: 24), // Espaço antes dos itens movidos

                  // Itens movidos do topo
                  _PillMenuItem(
                    icon: Icons.person_outline,
                    label: 'Meu Perfil',
                    route: '/profile',
                    currentPath: currentPath,
                    onTap: () => context.push('/profile'),
                  ),
                  _PillMenuItem(
                    icon: Icons.business_outlined,
                    label: 'Minha Empresa',
                    route: '/company',
                    currentPath: currentPath,
                    onTap: () => context.push('/company'),
                  ),
                  _PillMenuItem(
                    icon: Icons.people_outline,
                    label: 'Minha Equipe',
                    route: '/team',
                    currentPath: currentPath,
                    onTap: () => context.push('/team'),
                  ),

                  const SizedBox(height: 32),
                  const _SectionLabel('PESSOAL'),
                  _PillMenuItem(
                    icon: Icons.star_border, // Igual NavBar (Favoritos)
                    label: 'Favoritos',
                    route: '/favorites',
                    currentPath: currentPath,
                    onTap: () => context.push('/favorites'),
                  ),
                  const SizedBox(height: 8),
                  _PillMenuItem(
                    icon: Icons
                        .history, // History usually doesn't have outlined variant distinct enough
                    label: 'Minhas atividades',
                    route: '/activities',
                    currentPath: currentPath,
                    onTap: () {},
                  ),
                  const SizedBox(height: 32),
                  const _SectionLabel('CONTA'),
                  _PillMenuItem(
                    icon: Icons.settings_outlined, // Igual NavBar
                    label: 'Configurações',
                    route: '/settings',
                    currentPath: currentPath,
                    onTap: () => context.push('/settings'),
                  ),
                  const SizedBox(height: 8),
                  _PillMenuItem(
                    icon: Icons.logout, // Sair
                    label: 'Sair',
                    route: '/logout',
                    currentPath: currentPath,
                    isDestructive: true,
                    onTap: () {
                      Navigator.pop(context);
                      ref.read(authControllerProvider.notifier).logout();
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Versão 2.0.1',
                    style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 11,
                        fontFamily: 'Space Mono'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FallbackAppName extends StatelessWidget {
  final CompanyBranding? branding;
  const _FallbackAppName(this.branding);

  @override
  Widget build(BuildContext context) {
    return Text(
      (branding?.appTitle ?? 'Iuppy').toUpperCase(),
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w900,
            color: Theme.of(context).primaryColor,
            letterSpacing: -0.5,
          ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 8, top: 8),
      child: Text(
        label,
        style: TextStyle(
          color: Colors.grey.shade400,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _PillMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String route;
  final String currentPath;
  final int badgeCount;
  final VoidCallback onTap;
  final bool isDestructive;

  const _PillMenuItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.currentPath,
    required this.onTap,
    this.badgeCount = 0,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    // Lógica de Seleção Robusta: "Começa com"
    // Ex: se route='/forms' e currentPath='/forms/details/1', fica selecionado.
    final isSelected = currentPath.startsWith(route);
    final theme = Theme.of(context);

    // Cores Soft UI
    final bgColor = isSelected
        ? (isDestructive
            ? Colors.red.shade50
            : theme.primaryColor.withOpacity(0.1))
        : Colors.transparent;

    final contentColor = isSelected
        ? (isDestructive ? Colors.red : theme.primaryColor)
        : (isDestructive ? Colors.red.shade300 : Colors.grey.shade600);

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: theme.primaryColor.withOpacity(0.1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(icon, size: 22, color: contentColor),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      color: contentColor,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                ),
                if (badgeCount > 0) PremiumBadge(count: badgeCount),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NewsTree extends ConsumerStatefulWidget {
  const _NewsTree({required this.unread, required this.currentPath});
  final UnreadCounters unread;
  final String currentPath;

  @override
  ConsumerState<_NewsTree> createState() => _NewsTreeState();
}

class _NewsTreeState extends ConsumerState<_NewsTree> {
  final Map<String, bool> _expanded = {};

  Future<Map<String, dynamic>> _loadFullTree(WidgetRef ref) async {
    // 🔥 FIX: Aguarda o perfil do usuário carregar para ter os grupos corretos
    await ref.read(userProfileProvider.future);

    final spaces = await ref.read(spacesRepoProvider).fetchAndCache();
    final channelMap = <String, List<Map<String, dynamic>>>{};

    await Future.wait(spaces.map((s) async {
      final sid = (s['id'] ?? '').toString();
      try {
        final channels =
            await ref.read(channelsRepoProvider).fetchAndCache(spaceId: sid);
        channelMap[sid] = channels;
      } catch (_) {
        channelMap[sid] = [];
      }
    }));

    return {'spaces': spaces, 'channels': channelMap};
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    const borderless = BorderSide(color: Colors.transparent);
    final shape = RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12), side: borderless);

    final isNewsActive = widget.currentPath.startsWith('/news');
    final activeColor = theme.primaryColor;

    return Theme(
      data: theme.copyWith(
        dividerColor: Colors.transparent,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent, // Remove highlight nativo
      ),
      child: ExpansionTile(
        leading: Icon(Icons.article_outlined, // Outlined igual NavBar
            color: isNewsActive ? activeColor : Colors.grey.shade600,
            size: 22),
        title: Row(
          children: [
            Text(
              'Comunicados',
              style: TextStyle(
                  fontWeight: isNewsActive ? FontWeight.w800 : FontWeight.w600,
                  fontSize: 14,
                  color: isNewsActive ? activeColor : Colors.grey.shade700),
            ),
            const Spacer(),
            if (widget.unread.total > 0)
              PremiumBadge(count: widget.unread.total),
          ],
        ),
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        shape: shape,
        collapsedShape: shape,
        children: [
          FutureBuilder<Map<String, dynamic>>(
            future: _loadFullTree(ref),
            builder: (ctx, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return Container(
                    padding: const EdgeInsets.all(16),
                    alignment: Alignment.centerLeft,
                    child: SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: theme.primaryColor.withOpacity(0.5))));
              }

              final spaces = (snap.data?['spaces'] as List?)
                      ?.cast<Map<String, dynamic>>() ??
                  [];
              final channelsMap = (snap.data?['channels'] as Map?)
                      ?.cast<String, List<Map<String, dynamic>>>() ??
                  {};

              if (spaces.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.only(left: 52, bottom: 12),
                  child: Text('Sem conteúdo',
                      style: TextStyle(color: Colors.grey, fontSize: 13)),
                );
              }

              return Column(
                children: spaces.map((s) {
                  final sid = (s['id'] ?? '').toString();
                  final expanded = _expanded[sid] ?? false;
                  final channels = channelsMap[sid] ?? [];

                  int spaceBadge = 0;
                  for (final c in channels) {
                    final cid = (c['id'] ?? '').toString();
                    spaceBadge += widget.unread.byChannel[cid] ?? 0;
                  }

                  return ExpansionTile(
                    shape: shape,
                    collapsedShape: shape,
                    tilePadding: const EdgeInsets.only(
                        left: 32, right: 16, top: 0, bottom: 0),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            (s['name'] ?? 'Space').toString(),
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                              color: expanded ? activeColor : Colors.grey[700],
                            ),
                          ),
                        ),
                        if (spaceBadge > 0) PremiumBadge(count: spaceBadge),
                      ],
                    ),
                    initiallyExpanded: expanded,
                    onExpansionChanged: (v) =>
                        setState(() => _expanded[sid] = v),
                    children: [
                      if (channels.isEmpty)
                        Padding(
                          padding: const EdgeInsets.only(
                              left: 48, bottom: 8, top: 8),
                          child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text('Sem canais',
                                  style: TextStyle(
                                      color: Colors.grey[400], fontSize: 12))),
                        )
                      else
                        ...channels.map((c) {
                          final cid = (c['id'] ?? '').toString();
                          final channelBadge =
                              widget.unread.byChannel[cid] ?? 0;
                          final isChannelActive =
                              widget.currentPath.contains(cid);

                          return InkWell(
                            onTap: () =>
                                GoRouter.of(context).push('/news/channel/$cid'),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              margin: const EdgeInsets.only(
                                  left: 16, right: 12, bottom: 2),
                              padding: const EdgeInsets.only(
                                  left: 32, right: 12, top: 10, bottom: 10),
                              decoration: BoxDecoration(
                                color: isChannelActive
                                    ? activeColor.withOpacity(0.08)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 4,
                                    height: 4,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isChannelActive
                                          ? activeColor
                                          : Colors.grey.shade300,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      (c['name'] ?? 'Canal').toString(),
                                      style: TextStyle(
                                        color: isChannelActive
                                            ? activeColor
                                            : Colors.grey[600],
                                        fontSize: 14,
                                        fontWeight: isChannelActive
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      ),
                                    ),
                                  ),
                                  if (channelBadge > 0)
                                    PremiumBadge(
                                        count: channelBadge, isCompact: true),
                                ],
                              ),
                            ),
                          );
                        }),
                    ],
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
