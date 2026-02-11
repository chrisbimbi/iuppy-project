import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Score Rules
const SCORE_RULES = {
    role: {
        'Diretor de RH': 50,
        'Gerente de RH': 30,
        'CEO / Fundador': 40,
        'Analista / Business Partner': 10,
        'Outro': 5
    },
    employees: {
        'Mais de 2.000': 40,
        '500 - 2.000': 30,
        '100 - 500': 20,
        'Menos de 100': 10
    }
};

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, role, employees, painPoint } = body;

        // 1. Calculate Score
        let score = 0;
        score += SCORE_RULES.role[role as keyof typeof SCORE_RULES.role] || 10;
        score += SCORE_RULES.employees[employees as keyof typeof SCORE_RULES.employees] || 10;

        // Bonus for specific pain points
        if (painPoint.includes('Processos') || painPoint.includes('NR-1')) {
            score += 20;
        }

        const leadData = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            name,
            email,
            role,
            employees,
            painPoint,
            leadScore: score,
            status: 'pending' // pending, contacted, closed
        };

        // 2. Save to Local JSON (Simulating DB)
        const filePath = path.join(process.cwd(), 'data', 'leads.json');
        let leads = [];

        try {
            const fileData = await fs.readFile(filePath, 'utf8');
            leads = JSON.parse(fileData);
        } catch (error) {
            // File doesn't exist or is empty, start fresh
        }

        leads.push(leadData);
        await fs.writeFile(filePath, JSON.stringify(leads, null, 2));

        // 3. Simulate Sending Email (Log to Console)
        console.log("---------------------------------------------------");
        console.log("🔔 NEW LEAD RECEIVED - EMAIL SIMULATION");
        console.log(`To: christiano@iuppy.com.br`);
        console.log(`Subject: Novo Lead Qualificado: ${name} (Score: ${score})`);
        console.log(`Body:
      Nome: ${name}
      Cargo: ${role}
      Empresa: ${employees} funcionários
      Dor Principal: ${painPoint}
      
      >> LEAD SCORE: ${score} / 100
      >> AÇÃO RECOMENDADA: ${score > 60 ? 'LIGAR AGORA' : 'Enviar E-mail de Nutrição'}
    `);
        console.log("---------------------------------------------------");

        /* 
           TODO: To send REAL emails, install 'resend' SDK:
           npm install resend
           
           const resend = new Resend(process.env.RESEND_API_KEY);
           await resend.emails.send({ ... });
        */

        return NextResponse.json({ success: true, score });

    } catch (error) {
        console.error('Lead processing error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process lead' }, { status: 500 });
    }
}
