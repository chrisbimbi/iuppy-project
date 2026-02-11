import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { Tabs, Tab, Spinner } from 'react-bootstrap';
import { PageTitle } from 'src/layout/core';
import axios from 'axios';
import { Content } from 'src/layout/components/Content';

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:4000';

interface Drill {
    id: string;
    data_agendada: string;
    local: string;
    relatorio?: string;
    procedure_id: string;
}

interface Procedure {
    id: string;
    titulo: string;
    descricao: string;
}

export default function EmergencyPage() {
    const intl = useIntl();
    const [key, setKey] = useState('procedures');
    const [loadingDrills, setLoadingDrills] = useState(false);
    const [drills, setDrills] = useState<Drill[]>([]);
    const [procedures, setProcedures] = useState<Procedure[]>([]);

    useEffect(() => {
        if (key === 'drills') fetchDrills();
        if (key === 'procedures') fetchProcedures();
    }, [key]);

    const fetchDrills = async () => {
        setLoadingDrills(true);
        try {
            const res = await axios.get(`${API_URL}/nr1/drills`);
            setDrills(res.data || []);
        } catch (e) {
            console.error('Error fetching drills:', e);
        } finally {
            setLoadingDrills(false);
        }
    };

    const fetchProcedures = async () => {
        try {
            const res = await axios.get(`${API_URL}/nr1/procedures`);
            setProcedures(res.data || []);
        } catch (e) {
            console.error('Error fetching procedures:', e);
        }
    };

    const handleCreateDrill = () => {
        const date = prompt('Data do simulado (YYYY-MM-DD):');
        const local = prompt('Local do simulado:');
        if (!date || !local) return;

        axios.post(`${API_URL}/nr1/drills`, {
            data_agendada: date,
            local,
            procedure_id: null, // Can be extended to select from procedures
        }).then(() => {
            alert('Simulado agendado com sucesso!');
            fetchDrills();
        }).catch(e => {
            alert('Erro ao agendar simulado: ' + e.message);
        });
    };

    const handleDeleteDrill = (id: string) => {
        if (!confirm('Deseja realmente excluir este simulado?')) return;
        axios.delete(`${API_URL}/nr1/drills/${id}`)
            .then(() => {
                alert('Simulado excluído!');
                fetchDrills();
            })
            .catch(e => alert('Erro ao excluir: ' + e.message));
    };

    return (
        <Content>
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
                                {procedures.length === 0 ? (
                                    <div className="text-center text-muted p-10">
                                        <i className="bi bi-file-earmark-pdf fs-1 mb-3"></i>
                                        <div>Nenhum procedimento cadastrado.</div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Título</th>
                                                    <th>Descrição</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {procedures.map(p => (
                                                    <tr key={p.id}>
                                                        <td>{p.titulo}</td>
                                                        <td>{p.descricao}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Tab>
                        <Tab eventKey="drills" title="Simulados">
                            <div className="p-6">
                                <div className="d-flex justify-content-between mb-5">
                                    <h3>Calendário de Simulados</h3>
                                    <button className="btn btn-sm btn-primary" onClick={handleCreateDrill}>
                                        Agendar Simulado
                                    </button>
                                </div>
                                {loadingDrills ? (
                                    <div className="text-center p-10">
                                        <Spinner animation="border" />
                                    </div>
                                ) : drills.length === 0 ? (
                                    <div className="text-center text-muted p-10">
                                        <i className="bi bi-calendar-event fs-1 mb-3"></i>
                                        <div>Nenhum simulado agendado.</div>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-row-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Data</th>
                                                    <th>Local</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {drills.map(drill => (
                                                    <tr key={drill.id}>
                                                        <td>{new Date(drill.data_agendada).toLocaleDateString()}</td>
                                                        <td>{drill.local}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDeleteDrill(drill.id)}
                                                            >
                                                                Excluir
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
        </Content>
    );
}
