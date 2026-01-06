import 'package:flutter/material.dart';

class AssessmentFormScreen extends StatefulWidget {
  const AssessmentFormScreen({super.key});

  @override
  State<AssessmentFormScreen> createState() => _AssessmentFormScreenState();
}

class _AssessmentFormScreenState extends State<AssessmentFormScreen> {
  final Map<int, int> _ratings = {};
  final Map<int, String> _comments = {};

  final questions = [
    {'id': 1, 'text': 'Demonstra proatividade na resolução de problemas?'},
    {'id': 2, 'text': 'Comunica-se de forma clara e eficiente?'},
    {'id': 3, 'text': 'Entrega resultados dentro dos prazos estabelecidos?'},
  ];

  void _submit() {
    if (_ratings.length < questions.length) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Por favor, responda todas as perguntas.')));
      return;
    }
    // Call API
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Avaliação enviada!')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Avaliação de Desempenho')),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: questions.length + 1,
        itemBuilder: (context, index) {
          if (index == questions.length) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                child: const Text('Enviar Avaliação'),
              ),
            );
          }

          final q = questions[index];
          final qId = q['id'] as int;

          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(q['text'] as String, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  const Text('Classificação:', style: TextStyle(color: Colors.grey)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: List.generate(5, (i) {
                      final rating = i + 1;
                      return IconButton(
                        icon: Icon(
                          Icons.star,
                          color: (_ratings[qId] ?? 0) >= rating ? Colors.amber : Colors.grey.shade300,
                        ),
                        onPressed: () => setState(() => _ratings[qId] = rating),
                      );
                    }),
                  ),
                  const SizedBox(height: 12),
                  const Text('Comentário (Opcional):', style: TextStyle(color: Colors.grey)),
                  TextField(
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    maxLines: 2,
                    onChanged: (v) => _comments[qId] = v,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
