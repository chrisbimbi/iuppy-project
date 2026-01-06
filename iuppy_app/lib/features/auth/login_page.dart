// lib/features/auth/login_page.dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../core/providers.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key, this.from, this.companySettings});
  final String? from;
  final CompanySettingsState? companySettings;

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _identifierCtrl = TextEditingController(); // Email, CPF or Matricula
  final _otpCtrl = TextEditingController(); // Email OTP or SMS Code
  final _phoneCtrl = TextEditingController(); // For CPF flow

  bool _loading = false;
  String? _error;

  // State Machine
  // 0: Identifier Input
  // 1: Email OTP Input
  // 2: Phone Input (for CPF flow)
  // 3: SMS Code Input (for CPF flow)
  int _step = 0;

  String? _verificationId; // Firebase SMS
  int? _resendToken;

  bool get _isEmailFlow => _identifierCtrl.text.contains('@');

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _otpCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _reset() {
    setState(() {
      _step = 0;
      _error = null;
      _loading = false;
      _otpCtrl.clear();
      _phoneCtrl.clear();
    });
  }

  Future<void> _handleIdentifier() async {
    final id = _identifierCtrl.text.trim();
    if (id.isEmpty) {
      setState(() => _error = 'Informe seu E-mail, CPF ou Matrícula');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    if (id.contains('@')) {
      // Flow A: Email
      try {
        final api = ref.read(apiClientProvider);
        await api.requestEmailOtp(id);
        setState(() {
          _step = 1;
          _loading = false;
        });
      } catch (e) {
        setState(() {
          _loading = false;
          _error = e.toString().replaceAll('Exception: ', '');
        });
      }
    } else {
      // Flow B: CPF/ID -> Ask for Phone
      setState(() {
        _step = 2;
        _loading = false;
      });
    }
  }

  // Flow A: Verify Email OTP
  Future<void> _verifyEmailCode() async {
    final code = _otpCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final resp = await api.verifyEmailOtp(_identifierCtrl.text.trim(), code);
      final token = resp['accessToken'];
      _finishLogin(token);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Código inválido ou expirado.';
      });
    }
  }

  // Flow B: Send SMS
  Future<void> _sendSms() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) {
      setState(() => _error = 'Informe seu celular');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          setState(() {
            _loading = false;
            _error = 'Falha no envio de SMS: ${e.message}';
          });
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() {
            _verificationId = verificationId;
            _resendToken = resendToken;
            _step = 3;
            _loading = false;
          });
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  // Flow B: Verify SMS Code
  Future<void> _verifySmsCode() async {
    final code = _otpCtrl.text.trim();
    if (code.isEmpty) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: code,
      );
      await _signInWithCredential(credential);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = 'Código SMS inválido.';
      });
    }
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      final userCred =
          await FirebaseAuth.instance.signInWithCredential(credential);
      final user = userCred.user;
      if (user == null) throw Exception('Falha no login Firebase');

      final idToken = await user.getIdToken();
      if (idToken == null) throw Exception('Token Firebase nulo');

      // Call Backend with ID + Token
      final api = ref.read(apiClientProvider);
      final resp = await api.loginById(_identifierCtrl.text.trim(), idToken);
      final token = resp['accessToken'];

      _finishLogin(token);
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  void _finishLogin(String accessToken) {
    ref.read(authControllerProvider.notifier).setAccessToken(accessToken);
    if (!mounted) return;

    final from = widget.from;
    if (from != null && from.isNotEmpty) {
      context.go(from);
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final effectiveSettings = widget.companySettings ??
        ref.watch(companySettingsProvider).maybeWhen(
              data: (s) => s,
              orElse: () => null,
            );

    final branding = effectiveSettings?.branding;
    final brandColor = Color(branding?.primary ?? 0xFF22B4FF);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              children: [
                _LogoHeader(branding: branding, brandColor: brandColor),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _getTitle(),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Space Mono',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _getSubtitle(),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.grey.shade600, fontSize: 13),
                      ),
                      const SizedBox(height: 24),

                      // Inputs based on step
                      if (_step == 0)
                        TextField(
                          controller: _identifierCtrl,
                          decoration: InputDecoration(
                            labelText: 'E-mail, CPF ou Matrícula',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            prefixIcon: const Icon(Icons.person_outline),
                          ),
                          onSubmitted: (_) => _handleIdentifier(),
                        )
                      else if (_step == 1) // Email OTP
                        TextField(
                          controller: _otpCtrl,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Código recebido no E-mail',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            prefixIcon: const Icon(Icons.email),
                          ),
                          onSubmitted: (_) => _verifyEmailCode(),
                        )
                      else if (_step == 2) // Phone Input
                        TextField(
                          controller: _phoneCtrl,
                          keyboardType: TextInputType.phone,
                          decoration: InputDecoration(
                            labelText: 'Seu celular (com DDD)',
                            hintText: '+55 11 99999-9999',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            prefixIcon: const Icon(Icons.phone),
                          ),
                          onSubmitted: (_) => _sendSms(),
                        )
                      else if (_step == 3) // SMS Code
                        TextField(
                          controller: _otpCtrl,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Código SMS',
                            border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12)),
                            prefixIcon: const Icon(Icons.sms),
                          ),
                          onSubmitted: (_) => _verifySmsCode(),
                        ),

                      const SizedBox(height: 24),
                      if (_error != null) ...[
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                      ],

                      SizedBox(
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _onAction,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: brandColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _loading
                              ? const CircularProgressIndicator(
                                  color: Colors.white)
                              : Text(_getActionLabel()),
                        ),
                      ),

                      if (_step > 0) ...[
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: _reset,
                          child: const Text('Voltar / Início'),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getTitle() {
    switch (_step) {
      case 0:
        return 'ACESSO';
      case 1:
        return 'VERIFICAÇÃO';
      case 2:
        return 'SEGURANÇA';
      case 3:
        return 'VERIFICAÇÃO';
      default:
        return '';
    }
  }

  String _getSubtitle() {
    switch (_step) {
      case 0:
        return 'Entre com seus dados corporativos';
      case 1:
        return 'Digite o código enviado para seu e-mail';
      case 2:
        return 'Para sua segurança, informe seu celular para receber um código de validação';
      case 3:
        return 'Digite o código enviado por SMS';
      default:
        return '';
    }
  }

  String _getActionLabel() {
    switch (_step) {
      case 0:
        return 'CONTINUAR';
      case 1:
        return 'ENTRAR';
      case 2:
        return 'ENVIAR SMS';
      case 3:
        return 'ENTRAR';
      default:
        return '';
    }
  }

  void _onAction() {
    switch (_step) {
      case 0:
        _handleIdentifier();
        break;
      case 1:
        _verifyEmailCode();
        break;
      case 2:
        _sendSms();
        break;
      case 3:
        _verifySmsCode();
        break;
    }
  }
}

class _LogoHeader extends StatelessWidget {
  final CompanyBranding? branding;
  final Color brandColor;

  const _LogoHeader({required this.branding, required this.brandColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (branding?.logoUrl != null && branding!.logoUrl!.isNotEmpty)
          SizedBox(
            height: 100,
            child: Image.network(branding!.logoUrl!, fit: BoxFit.contain),
          )
        else
          Text(
            branding?.appTitle ?? 'IUPPY',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: brandColor,
              fontFamily: 'Space Mono',
            ),
          ),
      ],
    );
  }
}
