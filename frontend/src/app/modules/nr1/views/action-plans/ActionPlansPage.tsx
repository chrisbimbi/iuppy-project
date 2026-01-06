import React, { useEffect, useState } from 'react';
import { PageTitle } from 'src/layout/core';
import { useAuth } from '../../../auth/core/Auth';
import { Nr1ActionPlansApi } from '../../services/api';
import { Table, Badge, Spinner, Button, Form, InputGroup } from 'react-bootstrap';

export default function ActionPlansPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;

    const [loading, setLoading] = useState(false);
    const [actions, setActions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const load = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await Nr1ActionPlansApi.list(companyId);
            setActions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [companyId]);

    const filtered = actions.filter(a =>
        (a.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.responsible_id || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge bg="warning">Pendente</Badge>;
            case 'in_progress': return <Badge bg="primary">Em Andamento</Badge>;
            case 'done': return <Badge bg="success">Concluído</Badge>;
            case 'canceled': return <Badge bg="secondary">Cancelado</Badge>;
            default: return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    const getPriorityBadge = (p: string) => {
        switch (p) {
            case 'high': return <Badge bg="danger">Alta</Badge>;
            case 'medium': return <Badge bg="warning" text="dark">Média</Badge>;
            case 'low': return <Badge bg="info">Baixa</Badge>;
            default: return null;
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Planos de Ação (5W2H)</PageTitle>

            <div className="card">
                <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold fs-3 mb-1">Ações Corretivas e Preventivas</span>
                    </h3>
                    {/* Toolbar could go here */}
                </div>
                <div className="card-body py-3">
                    <InputGroup className="mb-4">
                        <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar ação..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    {loading ? <Spinner animation="border" /> : (
                        <div className="table-responsive">
                            <Table className="align-middle table-row-dashed gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bolder text-muted bg-light">
                                        <th className="ps-4 rounded-start">Descrição (O que?)</th>
                                        <th>Responsável (Quem?)</th>
                                        <th>Prazo (Quando?)</th>
                                        <th>Status</th>
                                        <th className="text-end rounded-end">Prioridade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center text-muted py-5">Nenhuma ação encontrada.</td></tr>
                                    ) : filtered.map(a => (
                                        <tr key={a.id}>
                                            <td className="ps-4">
                                                <span className="text-dark fw-bolder d-block mb-1 fs-6">{a.description}</span>
                                                <span className="text-muted fs-7">Risco Associado: {a.risk_record_id ? 'Sim' : 'Não'}</span>
                                            </td>
                                            <td>
                                                <span className="text-dark d-block fs-6">{a.responsible_id || 'Não atribuído'}</span>
                                            </td>
                                            <td>
                                                {a.deadline ? new Date(a.deadline).toLocaleDateString() : '-'}
                                            </td>
                                            <td>{getStatusBadge(a.status)}</td>
                                            <td className="text-end pe-4">
                                                {getPriorityBadge(a.priority)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
