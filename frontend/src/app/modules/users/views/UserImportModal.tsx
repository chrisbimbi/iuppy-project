import React, { useState } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import { importUsers } from '../services/usersService'

interface Props {
    show: boolean
    handleClose: () => void
}

export function UserImportModal({ show, handleClose }: Props) {
    const [file, setFile] = useState<File | null>(null)
    const [syncKey, setSyncKey] = useState('email')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!file) return
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await importUsers(file, syncKey)
            setResult(res)
        } catch (err: any) {
            setError(err.message || 'Erro ao importar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Importar Usuários</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {result && (
                    <Alert variant="success">
                        Importação concluída! <br />
                        Total: {result.total} <br />
                        Criados: {result.created} <br />
                        Atualizados: {result.updated} <br />
                        Erros: {result.errors.length}
                    </Alert>
                )}

                {!result && (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Arquivo (CSV ou XLSX)</Form.Label>
                            <Form.Control
                                type="file"
                                accept=".csv, .xlsx"
                                onChange={(e: any) => setFile(e.target.files?.[0] || null)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Chave de Sincronização (Coluna Única)</Form.Label>
                            <Form.Select
                                value={syncKey}
                                onChange={(e) => setSyncKey(e.target.value)}
                            >
                                <option value="email">Email</option>
                                <option value="cpf">CPF</option>
                                <option value="matricula">Matrícula</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Esta coluna será usada para identificar se o usuário já existe (update) ou é novo (create).
                            </Form.Text>
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Fechar
                </Button>
                {!result && (
                    <Button variant="primary" onClick={handleSubmit} disabled={!file || loading}>
                        {loading ? 'Importando...' : 'Importar'}
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    )
}
