import 'package:flutter/material.dart';

/// catálogo de reações (ícone + rótulo)
const REACTIONS = <({String kind, IconData icon, String label})>[
  (kind: 'like', icon: Icons.thumb_up_alt_outlined, label: ''),
  (kind: 'love', icon: Icons.favorite_border, label: ''),
  (kind: 'clap', icon: Icons.emoji_events_outlined, label: ''),
  (kind: 'smile', icon: Icons.sentiment_satisfied_alt_outlined, label: ''),
  (kind: 'neutral', icon: Icons.sentiment_neutral_outlined, label: ''),
  (kind: 'angry', icon: Icons.sentiment_very_dissatisfied_outlined, label: ''),
];

IconData reactionIcon(String kind) =>
    (REACTIONS.firstWhere((e) => e.kind == kind, orElse: () => REACTIONS.first))
        .icon;

String reactionLabel(String kind) =>
    (REACTIONS.firstWhere((e) => e.kind == kind, orElse: () => REACTIONS.first))
        .label;

/// NOVO: lista de kinds
List<String> reactionKinds() => REACTIONS.map((e) => e.kind).toList();
