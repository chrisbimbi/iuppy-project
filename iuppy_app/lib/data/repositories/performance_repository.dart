import 'package:dio/dio.dart';

class PerformanceRepository {
  final Dio _dio;
  final String companyId;

  PerformanceRepository(this._dio, this.companyId);

  Future<List<Map<String, dynamic>>> getGoals(String userId) async {
    final resp = await _dio.get('/performance/goals/$userId');
    return List<Map<String, dynamic>>.from(resp.data);
  }

  Future<List<Map<String, dynamic>>> getPDI(String userId) async {
    final resp = await _dio.get('/performance/pdi/$userId');
    return List<Map<String, dynamic>>.from(resp.data);
  }

  Future<void> submitAssessment(String formId, Map<int, int> ratings, Map<int, String> comments) async {
    await _dio.post('/performance/assessments/$formId/submit', data: {
      'ratings': ratings.map((key, value) => MapEntry(key.toString(), value)),
      'comments': comments.map((key, value) => MapEntry(key.toString(), value)),
    });
  }
}
