// lib/features/forms/models/form_models.dart
class FormFieldOption {
  final String id;
  final String label;

  FormFieldOption({required this.id, required this.label});

  factory FormFieldOption.fromJson(Map<String, dynamic> json) {
    return FormFieldOption(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
    );
  }
}

class FormFieldModel {
  final String id;
  final String type;
  final String label;
  final bool required;
  final List<FormFieldOption> options;
  final int? order;

  FormFieldModel({
    required this.id,
    required this.type,
    required this.label,
    required this.required,
    required this.options,
    this.order,
  });

  factory FormFieldModel.fromJson(Map<String, dynamic> json) {
    return FormFieldModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'short_text',
      label: json['label']?.toString() ?? '',
      required: json['required'] == true,
      options: (json['options'] as List? ?? [])
          .map((e) => FormFieldOption.fromJson(
              e is Map<String, dynamic> ? e : <String, dynamic>{'label': '$e'}))
          .toList(),
      order: json['order'] is int ? json['order'] as int : null,
    );
  }
}

class FormModel {
  final String id;
  final String title;
  final String description;
  final bool anonymous;
  final bool attachmentsAllowed;
  final List<FormFieldModel> fields;

  FormModel({
    required this.id,
    required this.title,
    required this.description,
    required this.anonymous,
    required this.attachmentsAllowed,
    required this.fields,
  });

  factory FormModel.fromJson(Map<String, dynamic> json) {
    return FormModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      anonymous: json['anonymous'] == true,
      attachmentsAllowed: json['attachmentsAllowed'] == true,
      fields: (json['fields'] as List? ?? [])
          .map((e) => FormFieldModel.fromJson(e))
          .toList()
        ..sort((a, b) => (a.order ?? 0).compareTo(b.order ?? 0)),
    );
  }
}

/// usado só quando o backend retorna "ok" antigo
class FormSubmissionResponse {
  final String message;
  FormSubmissionResponse(this.message);
}

/// --------- SUBMISSÃO (payload) ----------

class FormAnswerPayload {
  final String fieldId;
  final String type;
  final dynamic value;

  FormAnswerPayload({
    required this.fieldId,
    required this.type,
    required this.value,
  });

  Map<String, dynamic> toJson() => {
        'fieldId': fieldId,
        'type': type,
        'value': value,
      };
}

class FormAttachmentPayload {
  final String storagePath;
  final String mimeType;
  final int? bytes;

  FormAttachmentPayload({
    required this.storagePath,
    required this.mimeType,
    this.bytes,
  });

  Map<String, dynamic> toJson() => {
        'storagePath': storagePath,
        'mimeType': mimeType,
        if (bytes != null) 'bytes': bytes,
      };
}

class FormSubmissionRequest {
  final List<FormAnswerPayload> answers;
  final List<FormAttachmentPayload> attachments;
  final bool external;
  final String? externalEmail;
  final List<String>? spaceIds;
  final List<String>? groupIds;
  final Map<String, dynamic>? meta;

  FormSubmissionRequest({
    required this.answers,
    this.attachments = const [],
    this.external = false,
    this.externalEmail,
    this.spaceIds,
    this.groupIds,
    this.meta,
  });

  Map<String, dynamic> toJson() => {
        'answers': answers.map((e) => e.toJson()).toList(),
        if (attachments.isNotEmpty)
          'attachments': attachments.map((e) => e.toJson()).toList(),
        'external': external,
        if (externalEmail != null) 'externalEmail': externalEmail,
        if (spaceIds != null && spaceIds!.isNotEmpty) 'spaceIds': spaceIds,
        if (groupIds != null && groupIds!.isNotEmpty) 'groupIds': groupIds,
        if (meta != null) 'meta': meta,
      };
}

/// --------- DETALHE DA SUBMISSÃO ----------

class FormSubmissionDetail {
  final String submissionId;
  final String formId;
  final String? formTitle;
  final DateTime submittedAt;
  final String status;
  final bool external;
  final bool? isOnTime;
  final String? externalEmail;
  final List<FormAnswerDetail> answers;
  final List<FormAttachmentDetail> attachments;
  final List<FormRhActionDetail> rhActions;

  FormSubmissionDetail({
    required this.submissionId,
    required this.formId,
    required this.submittedAt,
    required this.status,
    required this.external,
    this.formTitle,
    this.isOnTime,
    this.externalEmail,
    this.answers = const [],
    this.attachments = const [],
    this.rhActions = const [],
  });

  factory FormSubmissionDetail.fromJson(Map<String, dynamic> json) {
    return FormSubmissionDetail(
      submissionId:
          json['submissionId']?.toString() ?? json['id']?.toString() ?? '',
      formId: json['formId']?.toString() ?? '',
      formTitle: json['formTitle']?.toString(),
      submittedAt: DateTime.tryParse(json['submittedAt']?.toString() ?? '') ??
          DateTime.now(),
      status: json['status']?.toString() ?? 'pending',
      external: json['external'] == true,
      isOnTime: json['isOnTime'] as bool?,
      externalEmail: json['externalEmail']?.toString(),
      answers: (json['answers'] as List? ?? [])
          .map((e) => FormAnswerDetail.fromJson(e as Map<String, dynamic>))
          .toList(),
      attachments: (json['attachments'] as List? ?? [])
          .map((e) => FormAttachmentDetail.fromJson(e as Map<String, dynamic>))
          .toList(),
      rhActions: (json['rhActions'] as List? ?? [])
          .map((e) => FormRhActionDetail.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class FormAnswerDetail {
  final String fieldId;
  final String type;
  final dynamic value;

  FormAnswerDetail({
    required this.fieldId,
    required this.type,
    this.value,
  });

  factory FormAnswerDetail.fromJson(Map<String, dynamic> json) {
    return FormAnswerDetail(
      fieldId: json['fieldId']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      value: json['value'],
    );
  }
}

class FormAttachmentDetail {
  final String storagePath;
  final String? mimeType;
  final int? bytes;

  FormAttachmentDetail({
    required this.storagePath,
    this.mimeType,
    this.bytes,
  });

  factory FormAttachmentDetail.fromJson(Map<String, dynamic> json) {
    return FormAttachmentDetail(
      storagePath: json['storagePath']?.toString() ?? '',
      mimeType: json['mimeType']?.toString(),
      bytes: json['bytes'] is int ? json['bytes'] as int : null,
    );
  }
}

class FormRhActionDetail {
  final String type; // reply|approve|reject
  final String? message;
  final DateTime createdAt;

  FormRhActionDetail({
    required this.type,
    required this.createdAt,
    this.message,
  });

  factory FormRhActionDetail.fromJson(Map<String, dynamic> json) {
    return FormRhActionDetail(
      type: json['type']?.toString() ?? '',
      message: json['message']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
