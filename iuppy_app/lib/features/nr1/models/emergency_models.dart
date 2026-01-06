class Nr1EmergencyProcedure {
  final String id;
  final String title;
  final String content; // URL or Markdown
  final String version;

  Nr1EmergencyProcedure({
    required this.id,
    required this.title,
    required this.content,
    required this.version,
  });

  factory Nr1EmergencyProcedure.fromJson(Map<String, dynamic> json) {
    return Nr1EmergencyProcedure(
      id: json['id'] ?? '',
      title: json['titulo'] ?? '',
      content: json['conteudo'] ?? '',
      version: json['versao'] ?? '',
    );
  }
}

class Nr1EmergencyDrill {
  final String id;
  final DateTime scheduledDate;
  final String location;
  final String? report;

  Nr1EmergencyDrill({
    required this.id,
    required this.scheduledDate,
    required this.location,
    this.report,
  });

  factory Nr1EmergencyDrill.fromJson(Map<String, dynamic> json) {
    return Nr1EmergencyDrill(
      id: json['id'] ?? '',
      scheduledDate: DateTime.tryParse(json['data_agendada'] ?? '') ?? DateTime.now(),
      location: json['local'] ?? '',
      report: json['relatorio'],
    );
  }
}
