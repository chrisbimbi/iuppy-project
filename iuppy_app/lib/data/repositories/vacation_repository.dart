import 'package:dio/dio.dart';

class VacationRepository {
  final Dio _dio;
  final String companyId;

  VacationRepository(this._dio, this.companyId);

  Future<Map<String, dynamic>> getBalance(String userId) async {
    try {
      final resp = await _dio.get('/vacations/balance/$userId');
      if (resp.data == null ||
          resp.data is String && (resp.data as String).isEmpty) {
        return {};
      }
      return Map<String, dynamic>.from(resp.data);
    } catch (_) {
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getRequests(String userId) async {
    try {
      final resp = await _dio.get('/vacations/requests/user/$userId');
      if (resp.data == null || resp.data is! List) {
        return [];
      }
      return (resp.data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  Future<void> requestVacation({
    required String userId,
    required DateTime startDate,
    required DateTime endDate,
    int? soldDays,
    bool? request13th,
  }) async {
    await _dio.post('/vacations/requests', data: {
      'userId': userId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'soldDays': soldDays,
      'request13th': request13th,
    });
  }

  Future<Map<String, dynamic>> getPolicy() async {
    try {
      final resp = await _dio.get('/vacations/policy');
      return Map<String, dynamic>.from(resp.data);
    } catch (_) {
      return {};
    }
  }

  Future<List<Map<String, dynamic>>> getAllRequests({String? status}) async {
    try {
      final resp = await _dio.get('/vacations/requests',
          queryParameters: status != null ? {'status': status} : null);
      if (resp.data == null || resp.data is! List) return [];
      return (resp.data as List).cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  Future<void> approveRequest(String requestId) async {
    await _dio.patch('/vacations/requests/$requestId/approve',
        data: {'approverId': 'CURRENT_USER'});
  }

  Future<void> rejectRequest(String requestId, String reason) async {
    await _dio.patch('/vacations/requests/$requestId/reject',
        data: {'rejectorId': 'CURRENT_USER', 'reason': reason});
  }
}
