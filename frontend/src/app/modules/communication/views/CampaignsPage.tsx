import React, { useState, useEffect } from 'react';
import { PageTitle } from 'src/layout/core';
import { useIntl } from 'react-intl';
import { Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import { useAuth } from '../../auth/core/Auth';

interface Campaign {
    id: string;
    title: string;
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    stats_sent: number;
    stats_opened: number;
    scheduled_at: string;
}

export default function CampaignsPage() {
    const intl = useIntl();
    const { auth } = useAuth();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Mock Data for MVP
    useEffect(() => {
        setCampaigns([
            { id: '1', title: 'Boas vindas', status: 'sent', stats_sent: 150, stats_opened: 120, scheduled_at: '2025-12-01' },
            { id: '2', title: 'Aviso de Manutenção', status: 'draft', stats_sent: 0, stats_opened: 0, scheduled_at: '2025-12-20' },
        ]);
    }, []);

    return (
        <>
            <PageTitle>Campanhas de Comunicação</PageTitle>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Campanhas</h3>
                    <div className="card-toolbar">
                        <Button variant="primary" onClick={() => setShowModal(true)}>
                            Nova Campanha
                        </Button>
                    </div>
                </div>
                <div className="card-body py-3">
                    <div className="table-responsive">
                        <Table className="align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bolder text-muted bg-light">
                                    <th className="ps-4 min-w-200px">Título</th>
                                    <th className="min-w-100px">Status</th>
                                    <th className="min-w-100px">Agendamento</th>
                                    <th className="min-w-100px">Enviados</th>
                                    <th className="min-w-100px">Abertura</th>
                                    <th className="min-w-100px text-end pe-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id}>
                                        <td className="ps-4">
                                            <span className="text-dark fw-bolder text-hover-primary mb-1 fs-6">
                                                {c.title}
                                            </span>
                                        </td>
                                        <td>
                                            <Badge bg={
                                                c.status === 'sent' ? 'success' :
                                                    c.status === 'draft' ? 'warning' : 'secondary'
                                            }>
                                                {c.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td>{c.scheduled_at}</td>
                                        <td>{c.stats_sent}</td>
                                        <td>
                                            {c.stats_sent > 0
                                                ? `${Math.round((c.stats_opened / c.stats_sent) * 100)}%`
                                                : '-'}
                                        </td>
                                        <td className="text-end pe-4">
                                            <Button variant="light" size="sm" className="btn-icon">
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Criar Nova Campanha</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control type="text" placeholder="Ex: Novidade Importante" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mensagem</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="Conteúdo da notificação..." />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Público Alvo</Form.Label>
                            <Form.Select>
                                <option>Todos os Usuários</option>
                                <option>Apenas Liderança</option>
                                <option>Departamento: Operações</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={() => setShowModal(false)}>Salvar Rascunho</Button>
                    <Button variant="success">Enviar Agora</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
