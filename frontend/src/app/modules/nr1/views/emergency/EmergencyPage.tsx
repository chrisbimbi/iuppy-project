import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Tabs, Tab } from 'react-bootstrap';
import { PageTitle } from 'src/layout/core';

export default function EmergencyPage() {
    const intl = useIntl();
    const [key, setKey] = useState('procedures');

    return (
        <>
            <PageTitle>Plano de Emergência (PAE)</PageTitle>

            <div className="card">
                <div className="card-header card-header-stretch overflow-auto">
                    <Tabs
                        id="nr1-emergency-tabs"
                        activeKey={key}
                        onSelect={(k) => setKey(k || 'procedures')}
                        className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bolder flex-nowrap"
                    >
                        <Tab eventKey="procedures" title="Procedimentos">
                            <div className="p-6">
                                <div className="d-flex justify-content-between mb-5">
                                    <h3>Procedimentos de Emergência</h3>
                                    <button className="btn btn-sm btn-primary">Novo Procedimento</button>
                                </div>
                                <div className="text-center text-muted p-10">
                                    <i className="bi bi-file-earmark-pdf fs-1 mb-3"></i>
                                    <div>Nenhum procedimento cadastrado.</div>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="drills" title="Simulados">
                            <div className="p-6">
                                <div className="d-flex justify-content-between mb-5">
                                    <h3>Calendário de Simulados</h3>
                                    <button className="btn btn-sm btn-primary">Agendar Simulado</button>
                                </div>
                                <div className="text-center text-muted p-10">
                                    <i className="bi bi-calendar-event fs-1 mb-3"></i>
                                    <div>Nenhum simulado agendado.</div>
                                </div>
                            </div>
                        </Tab>
                        <Tab eventKey="reports" title="Relatórios">
                            <div className="p-6 text-center text-muted">
                                <div>Estatísticas de participação aparecerão aqui.</div>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
