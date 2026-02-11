import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { PageTitle } from 'src/layout/core';
import { Button, Table, Spinner, Modal, Form } from 'react-bootstrap';
import { Nr1RiskTypesService, Nr1RiskType } from '../../services/nr1-risk-types.service';
import { KTSVG } from 'src/helpers';
import { Content } from 'src/layout/components/Content';

export default function RiskTypesPage() {
    const intl = useIntl();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Nr1RiskType[]>([]);

    // Edit/Create state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Nr1RiskType>>({});
    const [saving, setSaving] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const data = await Nr1RiskTypesService.getAll();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingItem.id) {
                await Nr1RiskTypesService.update(editingItem.id, editingItem);
            } else {
                await Nr1RiskTypesService.create(editingItem);
            }
            setShowModal(false);
            fetchItems();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await Nr1RiskTypesService.delete(id);
            fetchItems();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir');
        }
    };

    return (
        <Content>
            <PageTitle>Tipos de Risco (Inventário)</PageTitle>
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        {/* Search could go here */}
                    </div>
                    <div className="card-toolbar">
                        <Button variant="primary" onClick={() => { setEditingItem({}); setShowModal(true); }}>
                            <KTSVG path="/media/icons/duotune/arrows/arr075.svg" className="svg-icon-2" />
                            Novo Tipo
                        </Button>
                    </div>
                </div>
                <div className="card-body py-4">
                    {loading ? <div className="d-flex justify-content-center"><Spinner animation="border" /></div> : (
                        <Table responsive className="align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bolder fs-7 text-uppercase gs-0">
                                    <th>Nome</th>
                                    <th>Descrição</th>
                                    <th>Cor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {item.color && <span className="w-15px h-15px rounded-circle me-3" style={{ backgroundColor: item.color }}></span>}
                                                <span className="fw-bold text-gray-800">{item.name}</span>
                                            </div>
                                        </td>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.color || '-'}</td>
                                        <td>
                                            <Button variant="light" size="sm" className="me-2" onClick={() => { setEditingItem(item); setShowModal(true); }}>
                                                Editar
                                            </Button>
                                            <Button variant="light-danger" size="sm" onClick={() => handleDelete(item.id)}>
                                                Excluir
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && <tr><td colSpan={4} className="text-center">Nenhum registro encontrado</td></tr>}
                            </tbody>
                        </Table>
                    )}
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem.id ? 'Editar Tipo de Risco' : 'Novo Tipo de Risco'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nome</Form.Label>
                            <Form.Control
                                type="text"
                                value={editingItem.name || ''}
                                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descrição</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={editingItem.description || ''}
                                onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Cor (Hex)</Form.Label>
                            <Form.Control
                                type="color"
                                value={editingItem.color || '#000000'}
                                onChange={e => setEditingItem({ ...editingItem, color: e.target.value })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Content>
    );
}
