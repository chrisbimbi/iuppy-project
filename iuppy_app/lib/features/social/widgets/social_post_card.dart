import 'package:flutter/material.dart';

class SocialPostCard extends StatelessWidget {
  final Map<String, dynamic> post;
  
  const SocialPostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    final author = post['author'] ?? {};
    final content = post['content'] ?? '';
    final media = post['media'] as List? ?? [];
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundImage: author['avatarUrl'] != null 
                    ? NetworkImage(author['avatarUrl']) 
                    : null,
                  child: author['avatarUrl'] == null ? const Icon(Icons.person) : null,
                ),
                const SizedBox(width: 10),
                Text(author['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 10),
            Text(content),
            if (media.isNotEmpty)
             Container(
               margin: const EdgeInsets.only(top: 10),
               height: 200,
               color: Colors.grey[200],
               child: const Center(child: Text('Media Placeholder')), // Use proper image widgets
             ),
             
             const Divider(),
             Row(
               mainAxisAlignment: MainAxisAlignment.spaceAround,
               children: [
                 TextButton.icon(
                   onPressed: () {},
                   icon: const Icon(Icons.thumb_up_alt_outlined),
                   label: Text('${post['reactionsCount'] ?? 0}'),
                 ),
                  TextButton.icon(
                   onPressed: () {},
                   icon: const Icon(Icons.comment_outlined),
                   label: Text('${post['commentsCount'] ?? 0}'),
                 ),
               ],
             )
          ],
        ),
      ),
    );
  }
}
