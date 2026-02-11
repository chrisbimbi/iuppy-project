import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { FormsApi } from '../../forms/services/api';

interface Props {
    show: boolean;
    onHide: () => void;
    onCreated: (formId: string) => void;
    companyId: string;
}

const TEMPLATES = [
    {
        id: 'nr1_perception',
        title: 'Percepção de Riscos',
        description: 'Coleta a percepção dos colaboradores sobre riscos no ambiente de trabalho.',
        icon: 'bi-eye'
    },
    {
        id: 'nr1_near_miss',
        title: 'Relato de Quase-Acidente',
        description: 'Formulário para reporte ágil de incidentes e condições inseguras.',
        icon: 'bi-exclamation-triangle'
    },
    {
        id: 'nr1_science',
        title: 'Direito de Recusa',
        description: 'Registro formal de recusa ao trabalho por risco grave e iminente.',
        icon: 'bi-shield-x'
    },
    {
        id: 'nr1_risk_reporting',
        title: 'Sincronizar com Inventário (GRO)',
        description: 'Cria automaticamente um Risco no Inventário ao ser enviado.',
        icon: 'bi-arrow-repeat'
    }
];

export default function FormTemplatesModal({ show, onHide, onCreated, companyId }: Props) {
    const intl = useIntl();
    const [creating, setCreating] = useState<string | null>(null);

    const handleCreate = async (templateId: string) => {
        setCreating(templateId);
        try {
            const template = TEMPLATES.find(t => t.id === templateId);
            if (!template) return;

            // Define default fields based on template
            let fields: any[] = [];
            if (templateId === 'nr1_perception') {
                fields = [
                    { type: 'text', label: { 'pt-BR': 'Qual o local/setor?' }, required: true, order: 0 },
                    { type: 'textarea', label: { 'pt-BR': 'Descreva o risco percebido' }, required: true, order: 1 },
                    { type: 'select', label: { 'pt-BR': 'Nível de risco' }, required: true, options: { items: ['Baixo', 'Médio', 'Alto'] }, order: 2 }
                ];
            } else if (templateId === 'nr1_near_miss') {
                fields = [
                    { type: 'datetime', label: { 'pt-BR': 'Data e Hora' }, required: true, order: 0 },
                    { type: 'text', label: { 'pt-BR': 'Local exato' }, required: true, order: 1 },
                    { type: 'textarea', label: { 'pt-BR': 'O que aconteceu? (Descrição)' }, required: true, order: 2 },
                    { type: 'file', label: { 'pt-BR': 'Foto da ocorrência' }, required: false, order: 3 }
                ];
            } else if (templateId === 'nr1_risk_reporting') {
                fields = [
                    { type: 'text', label: { 'pt-BR': 'Processo' }, required: true, order: 0 },
                    { type: 'text', label: { 'pt-BR': 'Ambiente' }, required: true, order: 1 },
                    { type: 'text', label: { 'pt-BR': 'Perigo' }, required: true, order: 2 },
                    { type: 'select', label: { 'pt-BR': 'Probabilidade (1-5)' }, required: true, options: { items: ['1', '2', '3', '4', '5'] }, order: 3 },
                    { type: 'select', label: { 'pt-BR': 'Severidade (1-5)' }, required: true, options: { items: ['1', '2', '3', '4', '5'] }, order: 4 }
                ];
            }

            const newForm = await FormsApi.create({
                companyId,
                title: { 'pt-BR': template.title },
                description: { 'pt-BR': template.description },
                fields,
                template: templateId, // This field must be supported by API now
                status: 'draft',
                visibility: 'public' // Default to public for participation
            } as any); // cast as any because api.ts types might not be fully updated in IDE yet

            onCreated(newForm.id);
            onHide();
        } catch (e) {
            console.error(e);
            alert('Erro ao criar formulário');
        } finally {
            setCreating(null);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Novo Formulário NR-1</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    {TEMPLATES.map(t => (
                        <Col md={4} key={t.id} className="mb-4">
                            <Card className="h-100 cursor-pointer border-hover-primary" onClick={() => handleCreate(t.id)}>
                                <Card.Body className="text-center">
                                    <i className={`bi ${t.icon} fs-3x text-primary mb-3`}></i>
                                    <h5 className="fw-bold">{t.title}</h5>
                                    <p className="text-muted small">{t.description}</p>
                                    {creating === t.id ? <span className="spinner-border spinner-border-sm" /> : <Button variant="light-primary" size="sm">Usar Modelo</Button>}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Modal.Body>
        </Modal>
    );
}
