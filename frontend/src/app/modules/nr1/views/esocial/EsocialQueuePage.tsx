import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { PageTitle } from 'src/layout/core';
import { Modal, Button, Form } from 'react-bootstrap';

export default function EsocialQueuePage() {
    const intl = useIntl();
    const [processing, setProcessing] = useState(false);
    const [showGenModal, setShowGenModal] = useState(false);

    // Mock Data
    const items = [
        { id: '1', type: 'S-2240', payload: '{ "evtExpRisco": ... }', status: 'queued', retries: 0, created_at: '2025-12-13 14:00' },
        { id: '2', type: 'S-2240', payload: '{ "evtExpRisco": ... }', status: 'sent', retries: 0, created_at: '2025-12-13 13:50', receipt: 'REC-123' },
        { id: '3', type: 'S-2240', payload: '{ "evtExpRisco": ... }', status: 'failed', retries: 1, created_at: '2025-12-13 13:00', error: 'Connection Timeout' },
    ];

    const handleProcess = () => {
        setProcessing(true);
        setTimeout(() => {
            alert('Processamento concluído!');
            setProcessing(false);
        }, 2000);
    };

    return (
        <>
            <PageTitle>Fila eSocial (S-2240)</PageTitle>

            <div className="row g-5 g-xl-8 mb-5">
                <div className="col-xl-4">
                    <div className="card bg-light-primary card-xl-stretch mb-xl-8">
                        <div className="card-body my-3">
                            <span className="fw-bold fs-2 text-primary d-block lh-1 mb-2">98%</span>
                            <span className="fw-bold fs-7 text-gray-500">Cobertura Funcionários</span>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card bg-light-success card-xl-stretch mb-xl-8">
                        <div className="card-body my-3">
                            <span className="fw-bold fs-2 text-success d-block lh-1 mb-2">150</span>
                            <span className="fw-bold fs-7 text-gray-500">Eventos Enviados</span>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card bg-light-danger card-xl-stretch mb-xl-8">
                        <div className="card-body my-3">
                            <span className="fw-bold fs-2 text-danger d-block lh-1 mb-2">3</span>
                            <span className="fw-bold fs-7 text-gray-500">Erros Pendentes</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Monitoramento de Envios</h3>
                    <div className="card-toolbar">
                        <Button variant="light" className="me-3" onClick={() => setShowGenModal(true)}>
                            <i className="bi bi-plus-circle"></i> Gerar S-2240
                        </Button>
                        <Button variant="primary" onClick={handleProcess} disabled={processing}>
                            {processing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-upload me-2"></i>}
                            Processar Fila Agora
                        </Button>
                    </div>
                </div>
                <div className="card-body py-3">
                    <div className="table-responsive">
                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bolder text-muted">
                                    <th className="min-w-100px">Evento</th>
                                    <th className="min-w-150px">Data Criação</th>
                                    <th className="min-w-100px">Status</th>
                                    <th className="min-w-100px">Recibo / Erro</th>
                                    <th className="min-w-100px text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="fw-bold text-dark">{item.type}</span>
                                        </td>
                                        <td className="text-muted">{item.created_at}</td>
                                        <td>
                                            {item.status === 'queued' && <span className="badge badge-light-primary">Na Fila</span>}
                                            {item.status === 'sent' && <span className="badge badge-light-success">Enviado</span>}
                                            {item.status === 'failed' && <span className="badge badge-light-danger">Falha</span>}
                                        </td>
                                        <td className="text-muted fs-7">
                                            {item.receipt || item.error || '-'}
                                        </td>
                                        <td className="text-end">
                                            <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm">
                                                <i className="bi bi-code-slash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={showGenModal} onHide={() => setShowGenModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Gerar Evento S-2240</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Funcionário (CPF)</Form.Label>
                            <Form.Control type="text" placeholder="000.000.000-00" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Data Início Condição</Form.Label>
                            <Form.Control type="date" />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowGenModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={() => setShowGenModal(false)}>Gerar e Enfileirar</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
