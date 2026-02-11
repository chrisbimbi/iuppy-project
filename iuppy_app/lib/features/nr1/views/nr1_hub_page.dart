import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class Nr1HubPage extends HookConsumerWidget {
  const Nr1HubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.grey[50], // Light background
      appBar: AppBar(
        title: Text(
          'NR-1 Digital',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildGrid(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.shield_outlined, size: 40, color: Colors.blue[700]),
        ),
        const SizedBox(height: 16),
        Text(
          'Gestão de Riscos & Conformidade',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.blueGrey[900],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Gerencie treinamentos, EPIs e reporte incidentes de forma rápida e segura.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: Colors.blueGrey[600],
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildGrid(BuildContext context) {
    final modules = [
      _ModuleItem(
        title: 'Meus Treinamentos',
        subtitle: 'Cursos e capacitações',
        icon: Icons.school_outlined,
        color: Colors.indigo,
        route: '/modules/nr1/trainings', // Must match router
      ),
      _ModuleItem(
        title: 'Plano de Emergência',
        subtitle: 'Procedimentos e simulados',
        icon: Icons.sos_outlined,
        color: Colors.redAccent,
        route: '/modules/nr1/emergency',
      ),
      _ModuleItem(
        title: 'Reportar Ocorrência',
        subtitle: 'Quase acidentes e riscos',
        icon: Icons.campaign_outlined,
        color: Colors.orange,
        route: '/modules/nr1/report',
      ),
      _ModuleItem(
        title: 'Participação',
        subtitle: 'CIPA, Sugestões e Recusas',
        icon: Icons.how_to_reg_outlined,
        color: Colors.teal,
        route:
            '/modules/nr1/participation', // We need to ensure this route exists or maps to forms
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: modules.length,
      itemBuilder: (context, index) {
        final item = modules[index];
        return _buildCard(context, item);
      },
    );
  }

  Widget _buildCard(BuildContext context, _ModuleItem item) {
    return Material(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        onTap: () => context.push(item.route),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: item.color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(item.icon, color: item.color, size: 32),
              ),
              const SizedBox(height: 16),
              Text(
                item.title,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                item.subtitle,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModuleItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String route;

  _ModuleItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.route,
  });
}
