import 'package:iuppy_app/data/remote/api_client.dart';

class JourneyService {
  final ApiClient _apiClient;

  JourneyService(this._apiClient);

  Future<List<Map<String, dynamic>>> getProgress() async {
    return _apiClient.getJourneyProgress();
  }

  Future<Map<String, dynamic>> getJourneyDetail(String id) async {
    return _apiClient.getJourneyDetail(id);
  }

  Future<Map<String, dynamic>> completeStep(String journeyId, String stepId,
      {Map<String, dynamic>? data}) async {
    return _apiClient.completeJourneyStep(journeyId, stepId, data: data);
  }

  Future<Map<String, dynamic>> getStepDetails(
      String journeyId, String stepId) async {
    // Assuming this method exists in ApiClient or I need to add it.
    // Based on grep results, there was no getJourneyStepDetail, but let's check ApiClient again or assume a path.
    // Actually, looking at grep results earlier:
    // 819: completeJourneyStep
    // 805: getJourneyDetail
    // It seems there isn't a direct getStepDetail in ApiClient shown in grep.
    // I will check ApiClient to be sure.
    // For now, I'll add it here and if ApiClient misses it, I'll add it there too.
    return _apiClient.getJourneyStepDetail(journeyId, stepId);
  }
}
