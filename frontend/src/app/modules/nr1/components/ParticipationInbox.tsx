import React, { useEffect, useState } from 'react';
import { Spinner, Table, Button, Badge } from 'react-bootstrap';
import { Nr1ParticipationApi } from '../services/api';
import { useAuth } from '../../auth/core/Auth';
import { useNavigate } from 'react-router-dom';

export default function ParticipationInbox() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;
    const nav = useNavigate();

    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);

    const load = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            // Fetch interactions from NR-1 forms (Near Miss, Perception, etc)
            const data = await Nr1ParticipationApi.listSubmissions(companyId, 'nr1_%');
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [companyId]);

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            {items.length === 0 ? (
                <div className="alert alert-light text-center">
                    <i className="bi bi-inbox fs-2x text-muted d-block mb-3"></i>
                    Sem manifestações pendentes.
                </div>
            ) : (
                <Table className="align-middle table-row-dashed gs-0 gy-4">
                    <thead>
                        <tr className="fw-bolder text-muted bg-light">
                            <th className="ps-4 rounded-start">Data</th>
                            <th>Formulário</th>
                            <th>Colaborador</th>
                            <th>Status</th>
                            <th className="text-end rounded-end text-nowrap">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id}>
                                <td className="ps-4">
                                    {new Date(item.submittedAt).toLocaleDateString()}
                                </td>
                                <td>
                                    <span className="fw-bold">{item.formTitle?.['pt-BR'] || 'Formulário'}</span>
                                </td>
                                <td>
                                    {/* Ideally we fetch user name, but ID for now or external email */}
                                    {item.external ? (item.externalEmail || 'Externo') : 'Interno'}
                                </td>
                                <td>
                                    <Badge bg="info">Novo</Badge>
                                </td>
                                <td className="text-end">
                                    <Button variant="light-primary" size="sm" className="me-2"
                                        onClick={() => nav(`/forms/${item.formId}/submissions/${item.id}`)}>
                                        Ver
                                    </Button>
                                    <Button variant="outline-success" size="sm"
                                        onClick={() => alert(`Converter submissão ${item.id} em Risco (Em breve)`)}>
                                        <i className="bi bi-arrow-right-circle me-1"></i>
                                        Risco
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}
