import 'package:flutter/material.dart';
import 'package:iuppy_app/data/remote/api_client.dart';
import 'package:iuppy_app/features/social/widgets/social_post_card.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // Added for ConsumerStatefulWidget


class SocialFeedPage extends ConsumerStatefulWidget {
  const SocialFeedPage({super.key});

  @override
  ConsumerState<SocialFeedPage> createState() => _SocialFeedPageState();
}

class _SocialFeedPageState extends ConsumerState<SocialFeedPage> {
  final ScrollController _scrollController = ScrollController();
  
  List<dynamic> _posts = [];
  bool _isLoading = true;
  int _page = 1;
  bool _hasMore = true;
  
  // Use a getter for API to ensure we have context/ref availability if needed, 
  // but typically we read it in methods.
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  void initState() {
    super.initState();
    // Post-frame callback or simple initState works for simple ref.read if provider is established
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _loadPosts() async {
    if (!_hasMore) return;
    
    try {
      // Correct Usage: getSocialFeed
      final res = await _api.getSocialFeed(page: _page);
      
      final newPosts = res['posts'] as List;
      final total = res['total'] as int? ?? 0;

      if (mounted) {
        setState(() {
          _posts.addAll(newPosts);
          _isLoading = false;
          _page++;
          _hasMore = _posts.length < total && newPosts.isNotEmpty;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      // Handle error
    }
  }
  
  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 && !_isLoading) {
      _loadPosts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Social Wall'),
      ),
      body: _isLoading && _posts.isEmpty 
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _onRefresh,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(), // Ensure pull-to-refresh works even if list not full
                controller: _scrollController,
                itemCount: _posts.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  return SocialPostCard(post: _posts[index]);
                },
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final success = await context.push('/social/feed/create');
          if (success == true) {
             _onRefresh();
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _onRefresh() async {
      setState(() {
          _posts = [];
          _page = 1;
          _hasMore = true;
          _isLoading = true;
      });
      await _loadPosts();
  }
}
