import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Tabs, Tab } from 'react-bootstrap';
import { PageTitle } from 'src/layout/core';

export default function TrainingsPage() {
    const intl = useIntl();
    const [key, setKey] = useState('catalog');

    return (
        <>
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
                                    <h3>Catálogo de Treinamentos</h3>
                                    <button className="btn btn-sm btn-primary">Novo Treinamento</button>
                                </div>
                                <div className="text-center text-muted p-10">
                                    <i className="bi bi-film fs-1 mb-3"></i>
                                    <div>Nenhum treinamento cadastrado.</div>
                                </div>
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
                                <div>Certificados emitidos aparecerão aqui.</div>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
