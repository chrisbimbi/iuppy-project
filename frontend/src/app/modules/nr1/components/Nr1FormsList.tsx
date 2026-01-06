import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button, Table, Badge, Dropdown } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useAuth } from '../../auth/core/Auth';
import { FormsApi } from '../../forms/services/api';

const Kebab: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Dropdown>
        <Dropdown.Toggle variant="light" size="sm" className="btn-active-light-primary no-caret">
            <i className="bi bi-three-dots-vertical"></i>
        </Dropdown.Toggle>
        <Dropdown.Menu align="end">{children}</Dropdown.Menu>
    </Dropdown>
);

interface Props {
    template: string;
}

import FormTemplatesModal from './FormTemplatesModal';

export default function Nr1FormsList({ template }: Props) {
    const nav = useNavigate();
    const intl = useIntl();
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    const load = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await FormsApi.list({ companyId, template });
            setRows(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [companyId, template]);

    const getTitle = (title: any) => {
        return title?.[intl.locale] || title?.['pt-BR'] || 'Sem título';
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            <FormTemplatesModal
                show={showModal}
                onHide={() => setShowModal(false)}
                companyId={companyId || ''}
                onCreated={(id) => {
                    nav(`/forms/${id}/edit`);
                }}
            />
            <div className="d-flex justify-content-between mb-4">
                <h4>Formulários Ativos</h4>
                <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg"></i> Novo
                </Button>
            </div>

            {rows.length === 0 ? (
                <div className="alert alert-info">Nenhum formulário encontrado para este modelo.</div>
            ) : (
                <div className="table-responsive">
                    <Table className="align-middle table-row-dashed gs-0 gy-4">
                        <thead>
                            <tr className="fw-bolder text-muted bg-light">
                                <th className="ps-4 min-w-200px rounded-start">Título</th>
                                <th className="min-w-100px">Status</th>
                                <th className="min-w-100px">Respostas</th>
                                <th className="min-w-100px text-end rounded-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(r => (
                                <tr key={r.id}>
                                    <td className="ps-4">
                                        <div className="d-flex align-items-center">
                                            <div className="d-flex flex-column">
                                                <span className="text-dark fw-bolder text-hover-primary mb-1 fs-6">
                                                    {getTitle(r.title)}
                                                </span>
                                                <span className="text-muted fw-bold text-muted d-block fs-7">
                                                    {r.template || 'Sem modelo'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge bg={r.status === 'published' ? 'success' : 'secondary'}>
                                            {r.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <span className="fw-bolder text-dark d-block fs-6">{r.submissionsCount || 0}</span>
                                    </td>
                                    <td className="text-end">
                                        <Kebab>
                                            <Dropdown.Item onClick={() => nav(`/forms/${r.id}/submissions`)}>
                                                Ver Respostas
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => nav(`/forms/${r.id}/edit`)}>
                                                Editar
                                            </Dropdown.Item>
                                        </Kebab>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    );
}
