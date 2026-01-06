import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { Nr1RisksApi, Nr1ActionPlansApi } from '../services/api';
import { useAuth } from '../../auth/core/Auth';

interface Props {
    show: boolean;
    onHide: () => void;
    riskId: string | null;
    onSaved: () => void;
}

const INITIAL_RISK = {
    processo: '',
    ambiente: '',
    atividade: '',
    perigo: '',
    fonte_circunstancia: '',
    possiveis_lesoes: '',
    probabilidade: 0,
    severidade: 0,
    medidas_prevencao: [] // TODO: structured
};

export default function RiskFormModal({ show, onHide, riskId, onSaved }: Props) {
    const { currentUser } = useAuth();
    const companyId = currentUser?.companyId;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<any>(INITIAL_RISK);
    const [actions, setActions] = useState<any[]>([]);
    const [key, setKey] = useState('context');

    useEffect(() => {
        if (!show) {
            setData(INITIAL_RISK);
            setKey('context');
            return;
        }
        if (riskId) {
            loadRisk(riskId);
            loadActions(riskId);
        } else {
            setData(INITIAL_RISK);
        }
    }, [show, riskId]);

    const loadRisk = async (id: string) => {
        setLoading(true);
        try {
            const risk = await Nr1RisksApi.get(id);
            setData(risk);
        } catch (e) {
            console.error(e);
            alert('Erro ao carregar risco');
            onHide();
        } finally {
            setLoading(false);
        }
    };

    const loadActions = async (id: string) => {
        try {
            const list = await Nr1ActionPlansApi.list(companyId || '', { risk_record_id: id });
            setActions(list);
        } catch (e) {
            console.error(e);
        }
    };

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!companyId) return;
        setSaving(true);
        try {
            // Calc dynamic classification
            const prob = Number(data.probabilidade) || 1;
            const sev = Number(data.severidade) || 1;
            const score = prob * sev;
            let level = 'b';
            if (score > 5) level = 'm';
            if (score > 10) level = 'a';
            if (score > 16) level = 'ma';

            const payload = {
                ...data,
                company_id: companyId,
                probabilidade: prob,
                severidade: sev,
                classificacao_risco: level,
                // Ensure required defaults
                // grupos_expostos, medidas_prevencao...
            };

            if (riskId) {
                await Nr1RisksApi.update(riskId, payload);
            } else {
                await Nr1RisksApi.create(payload);
            }
            onSaved();
            onHide();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar risco');
        } finally {
            setSaving(false);
        }
    };

    const getRiskLevel = () => {
        const p = Number(data.probabilidade) || 0;
        const s = Number(data.severidade) || 0;
        const score = p * s;
        if (score === 0) return '-';
        if (score <= 5) return 'Baixo';
        if (score <= 10) return 'Médio';
        if (score <= 15) return 'Alto';
        return 'Muito Alto';
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{riskId ? 'Editar Risco' : 'Identificar Novo Risco (GRO)'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? <div className="text-center p-5">Carregando...</div> : (
                    <Tabs activeKey={key} onSelect={(k) => setKey(k || 'context')} className="mb-4">
                        <Tab eventKey="context" title="1. Contexto">
                            <Form>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Processo</Form.Label>
                                            <Form.Control
                                                value={data.processo}
                                                onChange={e => handleChange('processo', e.target.value)}
                                                placeholder="Ex: Manutenção, Produção..."
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Ambiente</Form.Label>
                                            <Form.Control
                                                value={data.ambiente}
                                                onChange={e => handleChange('ambiente', e.target.value)}
                                                placeholder="Ex: Galpão A, Oficina..."
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-3">
                                    <Form.Label>Atividade</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2}
                                        value={data.atividade}
                                        onChange={e => handleChange('atividade', e.target.value)}
                                        placeholder="Descreva a atividade realizada..."
                                    />
                                </Form.Group>
                            </Form>
                        </Tab>
                        <Tab eventKey="id" title="2. Identificação">
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Perigo / Fator de Risco</Form.Label>
                                    <Form.Control
                                        value={data.perigo}
                                        onChange={e => handleChange('perigo', e.target.value)}
                                        placeholder="Ex: Ruído contínuo, Trabalho em altura..."
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Fonte ou Circunstância</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2}
                                        value={data.fonte_circunstancia}
                                        onChange={e => handleChange('fonte_circunstancia', e.target.value)}
                                        placeholder="Ex: Compressor de ar, Falta de guarda-corpo..."
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Possíveis Lesões ou Agravos</Form.Label>
                                    <Form.Control
                                        as="textarea" rows={2}
                                        value={data.possiveis_lesoes}
                                        onChange={e => handleChange('possiveis_lesoes', e.target.value)}
                                        placeholder="Ex: Perda auditiva, Fraturas, Morte..."
                                    />
                                </Form.Group>
                            </Form>
                        </Tab>
                        <Tab eventKey="analysis" title="3. Análise & Avaliação">
                            <Row className="mb-4">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Probabilidade (1-5)</Form.Label>
                                        <Form.Select
                                            value={data.probabilidade}
                                            onChange={e => handleChange('probabilidade', Number(e.target.value))}
                                        >
                                            <option value="0">Selecione...</option>
                                            <option value="1">1 - Rara</option>
                                            <option value="2">2 - Remota</option>
                                            <option value="3">3 - Possível</option>
                                            <option value="4">4 - Provável</option>
                                            <option value="5">5 - Frequente</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Severidade (1-5)</Form.Label>
                                        <Form.Select
                                            value={data.severidade}
                                            onChange={e => handleChange('severidade', Number(e.target.value))}
                                        >
                                            <option value="0">Selecione...</option>
                                            <option value="1">1 - Leve</option>
                                            <option value="2">2 - Moderada</option>
                                            <option value="3">3 - Grave</option>
                                            <option value="4">4 - Muito Grave</option>
                                            <option value="5">5 - Fatal / Catastrófica</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                            <div className="alert alert-secondary text-center">
                                <h5>Nível de Risco Estimado: <strong>{getRiskLevel()}</strong></h5>
                                <small>Baseado na matriz 5x5 (P x S)</small>
                            </div>
                        </Tab>
                        <Tab eventKey="actions" title="4. Planos de Ação" disabled={!riskId}>
                            <div className="alert alert-info">
                                <small>Salve o risco primeiro para adicionar ações.</small>
                            </div>
                            {actions.length === 0 ? (
                                <div className="text-center text-muted p-4 border rounded bg-light mb-3">
                                    Nenhuma ação vinculada a este risco.
                                </div>
                            ) : (
                                <Table size="sm" striped hover>
                                    <thead>
                                        <tr>
                                            <th>Descrição</th>
                                            <th>Responsável</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actions.map(a => (
                                            <tr key={a.id}>
                                                <td>{a.description}</td>
                                                <td>{a.responsible_id || '-'}</td>
                                                <td><Badge>{a.status}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                            {/* Simple add action stub */}
                            <div className="d-grid">
                                <Button size="sm" variant="outline-primary" onClick={() => alert('Feature: Abrir modal de criação de ação vinculado a este risco ID')}>
                                    <i className="bi bi-plus" /> Adicionar Ação
                                </Button>
                            </div>
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="light" onClick={onHide} disabled={saving}>Cancelar</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                    {saving ? 'Salvando...' : 'Salvar Risco'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
