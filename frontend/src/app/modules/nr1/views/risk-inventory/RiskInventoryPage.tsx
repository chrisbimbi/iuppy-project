import React, { useEffect, useState } from 'react';
import { PageTitle } from 'src/layout/core';
import { useAuth } from '../../../auth/core/Auth';
import { Nr1RisksApi } from '../../services/api';
import RiskMatrix from '../../components/RiskMatrix';
import { Button, Table, Badge, Spinner, Form, InputGroup } from 'react-bootstrap';
import RiskFormModal from '../../components/RiskFormModal';

export default function RiskInventoryPage() {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;

    const [loading, setLoading] = useState(false);
    const [risks, setRisks] = useState<any[]>([]);
    const [filterCell, setFilterCell] = useState<{ p: number, s: number } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const load = async () => {
        if (!companyId) return;
        setLoading(true);
        try {
            const data = await Nr1RisksApi.list(companyId);
            setRisks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [companyId]);

    const filteredRisks = risks.filter(r => {
        // Filter by Matrix Cell
        if (filterCell) {
            const p = r.probabilidade || 0;
            const s = r.severidade || 0;
            if (p !== filterCell.p || s !== filterCell.s) return false;
        }

        // Filter by Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matches =
                (r.processo || '').toLowerCase().includes(term) ||
                (r.perigo || '').toLowerCase().includes(term) ||
                (r.ambiente || '').toLowerCase().includes(term);
            if (!matches) return false;
        }
        return true;
    });

    const getRiskLevelBadge = (level: string) => {
        switch (level) {
            case 'b': return <Badge bg="success">Baixo</Badge>;
            case 'm': return <Badge bg="primary">Médio</Badge>;
            case 'a': return <Badge bg="warning">Alto</Badge>;
            case 'ma': return <Badge bg="danger">Muito Alto</Badge>;
            default: return <Badge bg="secondary">{level}</Badge>;
        }
    };

    return (
        <>
            <PageTitle breadcrumbs={[]}>Inventário de Riscos (GRO)</PageTitle>

            <div className="row g-5 g-xl-8 mb-5 mb-xl-10">
                {/* Risk Matrix Widget */}
                <div className="col-xl-4">
                    <RiskMatrix
                        risks={risks}
                        onCellClick={(p, s) => setFilterCell((prev) => (prev?.p === p && prev?.s === s ? null : { p, s }))}
                        selectedCell={filterCell}
                    />
                </div>

                {/* Main Content: List */}
                <div className="col-xl-8">
                    <div className="card">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Registros de Risco</span>
                                <span className="text-muted mt-1 fw-bold fs-7">Total: {risks.length} (Filtrados: {filteredRisks.length})</span>
                            </h3>
                            <div className="card-toolbar">
                                <Button size="sm" variant="light-primary" onClick={() => { setEditingId(null); setShowModal(true); }}>
                                    <i className="bi bi-plus-lg" /> Novo Risco
                                </Button>
                            </div>
                        </div>
                        <div className="card-body py-3">
                            <InputGroup className="mb-4">
                                <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
                                <Form.Control
                                    placeholder="Buscar por processo, perigo ou ambiente..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {filterCell && (
                                    <Button variant="outline-secondary" onClick={() => setFilterCell(null)}>
                                        Limpar Filtro Matriz
                                    </Button>
                                )}
                            </InputGroup>

                            {loading ? <Spinner animation="border" /> : (
                                <div className="table-responsive">
                                    <Table className="align-middle table-row-dashed gs-0 gy-4">
                                        <thead>
                                            <tr className="fw-bolder text-muted bg-light">
                                                <th className="ps-4 rounded-start">Processo / Ambiente</th>
                                                <th>Perigo</th>
                                                <th>Nível</th>
                                                <th className="text-end rounded-end">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRisks.length === 0 ? (
                                                <tr><td colSpan={4} className="text-center text-muted py-5">Nenhum risco encontrado.</td></tr>
                                            ) : filteredRisks.map(r => (
                                                <tr key={r.id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex flex-column">
                                                            <span className="text-dark fw-bolder mb-1 fs-6">{r.processo}</span>
                                                            <span className="text-muted fw-bold fs-7">{r.ambiente}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="text-dark d-block fs-6">{r.perigo}</span>
                                                        <span className="text-muted small">{r.possiveis_lesoes}</span>
                                                    </td>
                                                    <td>
                                                        {getRiskLevelBadge(r.classificacao_risco)}
                                                    </td>
                                                    <td className="text-end">
                                                        <Button variant="icon" size="sm" className="btn-active-light-primary" onClick={() => { setEditingId(r.id); setShowModal(true); }}>
                                                            <i className="bi bi-pencil" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RiskFormModal */}
            <RiskFormModal show={showModal} onHide={() => setShowModal(false)} riskId={editingId} onSaved={load} />
        </>
    );
}
