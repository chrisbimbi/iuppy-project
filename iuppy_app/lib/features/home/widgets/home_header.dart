import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers.dart';
import '../../gamification/gamification_service.dart';
import '../../gamification/gamification_providers.dart'
    as gamification_providers;
import 'package:iuppy_app/features/news/widgets/avatar.dart';

class HomeHeader extends ConsumerWidget {
  const HomeHeader({super.key});

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authControllerProvider);
    final userAsync = ref.watch(userProfileProvider);
    final userStats = ref.watch(userStatsProvider);
    final gamification = ref.watch(gamificationServiceProvider);
    final gamificationEnabled =
        ref.watch(gamification_providers.gamificationEnabledProvider);

    final rawName = userAsync.value?.displayName ??
        userAsync.value?.name ??
        authState.userName ??
        'Developer Test';
    final userName =
        (rawName.toLowerCase() == 'usuário') ? 'Developer Test' : rawName;
    final firstName = userName.split(' ').first;
    final primaryColor = Theme.of(context).primaryColor;

    final userXP = userStats.value?['xp'] ?? 0;
    final currentLevel = gamification.getLevelFromXP(userXP);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(24),
            bottomRight: Radius.circular(24),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Greeting and name
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${_getGreeting()},',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          firstName,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1A1A1A),
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '👋',
                        style: TextStyle(fontSize: 28),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Gamification Stats - only show if module is enabled
                  if (gamificationEnabled)
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.orange.shade100),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.star,
                                  size: 14, color: Colors.orange.shade700),
                              const SizedBox(width: 4),
                              Text(
                                'Nível $currentLevel',
                                style: TextStyle(
                                  color: Colors.orange.shade800,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '$userXP XP',
                          style: TextStyle(
                            color: Colors.grey.shade500,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),

            // Avatar circle
            GestureDetector(
              onTap: () => GoRouter.of(context).push('/profile'),
              child: Avatar(
                userAsync.value?.avatarUrl,
                name: userName,
                size: 50,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
