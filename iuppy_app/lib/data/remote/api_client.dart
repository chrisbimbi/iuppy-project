import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiClient {
  final Dio _dio;
  final String companyId;
  ApiClient(this._dio, this.companyId);

  Future<Map<String, dynamic>> getCompanySettings() async {
    final resp = await _dio.get('/modules/$companyId/company-settings');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<List<Map<String, dynamic>>> getCompanyModules() async {
    final resp = await _dio.get('/modules/$companyId/company-modules');
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getSpaces() async {
    final resp =
        await _dio.get('/spaces', queryParameters: {'companyId': companyId});
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getChannels({String? spaceId}) async {
    final qp = {
      'companyId': companyId,
      if (spaceId != null) 'spaceId': spaceId
    };
    final resp = await _dio.get('/channels', queryParameters: qp);
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<List<Map<String, dynamic>>> getNewsByChannel(String channelId) async {
    final resp =
        await _dio.get('/news', queryParameters: {'channelId': channelId});
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getNewsDetail(String id) async {
    final resp = await _dio.get('/news/$id');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  Future<List<Map<String, dynamic>>> getSurveys() async {
    final resp = await _dio.get('/modules/$companyId/surveys');
    return List<Map<String, dynamic>>.from(
      (resp.data as List).map((e) => Map<String, dynamic>.from(e as Map)),
    );
  }

  Future<Map<String, dynamic>> getSurveyDetail(String id) async {
    final resp = await _dio.get('/modules/$companyId/surveys/$id');
    return Map<String, dynamic>.from(resp.data as Map);
  }

  /// POST oficial: /modules/{companyId}/surveys/responses
  /// Body esperado:
  /// {
  ///   "surveyId": "...",
  ///   "answers": [{"questionId":"...", "answer": ...}],
  ///   "userId": "..." (opcional)
  /// }
  Future<void> postSurveyResponse({
    required String surveyId,
    required List<Map<String, dynamic>> answers,
    String? userId,
  }) async {
    final body = <String, dynamic>{
      'surveyId': surveyId,
      'answers': answers,
      if (userId != null && userId.isNotEmpty) 'userId': userId,
    };

    if (kDebugMode) {
      // ignore: avoid_print
      print('[POST] /modules/$companyId/surveys/responses  body=$body');
    }

    await _dio.post(
      '/modules/$companyId/surveys/responses',
      data: body,
      options: Options(contentType: Headers.jsonContentType),
    );
  }
}
