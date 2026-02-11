import React, { useState, useEffect } from 'react';
import { PageTitle } from 'src/layout/core';
import { Button, Spinner, Alert, Form, Row, Col, Badge } from 'react-bootstrap';
import { EsocialConfigService, EsocialConfig, UpdateEsocialConfigDto } from '../../services/esocial-config.service';
import Swal from 'sweetalert2';
import { Content } from 'src/layout/components/Content';

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function EsocialConfigPage() {
    const [config, setConfig] = useState<EsocialConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [uploadingCert, setUploadingCert] = useState(false);

    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [certificatePassword, setCertificatePassword] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState<UpdateEsocialConfigDto>({});

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await EsocialConfigService.getConfig();
            setConfig(data);
            setFormData({
                environment: data.environment,
                medicoNome: data.medicoNome || '',
                medicoCpf: data.medicoCpf || '',
                medicoCrm: data.medicoCrm || '',
                medicoUf: data.medicoUf || '',
                engenheiroNome: data.engenheiroNome || '',
                engenheiroCpf: data.engenheiroCpf || '',
                engenheiroCrea: data.engenheiroCrea || '',
                engenheiroUf: data.engenheiroUf || '',
            });
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!config) return;

        try {
            const newConfig = await EsocialConfigService.toggleEnabled(!config.enabled);
            setConfig(newConfig);
        } catch (error: any) {
            Swal.fire({
                text: error.response?.data?.message || 'Erro ao alterar status',
                icon: 'error',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-danger' }
            });
        }
    };

    const handleFieldChange = (field: keyof UpdateEsocialConfigDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setCertificateFile(e.target.files[0]);
        }
    };

    const handleUploadCertificate = async () => {
        if (!certificateFile || !certificatePassword) {
            Swal.fire({
                text: 'Selecione o certificado e informe a senha',
                icon: 'warning',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-primary' }
            });
            return;
        }

        setUploadingCert(true);
        try {
            const result = await EsocialConfigService.uploadCertificate(certificateFile, certificatePassword);

            // Update config with new certificate data
            const updatedConfig = await EsocialConfigService.getConfig();
            setConfig(updatedConfig);

            setCertificateFile(null);
            setCertificatePassword('');

            Swal.fire({
                text: result.message,
                icon: 'success',
                buttonsStyling: false,
                confirmButtonText: 'Ok!',
                customClass: { confirmButton: 'btn btn-success' }
            });
        } catch (error: any) {
            Swal.fire({
                text: error.response?.data?.message || 'Erro ao fazer upload do certificado',
                icon: 'error',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-danger' }
            });
        } finally {
            setUploadingCert(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedConfig = await EsocialConfigService.updateConfig(formData);
            setConfig(updatedConfig);

            Swal.fire({
                text: 'Configuração salva com sucesso!',
                icon: 'success',
                buttonsStyling: false,
                confirmButtonText: 'Ok!',
                customClass: { confirmButton: 'btn btn-success' }
            });
        } catch (error: any) {
            Swal.fire({
                text: error.response?.data?.message || 'Erro ao salvar configuração',
                icon: 'error',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-danger' }
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const result = await EsocialConfigService.testConnection();

            if (result.success) {
                // Update config to reflect connectionTested status
                const updatedConfig = await EsocialConfigService.getConfig();
                setConfig(updatedConfig);

                Swal.fire({
                    text: result.message,
                    icon: 'success',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok!',
                    customClass: { confirmButton: 'btn btn-success' }
                });
            } else {
                Swal.fire({
                    text: result.message,
                    icon: 'error',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok',
                    customClass: { confirmButton: 'btn btn-danger' }
                });
            }
        } catch (error: any) {
            Swal.fire({
                text: error.response?.data?.message || 'Erro ao testar conexão',
                icon: 'error',
                buttonsStyling: false,
                confirmButtonText: 'Ok',
                customClass: { confirmButton: 'btn btn-danger' }
            });
        } finally {
            setTesting(false);
        }
    };

    const isFormValid = () => {
        return !!(
            config?.certificateData &&
            formData.medicoNome &&
            formData.medicoCpf &&
            formData.medicoCrm &&
            formData.medicoUf &&
            formData.engenheiroNome &&
            formData.engenheiroCpf &&
            formData.engenheiroCrea &&
            formData.engenheiroUf
        );
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!config) {
        return <Alert variant="danger">Erro ao carregar configuração</Alert>;
    }

    return (
        <Content>
            <PageTitle>Configuração eSocial</PageTitle>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">eSocial - Condições Ambientais (S-2240)</h3>
                    <div className="card-toolbar">
                        {config.configured && config.connectionTested && (
                            <Badge bg="success" className="me-3">
                                <i className="bi bi-check-circle me-1"></i>
                                Configurado e Validado
                            </Badge>
                        )}
                        {config.configured && !config.connectionTested && (
                            <Badge bg="warning" className="me-3">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                Conexão não testada
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="card-body">
                    {/* Toggle de Habilitação */}
                    <Form.Group className="mb-6">
                        <Form.Check
                            type="switch"
                            id="enable-esocial"
                            label="Habilitar integração com eSocial"
                            checked={config.enabled}
                            onChange={handleToggle}
                            className="form-check-lg"
                        />
                        <Form.Text className="text-muted">
                            Ao habilitar, você poderá enviar eventos S-2240 diretamente para o eSocial
                        </Form.Text>
                    </Form.Group>

                    {/* Formulário (só aparece se habilitado) */}
                    {config.enabled ? (
                        <>
                            <div className="separator separator-dashed my-6"></div>

                            {/* Seção 1: Ambiente */}
                            <div className="mb-8">
                                <h4 className="mb-4">Ambiente eSocial</h4>
                                <Form.Group>
                                    <Form.Label>Selecione o Ambiente</Form.Label>
                                    <Form.Select
                                        value={formData.environment}
                                        onChange={(e) => handleFieldChange('environment', e.target.value as 'homologacao' | 'producao')}
                                    >
                                        <option value="homologacao">Homologação (Testes)</option>
                                        <option value="producao">Produção</option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                        Use "Homologação" para testes. Produção apenas quando validado.
                                    </Form.Text>
                                </Form.Group>
                            </div>

                            <div className="separator separator-dashed my-6"></div>

                            {/* Seção 2: Certificado Digital */}
                            <div className="mb-8">
                                <h4 className="mb-4">Certificado Digital</h4>
                                <Alert variant="info">
                                    <strong>Importante:</strong> O certificado deve ser e-CNPJ tipo A1 (.pfx) da empresa. Não compartilhe com terceiros.
                                </Alert>

                                {config.certificateExpiry && (
                                    <Alert variant="success" className="mb-4">
                                        <i className="bi bi-shield-check me-2"></i>
                                        Certificado válido até: {new Date(config.certificateExpiry).toLocaleDateString('pt-BR')}
                                    </Alert>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Upload de Certificado (.pfx)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept=".pfx,.p12"
                                        onChange={handleFileChange}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Senha do Certificado</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={certificatePassword}
                                        onChange={(e) => setCertificatePassword(e.target.value)}
                                        placeholder="********"
                                    />
                                    <Form.Text className="text-muted">
                                        A senha é armazenada criptografada
                                    </Form.Text>
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    onClick={handleUploadCertificate}
                                    disabled={!certificateFile || !certificatePassword || uploadingCert}
                                >
                                    {uploadingCert && <Spinner size="sm" className="me-2" />}
                                    <i className="bi bi-upload me-2"></i>
                                    Fazer Upload
                                </Button>
                            </div>

                            <div className="separator separator-dashed my-6"></div>

                            {/* Seção 3: Médico do Trabalho */}
                            <div className="mb-8">
                                <h4 className="mb-4">Médico do Trabalho</h4>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nome Completo</Form.Label>
                                            <Form.Control
                                                value={formData.medicoNome || ''}
                                                onChange={(e) => handleFieldChange('medicoNome', e.target.value)}
                                                placeholder="Dr. Nome do Médico"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>CPF</Form.Label>
                                            <Form.Control
                                                value={formData.medicoCpf || ''}
                                                onChange={(e) => handleFieldChange('medicoCpf', e.target.value)}
                                                placeholder="000.000.000-00"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>CRM</Form.Label>
                                            <Form.Control
                                                value={formData.medicoCrm || ''}
                                                onChange={(e) => handleFieldChange('medicoCrm', e.target.value)}
                                                placeholder="123456"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>UF do CRM</Form.Label>
                                            <Form.Select
                                                value={formData.medicoUf || ''}
                                                onChange={(e) => handleFieldChange('medicoUf', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            <div className="separator separator-dashed my-6"></div>

                            {/* Seção 4: Engenheiro de Segurança */}
                            <div className="mb-8">
                                <h4 className="mb-4">Engenheiro de Segurança do Trabalho</h4>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nome Completo</Form.Label>
                                            <Form.Control
                                                value={formData.engenheiroNome || ''}
                                                onChange={(e) => handleFieldChange('engenheiroNome', e.target.value)}
                                                placeholder="Eng. Nome do Engenheiro"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>CPF</Form.Label>
                                            <Form.Control
                                                value={formData.engenheiroCpf || ''}
                                                onChange={(e) => handleFieldChange('engenheiroCpf', e.target.value)}
                                                placeholder="000.000.000-00"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>CREA</Form.Label>
                                            <Form.Control
                                                value={formData.engenheiroCrea || ''}
                                                onChange={(e) => handleFieldChange('engenheiroCrea', e.target.value)}
                                                placeholder="1234567"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>UF do CREA</Form.Label>
                                            <Form.Select
                                                value={formData.engenheiroUf || ''}
                                                onChange={(e) => handleFieldChange('engenheiroUf', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </div>

                            <div className="separator separator-dashed my-6"></div>

                            {/* Seção 5: Teste de Conexão */}
                            <div className="mb-8">
                                <h4 className="mb-4">Validação</h4>
                                <Button
                                    variant="primary"
                                    onClick={handleTestConnection}
                                    disabled={!isFormValid() || testing}
                                >
                                    {testing ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-wifi me-2"></i>}
                                    Testar Conexão com eSocial
                                </Button>

                                {testResult && (
                                    <Alert variant={testResult.success ? 'success' : 'danger'} className="mt-3">
                                        {testResult.message}
                                    </Alert>
                                )}
                            </div>

                            {/* Ações */}
                            <div className="d-flex justify-content-end gap-3">
                                <Button variant="secondary" onClick={loadConfig}>
                                    Cancelar
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={handleSave}
                                    disabled={!isFormValid() || saving}
                                >
                                    {saving ? <Spinner size="sm" className="me-2" /> : <i className="bi bi-check-circle me-2"></i>}
                                    Salvar Configuração
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Alert variant="warning">
                            <strong>eSocial Desabilitado</strong>
                            <p className="mb-0 mt-2">Habilite a integração para começar a enviar eventos S-2240.</p>
                        </Alert>
                    )}
                </div>
            </div>
        </Content>
    );
}
