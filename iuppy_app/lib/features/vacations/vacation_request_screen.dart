import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:iuppy_app/core/providers.dart';
import 'package:iuppy_app/features/vacations/providers/vacation_providers.dart';
import 'package:go_router/go_router.dart';
import 'package:iuppy_app/core/widgets/skeleton.dart';

class VacationRequestScreen extends ConsumerStatefulWidget {
  const VacationRequestScreen({super.key});

  @override
  ConsumerState<VacationRequestScreen> createState() =>
      _VacationRequestScreenState();
}

class _VacationRequestScreenState extends ConsumerState<VacationRequestScreen> {
  DateTime? _startDate;
  DateTime? _endDate;
  bool _sellDays = false;
  bool _advance13th = false;

  bool _isLoadingPolicy = true;
  Map<String, dynamic> _policy = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadPolicy());
  }

  Future<void> _loadPolicy() async {
    try {
      final policy = await ref.read(vacationPolicyProvider.future);
      if (mounted) {
        setState(() {
          _policy = policy;
          _isLoadingPolicy = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingPolicy = false);
    }
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    if (_isLoadingPolicy) return;

    final minDays = _policy['minDaysAntecedence'] ?? 30;

    final picked = await showDatePicker(
        context: context,
        initialDate: DateTime.now().add(Duration(days: minDays + 1)),
        firstDate: DateTime.now().add(Duration(days: minDays)),
        lastDate: DateTime.now().add(const Duration(days: 365)),
        helpText: 'ANTECEDÊNCIA MÍNIMA: $minDays DIAS',
        builder: (context, child) {
          return Theme(
            data: ThemeData.light().copyWith(
              primaryColor: Colors.black,
              colorScheme: const ColorScheme.light(primary: Colors.black),
              buttonTheme:
                  const ButtonThemeData(textTheme: ButtonTextTheme.primary),
            ),
            child: child!,
          );
        });
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          _endDate ??= picked.add(const Duration(days: 14));
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Selecione as datas')));
      return;
    }

    final userAsync = ref.read(userProfileProvider);
    final user = userAsync.value;

    if (user == null || user.id == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erro: Usuário não identificado')));
      return;
    }

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (c) =>
            const Center(child: CircularProgressIndicator(color: Colors.white)),
      );

      final repo = ref.read(vacationRepositoryProvider);
      await repo.requestVacation(
        userId: user.id!,
        startDate: _startDate!,
        endDate: _endDate!,
        soldDays: _sellDays ? 10 : 0,
        request13th: _advance13th,
      );

      if (!mounted) return;
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('🌴 Solicitação enviada com sucesso!'),
            backgroundColor: Colors.green),
      );

      ref.invalidate(vacationBalanceProvider(user.id!));
      ref.invalidate(vacationRequestsProvider(user.id!));

      context.pop();
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Erro ao enviar: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoadingPolicy) {
      return Scaffold(
          appBar: AppBar(title: const Text('Carregando...')),
          body: const Padding(
              padding: EdgeInsets.all(20),
              child: Column(children: [
                Skeleton(height: 100),
                SizedBox(height: 20),
                Skeleton(height: 200)
              ])));
    }

    final duration = _startDate != null && _endDate != null
        ? _endDate!.difference(_startDate!).inDays + 1
        : 0;

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('NOVA SOLICITAÇÃO',
            style: TextStyle(
                fontFamily: 'Space Mono',
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Colors.black87)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('SELECIONE O PERÍODO /',
                style: TextStyle(
                    fontFamily: 'Space Mono',
                    fontWeight: FontWeight.bold,
                    color: Colors.grey)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _DateButton(
                      label: 'INÍCIO',
                      date: _startDate,
                      onTap: () => _selectDate(context, true)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _DateButton(
                      label: 'FIM',
                      date: _endDate,
                      onTap: () => _selectDate(context, false)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (duration > 0)
              Center(
                  child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(20)),
                      child: Text('$duration DIAS SELECIONADOS',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold)))),
            const Divider(height: 48),
            if (_policy['allowCashAllowance'] != false)
              _SwitchOption(
                  title: 'Abono Pecuniário',
                  subtitle: 'Vender 10 dias de férias',
                  value: _sellDays,
                  onChanged: (v) => setState(() => _sellDays = v),
                  icon: Icons.monetization_on_outlined),
            const SizedBox(height: 16),
            if (_policy['allow13thAdvance'] != false)
              _SwitchOption(
                  title: 'Adiantamento 13º',
                  subtitle: 'Receber 1ª parcela',
                  value: _advance13th,
                  onChanged: (v) => setState(() => _advance13th = v),
                  icon: Icons.calendar_month_outlined),
            if (duration > 0) ...[
              const Divider(height: 48),
              const Text('RESUMO (SIMULADO) /',
                  style: TextStyle(
                      fontFamily: 'Space Mono',
                      fontWeight: FontWeight.bold,
                      color: Colors.grey)),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 5))
                    ]),
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _SummaryRow(
                        label: 'Período',
                        value:
                            '${DateFormat('dd/MM').format(_startDate!)} até ${DateFormat('dd/MM').format(_endDate!)}'),
                    const SizedBox(height: 12),
                    _SummaryRow(
                        label: 'Retorno',
                        value: DateFormat('dd/MM/yyyy')
                            .format(_endDate!.add(const Duration(days: 1)))),
                    if (_sellDays) ...[
                      const Divider(height: 24),
                      const _SummaryRow(
                          label: 'Abono Pecuniário',
                          value: 'SIM',
                          valueColor: Colors.green),
                    ],
                    if (_advance13th) ...[
                      const SizedBox(height: 12),
                      const _SummaryRow(
                          label: '13º Adiantado',
                          value: 'SIM',
                          valueColor: Colors.green),
                    ],
                  ],
                ),
              ),
            ],
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: Colors.black,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 5),
                child: const Text('ENVIAR SOLICITAÇÃO',
                    style:
                        TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateButton extends StatelessWidget {
  final String label;
  final DateTime? date;
  final VoidCallback onTap;

  const _DateButton(
      {required this.label, required this.date, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
              color: date == null ? Colors.grey.shade300 : Colors.black87,
              width: date == null ? 1 : 2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(label,
                style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 11,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(date == null ? '--/--' : DateFormat('dd/MM').format(date!),
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color:
                        date == null ? Colors.grey.shade400 : Colors.black87))
          ],
        ),
      ),
    );
  }
}

class _SwitchOption extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final IconData icon;

  const _SwitchOption(
      {required this.title,
      required this.subtitle,
      required this.value,
      required this.onChanged,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: SwitchListTile(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(subtitle),
        value: value,
        onChanged: onChanged,
        activeColor: Colors.black,
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: Colors.black87),
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _SummaryRow(
      {required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade600)),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.bold,
                color: valueColor ?? Colors.black87)),
      ],
    );
  }
}
