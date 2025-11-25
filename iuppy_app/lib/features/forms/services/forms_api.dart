// lib/features/forms/services/forms_api.dart
import 'package:iuppy_app/data/remote/api_client.dart';

class FormsApi {
  final ApiClient _client;
  FormsApi(this._client);

  Future<List<Map<String, dynamic>>> list({
    Map<String, dynamic>? queryParameters,
  }) async {
    return _client.getForms(queryParameters: queryParameters);
  }

  Future<Map<String, dynamic>> getForm(String id) async {
    return _client.getFormDetail(id);
  }

  Future<Map<String, dynamic>> submit(
    String formId, {
    required List<Map<String, dynamic>> answers,
    Map<String, dynamic>? meta,
    List<Map<String, dynamic>>? attachments,
    bool? external,
    String? externalEmail,
    List<String>? spaceIds,
    List<String>? groupIds,
  }) async {
    return _client.postFormSubmission(
      formId,
      answers: answers,
      meta: meta,
      attachments: attachments,
      external: external,
      externalEmail: externalEmail,
      spaceIds: spaceIds,
      groupIds: groupIds,
    );
  }

  Future<Map<String, dynamic>> mySubmissions({
    int page = 1,
    int pageSize = 50,
    String? userId,
    String? locale,
  }) async {
    return _client.getMyFormSubmissions(
      page: page,
      pageSize: pageSize,
      userId: userId,
      locale: locale,
    );
  }

  // 🔥 Wrapper Novo
  Future<List<Map<String, dynamic>>> myInteractions({int limit = 50}) async {
    return _client.getMyFormInteractions(limit: limit);
  }

  Future<Map<String, dynamic>> submissionDetail(
    String formId,
    String submissionId, {
    String? locale,
  }) async {
    return _client.getFormSubmissionDetail(
      formId,
      submissionId,
      locale: locale,
    );
  }

  Future<Map<String, dynamic>> getChatHistory(
    String formId,
    String submissionId,
  ) async {
    return _client.getFormChatHistory(
      formId,
      submissionId,
      actor: 'user',
    );
  }

  Future<Map<String, dynamic>> postChatMessage(
    String formId,
    String submissionId,
    String message,
  ) async {
    final payload = {
      'message': message,
      'actor': 'user',
    };
    return _client.postFormChatMessage(
      formId,
      submissionId,
      payload: payload,
    );
  }
}
