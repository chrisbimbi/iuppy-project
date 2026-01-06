// lib/features/surveys/surveys_list_page.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:badges/badges.dart' as badges;

import '../../core/providers.dart';
import 'local_survey_store.dart';
import 'survey_providers.dart';

class SurveysListPage extends ConsumerStatefulWidget {
  const SurveysListPage({super.key});
  @override
  ConsumerState<SurveysListPage> createState() => _SurveysListPageState();
}

class _SurveysListPageState extends ConsumerState<SurveysListPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.refresh(surveysListProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final asyncSurveys = ref.watch(surveysListProvider);
    final newCount = ref
        .watch(newSurveysCountProvider)
        .maybeWhen(data: (v) => v, orElse: () => 0);

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          title: const Text('ENQUETES',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Space Mono',
                  letterSpacing: -0.5)),
          centerTitle: true,
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.black87,
          flexibleSpace: ClipRRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  border: Border(
                    bottom: BorderSide(color: Colors.grey.shade200),
                  ),
                ),
              ),
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              } else {
                context.go('/home');
              }
            },
          ),
          bottom: TabBar(
            labelColor: Colors.black,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.black,
            indicatorWeight: 3,
            labelStyle: const TextStyle(
                fontFamily: 'Space Mono', fontWeight: FontWeight.bold),
            unselectedLabelStyle: const TextStyle(fontFamily: 'Space Mono'),
            tabs: [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('DISPONÍVEIS'),
                    if (newCount > 0) ...[
                      const SizedBox(width: 8),
                      badges.Badge(
                        badgeContent: Text('$newCount',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 10)),
                        badgeStyle:
                            const badges.BadgeStyle(badgeColor: Colors.red),
                      )
                    ]
                  ],
                ),
              ),
              const Tab(text: 'RESPONDIDAS'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _SurveysList(
              filter: (id, store) async => true,
              emptyMessage: 'Nenhuma enquete encontrada.',
              isHistory: false,
            ),
            _SurveysList(
              filter: (id, store) async => await store.hasSubmitted(id),
              emptyMessage: 'Você ainda não respondeu nenhuma enquete.',
              isHistory: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _SurveysList extends ConsumerWidget {
  final Future<bool> Function(String id, LocalSurveyStore store) filter;
  final String emptyMessage;
  final bool isHistory;

  const _SurveysList(
      {required this.filter,
      required this.emptyMessage,
      required this.isHistory});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncSurveys = ref.watch(surveysListProvider);
    final store = ref.watch(localSurveyStoreProvider);

    return asyncSurveys.when(
      data: (all) {
        return FutureBuilder<List<Map<String, dynamic>>>(
          future: Future.wait(all.map((s) async {
            final id = s['id']?.toString() ?? '';
            if (await filter(id, store)) return s;
            return null;
          })).then((l) => l.whereType<Map<String, dynamic>>().toList()),
          builder: (ctx, snap) {
            if (!snap.hasData) {
              return const Center(
                  child: CircularProgressIndicator(color: Colors.black));
            }
            final list = snap.data!;

            if (list.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                        isHistory
                            ? Icons.assignment_turned_in_outlined
                            : Icons.poll_outlined,
                        size: 64,
                        color: Colors.grey.shade300),
                    const SizedBox(height: 16),
                    Text(emptyMessage,
                        style: TextStyle(
                            color: Colors.grey.shade500,
                            fontFamily: 'Space Mono')),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              color: Colors.black,
              onRefresh: () async => ref.refresh(surveysListProvider),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 16),
                itemBuilder: (_, i) => _SurveyCardWrapper(
                    survey: list[i], isHistoryTab: isHistory),
              ),
            );
          },
        );
      },
      loading: () =>
          const Center(child: CircularProgressIndicator(color: Colors.black)),
      error: (e, _) => Center(child: Text('Erro: $e')),
    );
  }
}

class _SurveyCardWrapper extends ConsumerWidget {
  final Map<String, dynamic> survey;
  final bool isHistoryTab;

  const _SurveyCardWrapper({required this.survey, required this.isHistoryTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = survey['id']?.toString() ?? '';

    return FutureBuilder<bool>(
      future: ref.read(localSurveyStoreProvider).hasSubmitted(id),
      builder: (context, snapshot) {
        final submitted = snapshot.data ?? false;
        final isDisabled = !isHistoryTab && submitted;

        return _SurveyCard(
          survey: survey,
          isSubmitted: submitted,
          isDisabledLook: isDisabled,
          isHistoryTab: isHistoryTab,
          onTap: () {
            if (isDisabled) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                content: Text(
                    "Você já respondeu esta enquete. Veja na aba 'Respondidas'."),
                duration: Duration(seconds: 2),
              ));
            } else {
              if (!submitted) ref.read(localSurveyStoreProvider).markAsSeen(id);
              context.push('/surveys/$id');
            }
          },
        );
      },
    );
  }
}

class _SurveyCard extends StatelessWidget {
  final Map<String, dynamic> survey;
  final bool isSubmitted;
  final bool isDisabledLook;
  final bool isHistoryTab;
  final VoidCallback onTap;

  const _SurveyCard({
    required this.survey,
    required this.isSubmitted,
    required this.isDisabledLook,
    required this.isHistoryTab,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final title = survey['title']?.toString() ?? '';
    final desc = survey['description']?.toString() ?? '';

    final ackRequired = survey['acknowledgementRequired'] == true;
    final isAnonymous = survey['isAnonymous'] == true;
    final endsAt = survey['endsAt']?.toString();

    String deadlineText = '';
    Color deadlineColor = Colors.grey;
    if (endsAt != null && endsAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(endsAt).toLocal();
        deadlineText =
            '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}';

        if (dt.difference(DateTime.now()).inHours < 24 &&
            dt.isAfter(DateTime.now())) {
          deadlineColor = Colors.red;
        } else if (dt.isBefore(DateTime.now())) {
          deadlineText = 'Expirada';
          deadlineColor = Colors.grey;
        } else {
          deadlineColor = Colors.orange.shade800;
        }
      } catch (_) {}
    }

    // 🔥 SE FOR HISTÓRICO: Tudo fica cinza e discreto
    if (isHistoryTab) {
      deadlineColor = Colors.grey;
    }

    return Container(
      decoration: BoxDecoration(
        color: isDisabledLook ? const Color(0xFFF9FAFB) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color:
                isDisabledLook ? Colors.grey.shade200 : Colors.grey.shade200),
        boxShadow: isDisabledLook
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isSubmitted
                            ? Colors.green.shade50
                            : Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: isSubmitted
                                ? Colors.green.shade100
                                : Colors.grey.shade200),
                      ),
                      child: Icon(
                        isSubmitted ? Icons.check_circle : Icons.poll,
                        color: isSubmitted ? Colors.green : Colors.black87,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title,
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  fontFamily: 'Space Mono',
                                  letterSpacing: -0.5,
                                  color: isDisabledLook
                                      ? Colors.grey
                                      : Colors.black87)),
                          if (desc.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(desc,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    fontSize: 13, color: Colors.grey[600])),
                          ]
                        ],
                      ),
                    )
                  ],
                ),

                // 🔥 CHIPS LOGIC
                if (!isDisabledLook) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (deadlineText.isNotEmpty)
                        _InfoChip(
                            icon: Icons.timer_outlined,
                            text: 'Até $deadlineText',
                            color: deadlineColor,
                            bg: deadlineColor == Colors.red
                                ? Colors.red.shade50
                                : (isHistoryTab
                                    ? Colors.grey.shade100
                                    : Colors.orange.shade50)),

                      // Ação necessária: Só mostra se NÃO for histórico e NÃO submeteu
                      if (ackRequired && !isSubmitted && !isHistoryTab)
                        _InfoChip(
                            icon: Icons.notification_important,
                            text: 'Ação Necessária',
                            color: Colors.red.shade700,
                            bg: Colors.red.shade50),

                      if (isAnonymous)
                        _InfoChip(
                            icon: Icons.visibility_off,
                            text: 'Anônima',
                            color: isHistoryTab ? Colors.grey : Colors.blueGrey,
                            bg: isHistoryTab
                                ? Colors.grey.shade100
                                : Colors.blueGrey.shade50),

                      if (isHistoryTab && isSubmitted)
                        _InfoChip(
                            icon: Icons.done_all,
                            text: 'Respondida',
                            color: Colors.green.shade700,
                            bg: Colors.green.shade50),
                    ],
                  )
                ]
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  final Color bg;
  const _InfoChip(
      {required this.icon,
      required this.text,
      required this.color,
      required this.bg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(text,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: color,
                  fontFamily: 'Space Mono')),
        ],
      ),
    );
  }
}
