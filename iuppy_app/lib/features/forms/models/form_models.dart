// lib/features/forms/models/form_models.dart

// ==================================
// NOVO (Fase 3): Definição de Tipo
// ==================================
typedef TranslatableString = Map<String, String>;

/// Helper para ler um campo que pode ser uma string (legado)
/// ou um objeto de tradução JSONB (novo)
String _readTranslatable(dynamic jsonField, [String locale = 'pt-BR']) {
  if (jsonField == null) return '';
  if (jsonField is String) return jsonField; // Suporte legado
  if (jsonField is Map) {
    // Garante que o mapa é <String, dynamic>
    final Map<String, dynamic> map = Map<String, dynamic>.from(jsonField);
    // Tenta o locale, senão 'pt-BR', senão o primeiro
    return map[locale]?.toString() ??
        map['pt-BR']?.toString() ??
        map.values.first?.toString() ??
        '';
  }
  return jsonField.toString();
}

class FormFieldOption {
  final String id;
  final String label;

  FormFieldOption({required this.id, required this.label});

  factory FormFieldOption.fromJson(Map<String, dynamic> json) {
    return FormFieldOption(
      id: json['id']?.toString() ?? '',
      // ATUALIZADO (Fase 3): Opções de Múltipla Escolha usam a mesma lógica
      label: _readTranslatable(json['label']),
    );
  }
}

class FormFieldModel {
  final String id;
  final String type;
  final String label; // O título já traduzido
  final bool required;
  final List<FormFieldOption> options;
  final int? order;
  final TranslatableString labelMap; // O objeto jsonb original

  FormFieldModel({
    required this.id,
    required this.type,
    required this.label,
    required this.required,
    required this.options,
    this.order,
    required this.labelMap,
  });

  factory FormFieldModel.fromJson(Map<String, dynamic> json,
      [String locale = 'pt-BR']) {
    // ATUALIZADO (Fase 3): Ler o label traduzido
    final labelStr = _readTranslatable(json['label'], locale);

    return FormFieldModel(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? 'short_text',
      label: labelStr,
      labelMap: json['label'] is Map
          ? (json['label'] as Map)
              .map((key, value) => MapEntry(key.toString(), value.toString()))
          : {locale: labelStr},
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
  final String title; // O título já traduzido
  final String description; // A descrição já traduzida
  final bool anonymous;
  final bool attachmentsAllowed;
  final String attachmentHelpText; // O texto de ajuda já traduzido
  final List<FormFieldModel> fields;
  final String defaultLocale;
  final TranslatableString titleMap; // O objeto jsonb original

  FormModel({
    required this.id,
    required this.title,
    required this.description,
    required this.anonymous,
    required this.attachmentsAllowed,
    required this.attachmentHelpText,
    required this.fields,
    required this.defaultLocale,
    required this.titleMap,
  });

  factory FormModel.fromJson(Map<String, dynamic> json) {
    // ATUALIZADO (Fase 3): O locale vem do backend, senão 'pt-BR'
    final locale = json['defaultLocale']?.toString() ?? 'pt-BR';

    final titleStr = _readTranslatable(json['title'], locale);
    final descStr = _readTranslatable(json['description'], locale);
    final helpTextStr = _readTranslatable(json['attachmentHelpText'], locale);

    return FormModel(
      id: json['id']?.toString() ?? '',
      title: titleStr,
      description: descStr,
      attachmentHelpText: helpTextStr,
      defaultLocale: locale,
      titleMap: json['title'] is Map
          ? (json['title'] as Map)
              .map((key, value) => MapEntry(key.toString(), value.toString()))
          : {locale: titleStr},
      anonymous: json['anonymous'] == true,
      attachmentsAllowed: (json['attachmentsAllowed'] == true) ||
          (json['allowAttachments'] == true),
      fields: (json['fields'] as List? ?? [])
          .map((e) => FormFieldModel.fromJson(e, locale))
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
  final List<FormRhActionDetail> rhActions; // Legado S1

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
    // ATUALIZADO (Fase 3): O backend já envia o locale
    final locale = json['defaultLocale']?.toString() ?? 'pt-BR';

    return FormSubmissionDetail(
      submissionId:
          json['submissionId']?.toString() ?? json['id']?.toString() ?? '',
      formId: json['formId']?.toString() ?? '',
      // ATUALIZADO (Fase 3): Backend já envia o título traduzido
      formTitle: json['formTitle']?.toString(),
      submittedAt: DateTime.tryParse(json['submittedAt']?.toString() ?? '') ??
          DateTime.now(),
      status: json['status']?.toString() ?? 'pending',
      external: json['external'] == true,
      isOnTime: json['isOnTime'] as bool?,
      externalEmail: json['externalEmail']?.toString(),
      // ATUALIZADO (Fase 3): Passa o locale para o construtor do Answer
      answers: (json['answers'] as List? ?? [])
          .map((e) =>
              FormAnswerDetail.fromJson(e as Map<String, dynamic>, locale))
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
  final String label; // O label já traduzido

  FormAnswerDetail({
    required this.fieldId,
    required this.type,
    this.value,
    required this.label,
  });

  factory FormAnswerDetail.fromJson(Map<String, dynamic> json,
      [String locale = 'pt-BR']) {
    return FormAnswerDetail(
      fieldId: json['fieldId']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      value: json['value'],
      // ATUALIZADO (Fase 3): Backend já envia o label traduzido
      label: json['label']?.toString() ?? '',
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

// ==================================
// NOVO (Fase 1 - Chat S3)
// ==================================

/// Modelo para o histórico de chat retornado pela API
class FormChatHistory {
  final String chatStatus; // 'open' | 'closed'
  final List<FormChatMessage> messages;

  FormChatHistory({required this.chatStatus, this.messages = const []});

  factory FormChatHistory.fromJson(Map<String, dynamic> json) {
    return FormChatHistory(
      chatStatus: json['chatStatus']?.toString() ?? 'open',
      messages: (json['messages'] as List? ?? [])
          .map((e) => FormChatMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Modelo para uma única mensagem de chat
class FormChatMessage {
  final String id;
  final String actor; // 'user' | 'rh'
  final String? userId; // Quem enviou
  final String message;
  final DateTime createdAt;

  FormChatMessage({
    required this.id,
    required this.actor,
    required this.message,
    required this.createdAt,
    this.userId,
  });

  factory FormChatMessage.fromJson(Map<String, dynamic> json) {
    return FormChatMessage(
      id: json['id']?.toString() ?? '',
      actor: json['actor']?.toString() ?? 'user',
      userId: json['userId']?.toString(),
      message: json['message']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
