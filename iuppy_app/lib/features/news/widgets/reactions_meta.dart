import 'package:flutter/material.dart';

/// catálogo de reações (ícone + rótulo)
const kReactions = <({String kind, IconData icon, String label})>[
  (kind: 'like', icon: Icons.thumb_up_alt_outlined, label: ''),
  (kind: 'love', icon: Icons.favorite_border, label: ''),
  (kind: 'clap', icon: Icons.emoji_events_outlined, label: ''),
  (kind: 'smile', icon: Icons.sentiment_satisfied_alt_outlined, label: ''),
  (kind: 'neutral', icon: Icons.sentiment_neutral_outlined, label: ''),
  (kind: 'angry', icon: Icons.sentiment_very_dissatisfied_outlined, label: ''),
];

IconData reactionIcon(String kind) => (kReactions
    .firstWhere((e) => e.kind == kind, orElse: () => kReactions.first)).icon;

String reactionLabel(String kind) => (kReactions
    .firstWhere((e) => e.kind == kind, orElse: () => kReactions.first)).label;

/// NOVO: lista de kinds
List<String> reactionKinds() => kReactions.map((e) => e.kind).toList();
