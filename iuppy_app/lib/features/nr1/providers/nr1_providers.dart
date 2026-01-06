import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../forms/providers/forms_provider.dart';

// Provides only NR-1 related forms (Perception, Near Miss, etc)
final nr1FormsListProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  ref.watch(formsRefreshProvider); // Refresh trigger
  // Pass 'nr1_%' to filter forms starting with nr1_
  return ref.read(formsRepoProvider).listVisible(template: 'nr1_%');
});
