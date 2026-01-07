import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/news/widgets/chips.dart';

// --- Provider for Search Logic ---
final searchResultsProvider = StateNotifierProvider.autoDispose<SearchNotifier,
    AsyncValue<List<SearchResult>>>((ref) {
  return SearchNotifier(ref);
});

class SearchResult {
  final String id;
  final String type;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final DateTime createdAt;

  SearchResult({
    required this.id,
    required this.type,
    required this.title,
    this.subtitle,
    this.imageUrl,
    required this.createdAt,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      id: json['id'],
      type: json['type'],
      title: json['title'],
      subtitle: json['subtitle'],
      imageUrl: json['imageUrl'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class SearchNotifier extends StateNotifier<AsyncValue<List<SearchResult>>> {
  final Ref ref;
  Timer? _debounce;

  SearchNotifier(this.ref) : super(const AsyncValue.data([]));

  void search(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();

    if (query.trim().length < 2) {
      state = const AsyncValue.data([]);
      return;
    }

    state = const AsyncValue.loading();

    _debounce = Timer(const Duration(milliseconds: 500), () async {
      try {
        final dio = ref.read(dioProvider);
        final response =
            await dio.get('/search', queryParameters: {'q': query});
        final List data = response.data;
        final results = data.map((e) => SearchResult.fromJson(e)).toList();
        state = AsyncValue.data(results);
      } catch (e, st) {
        state = AsyncValue.error(e, st);
      }
    });
  }
}

// --- UI Component ---
class SearchBottomSheet extends HookConsumerWidget {
  final String? initialQuery;

  const SearchBottomSheet({super.key, this.initialQuery});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final results = ref.watch(searchResultsProvider);
    final notifier = ref.read(searchResultsProvider.notifier);
    // final theme = Theme.of(context);

    // Trigger initial search if provided
    useEffect(() {
      if (initialQuery != null && initialQuery!.isNotEmpty) {
        Future.microtask(() => notifier.search(initialQuery!));
      }
      return null;
    }, []);

    final controller = useTextEditingController(text: initialQuery);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Search Input
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: controller,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Buscar por título, hashtag...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
              onChanged: (value) => notifier.search(value),
            ),
          ),

          const Divider(),

          // Results List
          Expanded(
            child: results.when(
              data: (data) {
                if (data.isEmpty) {
                  return Center(
                    child: Text(
                      'Digite para buscar...',
                      style: TextStyle(color: Colors.grey[500]),
                    ),
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: data.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = data[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(8),
                          image: item.imageUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(item.imageUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: item.imageUrl == null
                            ? Icon(_getIconForType(item.type),
                                color: Colors.grey)
                            : null,
                      ),
                      title: Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (item.subtitle != null)
                            Text(
                              item.subtitle!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color: Colors.grey[600], fontSize: 12),
                            ),
                          const SizedBox(height: 4),
                          Pill(
                            _getLabelForType(item.type),
                            color: _getColorForType(item.type),
                            isOutlined: true,
                          ),
                        ],
                      ),
                      onTap: () {
                        context.pop(); // Close bottom sheet
                        _navigateToItem(context, item);
                      },
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Erro: $err')),
            ),
          ),
        ],
      ),
    );
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'news':
        return Icons.article;
      case 'form':
        return Icons.assignment;
      case 'survey':
        return Icons.poll;
      case 'journey':
        return Icons.map;
      default:
        return Icons.insert_drive_file;
    }
  }

  String _getLabelForType(String type) {
    switch (type) {
      case 'news':
        return 'Notícia';
      case 'form':
        return 'Formulário';
      case 'survey':
        return 'Enquete';
      case 'journey':
        return 'Jornada';
      default:
        return 'Outro';
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'news':
        return Colors.blue;
      case 'form':
        return Colors.orange;
      case 'survey':
        return Colors.purple;
      case 'journey':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  void _navigateToItem(BuildContext context, SearchResult item) {
    switch (item.type) {
      case 'news':
        context.push('/news/article/${item.id}');
        break;
      case 'form':
        context.push('/forms?formId=${item.id}');
        break;
      case 'survey':
        context.push('/surveys/${item.id}');
        break;
      case 'journey':
        context.push('/journeys/${item.id}');
        break;
      default:
        break;
    }
  }
}
