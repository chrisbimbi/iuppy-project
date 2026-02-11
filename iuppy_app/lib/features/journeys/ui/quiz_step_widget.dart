import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../journey_providers.dart';
import 'package:iuppy_app/features/gamification/ui/xp_award_dialog.dart';

class QuizStepWidget extends ConsumerStatefulWidget {
  final Map<String, dynamic> quizConfig;
  final String journeyId;
  final String stepId;
  final bool isReadOnly;

  const QuizStepWidget({
    super.key,
    required this.quizConfig,
    required this.journeyId,
    required this.stepId,
    this.isReadOnly = false,
  });

  @override
  ConsumerState<QuizStepWidget> createState() => _QuizStepWidgetState();
}

class _QuizStepWidgetState extends ConsumerState<QuizStepWidget> {
  final Map<String, List<String>> _selectedAnswers = {};
  bool _isSubmitting = false;
  Map<String, dynamic>? _result;

  List<Map<String, dynamic>> get questions =>
      List<Map<String, dynamic>>.from(widget.quizConfig['questions'] ?? []);

  int get passingScore => widget.quizConfig['passingScore'] ?? 70;

  void _handleOptionTap(
      String questionId, String optionId, String questionType) {
    if (widget.isReadOnly || _result != null) return;

    setState(() {
      if (questionType == 'SINGLE_CHOICE') {
        _selectedAnswers[questionId] = [optionId];
      } else {
        // MULTI_CHOICE
        final current = _selectedAnswers[questionId] ?? [];
        if (current.contains(optionId)) {
          current.remove(optionId);
        } else {
          current.add(optionId);
        }
        _selectedAnswers[questionId] = current;
      }
    });
  }

  bool _isAnswered(String questionId) {
    final selected = _selectedAnswers[questionId];
    return selected != null && selected.isNotEmpty;
  }

  bool get _allQuestionsAnswered {
    return questions.every((q) => _isAnswered(q['id']));
  }

  Future<void> _submitQuiz() async {
    if (!_allQuestionsAnswered) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, responda todas as perguntas')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      // Build answers payload
      final answers = _selectedAnswers.entries
          .map((e) => {
                'questionId': e.key,
                'selectedOptions': e.value,
              })
          .toList();

      final response = await ref.read(journeyServiceProvider).completeStep(
        widget.journeyId,
        widget.stepId,
        data: {'answers': answers},
      );

      if (mounted) {
        setState(() {
          _result = response;
          _isSubmitting = false;
        });

        // Check if passed
        final passed = response['quizPassed'] == true;
        final score = response['quizScore'] ?? 0;

        if (passed) {
          XPAwardDialog.show(context, 10);
          if (mounted) {
            context.pop();
            ref.invalidate(journeyProgressProvider);
          }
        } else {
          // Show retry option
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              title: const Text('❌ Não Aprovado'),
              content: Text(
                'Você obteve $score% de acerto.\n'
                'A nota mínima é $passingScore%.\n\n'
                'Revise o conteúdo e tente novamente.',
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _result = null;
                      _selectedAnswers.clear();
                    });
                  },
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao enviar quiz: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                colorScheme.primary,
                colorScheme.primary.withOpacity(0.7)
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.quiz, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AVALIAÇÃO',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Nota mínima: $passingScore%',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${questions.length} ${questions.length == 1 ? 'Pergunta' : 'Perguntas'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Questions
        ...questions.asMap().entries.map((entry) {
          final index = entry.key;
          final question = entry.value;
          final questionId = question['id'];
          final title = question['title'] ?? '';
          final type = question['type'] ?? 'SINGLE_CHOICE';
          final weight = question['weight'] ?? 1;
          final options =
              List<Map<String, dynamic>>.from(question['options'] ?? []);

          final isAnswered = _isAnswered(questionId);

          return Container(
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isAnswered
                    ? colorScheme.primary.withOpacity(0.5)
                    : colorScheme.outline.withOpacity(0.2),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isAnswered
                              ? colorScheme.primary
                              : colorScheme.outline.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${index + 1}',
                            style: TextStyle(
                              color: isAnswered
                                  ? Colors.white
                                  : colorScheme.onSurface,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: colorScheme.primaryContainer,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    type == 'SINGLE_CHOICE'
                                        ? 'Única escolha'
                                        : 'Múltipla escolha',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: colorScheme.onPrimaryContainer,
                                    ),
                                  ),
                                ),
                                if (weight > 1) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.amber.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star,
                                            size: 14, color: Colors.amber),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Peso $weight',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Colors.amber,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 8),
                  ...options.map((option) {
                    final optionId = option['id'];
                    final text = option['text'] ?? '';
                    final isSelected =
                        _selectedAnswers[questionId]?.contains(optionId) ==
                            true;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? colorScheme.primaryContainer
                            : colorScheme.surfaceVariant.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? colorScheme.primary
                              : colorScheme.outline.withOpacity(0.2),
                          width: 2,
                        ),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () =>
                              _handleOptionTap(questionId, optionId, type),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                Icon(
                                  type == 'SINGLE_CHOICE'
                                      ? (isSelected
                                          ? Icons.radio_button_checked
                                          : Icons.radio_button_unchecked)
                                      : (isSelected
                                          ? Icons.check_box
                                          : Icons.check_box_outline_blank),
                                  color: isSelected
                                      ? colorScheme.primary
                                      : colorScheme.outline,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    text,
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: colorScheme.onSurface,
                                      fontWeight: isSelected
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          );
        }),

        const SizedBox(height: 24),

        // Submit Button
        if (!widget.isReadOnly && _result == null)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  _allQuestionsAnswered && !_isSubmitting ? _submitQuiz : null,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: colorScheme.primary,
                disabledBackgroundColor: colorScheme.outline.withOpacity(0.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      'Enviar Respostas',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: _allQuestionsAnswered
                            ? Colors.white
                            : colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ),
            ),
          ),
      ],
    );
  }
}
