// lib/features/auth/login_page.dart
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key, this.from, this.companySettings});
  final String? from; // <- receber /surveys/ID etc. vindo do router
  final CompanySettingsState? companySettings; // <- recebido via extra

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController(text: 'chris@iuppy.com.br');
  final _password = TextFormFieldController('123456');
  bool _loading = false;
  String? _error;
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _doLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await ref
          .read(authControllerProvider.notifier)
          .login(_email.text.trim(), _password.text);

      if (!mounted) return;

      // Se veio de deep link: navega para o destino
      final from = widget.from;
      if (from != null && from.isNotEmpty) {
        context.go(from);
      } else {
        context.go('/home');
      }
    } on DioException catch (e) {
      String msg = 'Falha ao entrar.';
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        msg = data['message'].toString();
      } else if (e.message != null) {
        msg = e.message!;
      }
      setState(() => _error = msg);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Se não veio via extra, tenta puxar do provider (fallback)
    final effectiveSettings = widget.companySettings ??
        ref.watch(companySettingsProvider).maybeWhen(
              data: (s) => s,
              orElse: () => null,
            );

    final brandColor = Color(
      (effectiveSettings?.branding.primary ?? 0xFF22B4FF),
    );

    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Login'),
        backgroundColor: brandColor,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Form(
              key: _formKey,
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (effectiveSettings != null) ...[
                      Text(
                        effectiveSettings.branding.appSubtitle,
                        style: theme.textTheme.titleMedium,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _email,
                      enabled: !_loading,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.email],
                      decoration: const InputDecoration(labelText: 'E-mail'),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Informe o e-mail' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _password,
                      enabled: !_loading,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      decoration: InputDecoration(
                        labelText: 'Senha',
                        suffixIcon: IconButton(
                          onPressed: _loading
                              ? null
                              : () => setState(() => _obscure = !_obscure),
                          icon: Icon(_obscure
                              ? Icons.visibility
                              : Icons.visibility_off),
                        ),
                      ),
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'Informe a senha' : null,
                      onFieldSubmitted: (_) => _loading ? null : _doLogin(),
                    ),
                    const SizedBox(height: 16),
                    if (_error != null) ...[
                      Text(_error!,
                          style: theme.textTheme.bodyMedium
                              ?.copyWith(color: Colors.red)),
                      const SizedBox(height: 8),
                    ],
                    FilledButton(
                      onPressed: _loading ? null : _doLogin,
                      child: _loading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Entrar'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Pequena helper pra iniciar TextFormField com valor sem warning do linter
class TextFormFieldController extends TextEditingController {
  TextFormFieldController(String text) : super(text: text);
}
