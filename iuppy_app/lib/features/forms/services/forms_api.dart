import 'package:iuppy_app/data/remote/api_client.dart';

class FormsApi {
  final ApiClient api;
  FormsApi(this.api);

  Future<List<Map<String, dynamic>>> list() async {
    return api.getForms();
  }

  Future<Map<String, dynamic>> get(String formId) async {
    return api.getFormDetail(formId);
  }

  /// Envia submissão no formato esperado pelo backend.
  Future<Map<String, dynamic>> submit({
    required String formId,
    required List<Map<String, dynamic>> answers,
    Map<String, dynamic>? meta,
    List<Map<String, dynamic>>? attachments,
    bool? external,
    String? externalEmail,
    List<String>? spaceIds,
    List<String>? groupIds,
  }) async {
    return api.postFormSubmission(
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
}
