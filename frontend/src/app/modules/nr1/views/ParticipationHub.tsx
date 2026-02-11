import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Tabs, Tab } from 'react-bootstrap';
import { PageTitle } from 'src/layout/core';
import Nr1FormsList from '../components/Nr1FormsList';
import ParticipationInbox from '../components/ParticipationInbox';
import { Content } from 'src/layout/components/Content';

export default function Nr1ParticipationHub() {
    const intl = useIntl();
    const [key, setKey] = useState('forms');

    return (
        <Content>
            <PageTitle>Participação e Consultas</PageTitle>

            <div className="card">
                <div className="card-header card-header-stretch overflow-auto">
                    <Tabs
                        id="nr1-participation-tabs"
                        activeKey={key}
                        onSelect={(k) => setKey(k || 'forms')}
                        className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bolder flex-nowrap"
                    >
                        <Tab eventKey="forms" title="Formulários NR-1">
                            <div className="p-6">
                                {/* Forms specific to NR-1 (Near Miss, Perception, etc) */}
                                <Nr1FormsList />
                            </div>
                        </Tab>
                        <Tab eventKey="inbox" title="Caixa de Entrada (CIPA)">
                            <div className="p-6">
                                <ParticipationInbox />
                            </div>
                        </Tab>
                        <Tab eventKey="surveys" title="Enquetes (Pulse)">
                            {/* Embed Surveys Module or Link to it */}
                            <div className="p-6 text-center text-muted">
                                <p>Gerenciamento de Enquetes Pulse será integrado aqui.</p>
                                <a href="/modules/surveys" className="btn btn-sm btn-light-primary">Ir para Módulo de Enquetes</a>
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </Content>
    );
}
