// mobile/lib/features/forms/models/form_models.dart
class FormModel {
  final String id;
  final String title;
  final String? description;
  final String status;

  FormModel({required this.id, required this.title, this.description, required this.status});

  static FormModel fromJson(Map<String, dynamic> j) => FormModel(
    id: j['id'], title: j['title'], description: j['description'], status: j['status'] ?? 'draft',
  );
}

class FormFieldModel {
  final String id;
  final String type;
  final String label;
  final bool required;

  FormFieldModel({required this.id, required this.type, required this.label, required this.required});

  static FormFieldModel fromJson(Map<String,dynamic> j) => FormFieldModel(
    id: j['id'], type: j['type'], label: j['label'], required: j['required'] == true,
  );
}
