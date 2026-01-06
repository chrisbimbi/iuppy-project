class Nr1Training {
  final String id;
  final String title;
  final String type; // inicial, periodico
  final double hours;
  final List<dynamic> contents; // videos

  Nr1Training({
    required this.id, 
    required this.title,
    required this.type,
    required this.hours,
    required this.contents,
  });

  factory Nr1Training.fromJson(Map<String, dynamic> json) {
    return Nr1Training(
      id: json['id'] ?? '',
      title: json['titulo'] ?? '',
      type: json['tipo'] ?? '',
      hours: double.tryParse('${json['carga_horaria']}') ?? 0.0,
      contents: json['conteudos'] ?? [],
    );
  }
}
