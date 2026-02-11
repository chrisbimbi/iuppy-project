import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Tabs, Tab } from 'react-bootstrap';
import { PageTitle } from 'src/layout/core';
import { getJourneys } from 'src/app/modules/journeys/services/journeys.service';
import { Journey } from 'src/app/modules/journeys/types';
import { Content } from 'src/layout/components/Content';
import { FormsApi } from 'src/app/modules/forms/services/api';
import { useAuth } from 'src/app/modules/auth';

export default function TrainingsPage() {
    const intl = useIntl();
    const { currentUser } = useAuth();
    const [key, setKey] = useState('catalog');
    const [trainings, setTrainings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser?.companyId) {
            loadTrainings();
        }
    }, [currentUser?.companyId]);

    const loadTrainings = async () => {
        setLoading(true);
        try {
            const companyId = currentUser?.companyId;
            if (!companyId) return;

            const [allJourneys, formsRes] = await Promise.all([
                getJourneys(),
                // @ts-ignore
                FormsApi.list({ companyId })
            ]);

            // Filter for NR-1 trainings
            const nr1Journeys = allJourneys
                .filter((j: any) => j.isNr1 === true || j.isNr1 === 'true')
                .map((j: any) => ({ ...j, type: 'JOURNEY', triggerType: 'Jornada' }));

            // Filter for NR-1 forms
            const nr1Forms = (formsRes.items || [])
                .filter((f: any) => f.isNr1 === true || f.isNr1 === 'true')
                .map((f: any) => ({
                    id: f.id,
                    title: f.title,
                    description: f.description,
                    active: f.status === 'published',
                    type: 'FORM',
                    triggerType: 'Formulário',
                    steps: f.fields || [], // Use fields as "steps" count proxy
                }));

            setTrainings([...nr1Journeys, ...nr1Forms]);
        } catch (error) {
            console.error('Failed to load trainings', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Content>
            <PageTitle>Treinamentos & Capacitações</PageTitle>

            <div className="card">
                <div className="card-header card-header-stretch overflow-auto">
                    <Tabs
                        id="nr1-trainings-tabs"
                        activeKey={key}
                        onSelect={(k) => setKey(k || 'catalog')}
                        className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bolder flex-nowrap"
                    >
                        <Tab eventKey="catalog" title="Catálogo">
                            <div className="p-6">
                                <div className="d-flex justify-content-between mb-5">
                                    <h3>Catálogo de Treinamentos</h3  >
                                    <Link to="/journeys/builder" className="btn btn-sm btn-primary">
                                        <i className="bi bi-plus-lg me-1"></i> Novo Treinamento
                                    </Link>
                                </div>

                                {loading ? (
                                    <div className="text-center p-10">
                                        <span className="spinner-border spinner-border-sm align-middle"></span>
                                    </div>
                                ) : trainings.length === 0 ? (
                                    <div className="text-center text-muted p-10">
                                        <i className="bi bi-film fs-1 mb-3"></i>
                                        <div>Nenhum treinamento cadastrado.</div>
                                        <div className="fs-7 mt-2">
                                            Comece criando uma jornada e marcando-a como "Treinamento NR-1"
                                        </div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                            <thead>
                                                <tr className="fw-bold text-muted">
                                                    <th className="min-w-200px">Título</th>
                                                    <th className="min-w-100px">Tipo</th>
                                                    <th className="min-w-100px text-center">Etapas</th>
                                                    <th className="min-w-100px">Status</th>
                                                    <th className="min-w-100px text-end">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trainings.map((training) => (
                                                    <tr key={training.id}>
                                                        <td>
                                                            <Link
                                                                to={training.type === 'FORM' ? `/forms/edit/${training.id}` : `/journeys/builder/${training.id}`}
                                                                className="text-dark fw-bold text-hover-primary fs-6"
                                                            >
                                                                {training.title}
                                                            </Link>
                                                            {training.description && (
                                                                <div className="text-muted fs-7 mt-1">{training.description}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-light">
                                                                {training.triggerType}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge badge-light-primary">
                                                                {training.steps?.length || 0} {training.type === 'FORM' ? 'perguntas' : 'etapas'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge badge-light-${training.active ? 'success' : 'danger'}`}>
                                                                {training.active ? 'Ativo' : 'Inativo'}
                                                            </span>
                                                        </td>
                                                        <td className="text-end">
                                                            <Link
                                                                to={training.type === 'FORM' ? `/forms/edit/${training.id}` : `/journeys/builder/${training.id}`}
                                                                className="btn btn-sm btn-light-primary me-2"
                                                            >
                                                                <i className="bi bi-pencil"></i> Editar
                                                            </Link>
                                                            <Link
                                                                to={training.type === 'FORM' ? `/forms/${training.id}/stats` : `/journeys/${training.id}/analytics`}
                                                                className="btn btn-sm btn-light-info"
                                                            >
                                                                <i className="bi bi-graph-up"></i> Analytics
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Tab>
                        <Tab eventKey="sessions" title="Sessões & Turmas">
                            <div className="p-6">
                                <div className="d-flex justify-content-between mb-5">
                                    <h3>Sessões Ativas</h3>
                                    <button className="btn btn-sm btn-primary">Nova Turma</button>
                                </div>
                                <div className="text-center text-muted p-10">
                                    <i className="bi bi-people fs-1 mb-3"></i>
                                    <div>Nenhuma turma ativa.</div>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="certs" title="Certificados">
                            <div className="p-6 text-center text-muted">
                                <i className="bi bi-award fs-1 mb-3 d-block"></i>
                                <div>Certificados emitidos aparecerão aqui.</div>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </Content>
    );
}

