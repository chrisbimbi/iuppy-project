import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';

class CompanyPage extends ConsumerWidget {
  const CompanyPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companyAsync = ref.watch(companySettingsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Minha Empresa'),
      ),
      body: companyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Erro: $e')),
        data: (settings) {
          final branding = settings.branding;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (branding.logoUrl != null)
                  Container(
                    height: 100,
                    margin: const EdgeInsets.only(bottom: 24),
                    child:
                        Image.network(branding.logoUrl!, fit: BoxFit.contain),
                  ),

                Text(
                  branding.appTitle ?? 'Empresa',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Space Mono',
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                _InfoCard(
                  title: 'Módulos Ativos',
                  content: settings.enabledModules.isEmpty
                      ? 'Nenhum módulo ativo'
                      : settings.enabledModules
                          .map((m) => m.toUpperCase())
                          .join(', '),
                ),

                const SizedBox(height: 16),

                // Placeholder for more company info
                const _InfoCard(
                  title: 'Sobre',
                  content:
                      'Plataforma de comunicação e engajamento corporativo.',
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final String content;

  const _InfoCard({required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
              fontFamily: 'Space Mono',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
