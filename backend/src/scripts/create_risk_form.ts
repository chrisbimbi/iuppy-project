
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { FormsService } from '../modules/forms/forms.service';
import { CreateFormDto } from '../modules/forms/dto/create-form.dto';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const formsService = app.get(FormsService);
    const dataSource = app.get(DataSource);

    // Hardcoded company ID from user logs: 2af4557f-9259-4eed-818d-1d0ffe0b8982
    const companyId = '2af4557f-9259-4eed-818d-1d0ffe0b8982';
    // We need a user ID for "createdBy". I'll query one or use a system ID if possible. 
    // Let's try to find a user.
    const user = await dataSource.query(`SELECT id FROM "user_entity" WHERE "companyId" = '${companyId}' LIMIT 1`);
    const userId = user[0]?.id;

    if (!userId) {
        console.error('No user found for company');
        process.exit(1);
    }

    // Check if form already exists
    const existing = await dataSource.query(`SELECT id FROM form WHERE "companyId" = '${companyId}' AND template = 'nr1_risk_reporting'`);
    if (existing.length > 0) {
        console.log('Form already exists:', existing[0].id);
        await app.close();
        process.exit(0);
    }

    console.log('Creating NR1 Risk Reporting Form...');

    // Fix: Use plain object and bypass type check for script speed if DTO is interface 
    const dto: any = {
        companyId,
        title: { 'pt-BR': 'Sincronizar com Inventário (GRO)' },
        description: { 'pt-BR': 'Cria automaticamente um Risco no Inventário ao ser enviado.' },
        template: 'nr1_risk_reporting',
        status: 'published',
        visibility: 'public',
        fields: [
            { type: 'text', label: { 'pt-BR': 'Processo' }, required: true, order: 0, id: 'field_processo' },
            { type: 'text', label: { 'pt-BR': 'Ambiente' }, required: true, order: 1, id: 'field_ambiente' },
            { type: 'text', label: { 'pt-BR': 'Perigo' }, required: true, order: 2, id: 'field_perigo' },
            { type: 'select', label: { 'pt-BR': 'Probabilidade (1-5)' }, required: true, options: { items: ['1', '2', '3', '4', '5'] }, order: 3, id: 'field_prob' },
            { type: 'select', label: { 'pt-BR': 'Severidade (1-5)' }, required: true, options: { items: ['1', '2', '3', '4', '5'] }, order: 4, id: 'field_sev' }
        ]
    };

    try {
        // Cast to any to assume 'createForm' exists regardless of strict type checking in this script context
        const form = await (formsService as any).createForm(companyId, userId, dto);
        console.log('Form created successfully:', form.id);
    } catch (e) {
        console.error('Error creating form:', e);
    }

    await app.close();
}

bootstrap();
