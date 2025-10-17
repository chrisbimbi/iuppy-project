import 'package:flutter/material.dart';
import './avatar.dart';

typedef Person = ({String name, String avatar});

class InteractionStrip extends StatelessWidget {
  const InteractionStrip({
    super.key,
    required this.totalReacts,
    required this.totalComments,
    required this.totalShares,
    required this.reactorsSample,
    required this.commentersSample,
    required this.sharersSample,
  });

  final int totalReacts;
  final int totalComments;
  final int totalShares;

  final List<Person> reactorsSample;
  final List<Person> commentersSample;
  final List<Person> sharersSample;

  @override
  Widget build(BuildContext context) {
    final groups = <_GroupData>[];

    if (totalReacts > 0) {
      groups.add(_GroupData(
        label: 'Reações',
        total: totalReacts,
        sample: reactorsSample,
      ));
    }
    if (totalComments > 0) {
      groups.add(_GroupData(
        label: 'Comentários',
        total: totalComments,
        sample: commentersSample,
      ));
    }
    if (totalShares > 0) {
      groups.add(_GroupData(
        label: 'Compart.',
        total: totalShares,
        sample: sharersSample,
      ));
    }

    if (groups.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 16,
      runSpacing: 10,
      children: groups
          .map((g) => _GroupPill(
                label: g.label,
                total: g.total,
                sample: g.sample,
                onTap: () =>
                    _openPeopleSheet(context, g.label, g.total, g.sample),
              ))
          .toList(),
    );
  }

  void _openPeopleSheet(
    BuildContext context,
    String title,
    int total,
    List<Person> sample,
  ) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('$title • total: $total',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                if (sample.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('Sem amostras para exibir.'),
                  )
                else
                  Flexible(
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: sample.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final p = sample[i];
                        return ListTile(
                          leading: Avatar(p.avatar, name: p.name),
                          title: Text(p.name,
                              maxLines: 1, overflow: TextOverflow.ellipsis),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _GroupData {
  final String label;
  final int total;
  final List<Person> sample;

  _GroupData({required this.label, required this.total, required this.sample});
}

class _GroupPill extends StatelessWidget {
  const _GroupPill({
    required this.label,
    required this.total,
    required this.sample,
    required this.onTap,
  });

  final String label;
  final int total;
  final List<Person> sample;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final shown = sample.take(3).toList();
    final remaining = (total - shown.length).clamp(0, total);

    return InkWell(
      borderRadius: BorderRadius.circular(999),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.black12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            ...shown.map((p) => Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Avatar(p.avatar, name: p.name, size: 22),
                )),
            if (remaining > 0)
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: Text(
                  '+$remaining',
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            Text(label,
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
