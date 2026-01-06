import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/features/vacations/providers/vacation_providers.dart';

class VacationPolicyPage extends ConsumerStatefulWidget {
  const VacationPolicyPage({super.key});

  @override
  ConsumerState<VacationPolicyPage> createState() => _VacationPolicyPageState();
}

class _VacationPolicyPageState extends ConsumerState<VacationPolicyPage> {
  // Controllers
  final _antecedenceCtrl = TextEditingController(text: '30');
  final _sellingLimitCtrl = TextEditingController(text: '10');
  
  // Toggles
  bool _allowFractioning = true;
  bool _allowCashAllowance = true;
  bool _allow13thAdvance = true;
  
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPolicy();
  }

  Future<void> _loadPolicy() async {
    try {
      final policy = await ref.read(vacationPolicyProvider.future);
      if (policy.isNotEmpty) {
        setState(() {
          _antecedenceCtrl.text = (policy['minDaysAntecedence'] ?? 30).toString();
          _sellingLimitCtrl.text = (policy['sellingLimitDays'] ?? 10).toString();
          _allowFractioning = policy['allowFractioning'] ?? true;
          _allowCashAllowance = policy['allowCashAllowance'] ?? true;
          _allow13thAdvance = policy['allow13thAdvance'] ?? true;
        });
      }
    } catch (e) {
      // ignore error, use defaults
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(title: const Text('Configuração de Férias')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Regras Gerais', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            TextField(
              controller: _antecedenceCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Antecedência Mínima (dias)',
                border: OutlineInputBorder(),
                helperText: 'Bloqueia solicitações fora deste prazo',
              ),
            ),
            const SizedBox(height: 16),

            SwitchListTile(
              title: const Text('Permitir Fracionamento'),
              subtitle: const Text('Até 3 períodos'),
              value: _allowFractioning,
              onChanged: (v) => setState(() => _allowFractioning = v),
            ),
            
            const Divider(),
            
            SwitchListTile(
              title: const Text('Permitir Abono Pecuniário'),
              value: _allowCashAllowance,
              onChanged: (v) => setState(() => _allowCashAllowance = v),
            ),
            
             if (_allowCashAllowance)
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 8),
                child: TextField(
                  controller: _sellingLimitCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Limite de Dias para Venda',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),

             const Divider(),

            SwitchListTile(
              title: const Text('Permitir Adiantamento 13º'),
              value: _allow13thAdvance,
              onChanged: (v) => setState(() => _allow13thAdvance = v),
            ),

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Salvar ainda não implementado no backend')));
                },
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                child: const Text('Salvar Política'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
