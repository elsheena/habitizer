import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  final VoidCallback onAuthSuccess;
  const AuthScreen({super.key, required this.onAuthSuccess});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true;
  final _emailCtrl = TextEditingController(text: 'alex.doe@habitizer.io');
  final _passCtrl = TextEditingController(text: 'HabitSecure#2026');
  final _nameCtrl = TextEditingController(text: 'Jordan Smith');
  bool isLoading = false;
  String? errorMsg;

  Future<void> _submit() async {
    setState(() {
      isLoading = true;
      errorMsg = null;
    });

    try {
      if (isLogin) {
        await ApiService.login(_emailCtrl.text.trim(), _passCtrl.text.trim());
      } else {
        await ApiService.register(_nameCtrl.text.trim(), _emailCtrl.text.trim(), _passCtrl.text.trim());
      }
      widget.onAuthSuccess();
    } catch (e) {
      setState(() {
        errorMsg = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  void _loadMock() {
    _emailCtrl.text = 'alex.doe@habitizer.io';
    _passCtrl.text = 'HabitSecure#2026';
    setState(() {
      isLogin = true;
      errorMsg = null;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Mock account credentials loaded! Tap Sign In.'),
        backgroundColor: AppTheme.bluePrimary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgPrimary,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.bgSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.wb_sunny_outlined, size: 44, color: AppTheme.bluePrimary),
                const SizedBox(height: 12),
                Text(
                  isLogin ? 'Welcome Back' : 'Start Changing Habits',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  isLogin ? 'Sign in to access your habit substitution loops' : 'Create an account to start replacing bad routines',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                if (errorMsg != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.roseSubtle,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(errorMsg!, style: const TextStyle(color: AppTheme.rosePrimary, fontSize: 13)),
                  ),
                  const SizedBox(height: 16),
                ],

                if (!isLogin) ...[
                  TextField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      hintText: 'e.g. Jordan Smith',
                      prefixIcon: Icon(Icons.person_outline, size: 20),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: Icon(Icons.email_outlined, size: 20),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _passCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock_outline, size: 20),
                  ),
                ),
                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.bluePrimary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(isLogin ? 'Sign In to Habitizer' : 'Create Account', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 16),

                TextButton(
                  onPressed: () {
                    setState(() {
                      isLogin = !isLogin;
                      errorMsg = null;
                    });
                  },
                  child: Text(
                    isLogin ? "Don't have an account? Create Account" : "Already have an account? Sign In",
                    style: const TextStyle(color: AppTheme.bluePrimary, fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),

                const Divider(height: 32),
                OutlinedButton(
                  onPressed: _loadMock,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Text('Mock Account', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.textPrimary)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
