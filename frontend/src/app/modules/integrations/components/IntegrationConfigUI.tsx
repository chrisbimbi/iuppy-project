import React, { useState, useEffect } from 'react'
import { IntegrationsService } from '../services/integrations.service'

interface Props {
    connectionId: string
    onClose: () => void
}

const IntegrationConfigUI: React.FC<Props> = ({ connectionId, onClose }) => {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [credentials, setCredentials] = useState({ clientId: '', clientSecret: '', tenantId: '' })
    const [uniqueIdentifier, setUniqueIdentifier] = useState('userPrincipalName')
    const [schema, setSchema] = useState<any[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})

    const internalFields = [
        { key: 'name', label: 'Nome Completo' },
        { key: 'email', label: 'E-mail Corporativo' },
        { key: 'role', label: 'Cargo / Função' },
        { key: 'department', label: 'Departamento' },
        { key: 'phone', label: 'Telefone' },
        { key: 'active', label: 'Status (Ativo/Inativo)' },
        { key: 'identification', label: 'Documento (CPF/Matrícula)' },
        { key: 'avatar', label: 'Foto de Perfil' }
    ]

    useEffect(() => {
        // Load existing config if available
        loadConfig()
    }, [connectionId])

    const loadConfig = async () => {
        try {
            const config = await IntegrationsService.getConfig(connectionId)
            if (config && config.fieldMapping) {
                setMapping(config.fieldMapping)
                if (config.fieldMapping['_primaryKey']) {
                    setUniqueIdentifier(config.fieldMapping['_primaryKey'])
                }
            }
        } catch (e) {
            console.error('No existing config found', e)
        }
    }

    const handleDiscovery = async () => {
        setLoading(true)
        setStep(2)
        try {
            // Call backend to discover schema using the connector
            const result = await IntegrationsService.discoverSchema(connectionId)
            setSchema(result.schema)

            // Merge existing mapping with suggestions, preferring existing
            const suggestions = result.suggestedMapping || {}
            setMapping(prev => ({ ...suggestions, ...prev }))

            setStep(3)
        } catch (error) {
            console.error(error)
            alert('Erro ao conectar com o ERP. Verifique as credenciais.')
            setStep(1)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            await IntegrationsService.saveConfig(connectionId, { mapping, uniqueIdentifier })
            alert('Configuração salva com sucesso! A sincronização iniciará em breve.')
            onClose()
        } catch (error) {
            alert('Erro ao salvar configuração.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='modal fade show d-block' style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className='modal-dialog modal-lg modal-dialog-centered'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <h5 className='modal-title'>Configuração de Integração (Smart Mapper)</h5>
                        <div className='btn btn-icon btn-sm btn-active-light-primary ms-2' onClick={onClose}>
                            <i className='fas fa-times'></i>
                        </div>
                    </div>

                    <div className='modal-body'>
                        {/* Stepper Header */}
                        <div className='d-flex justify-content-between mb-10'>
                            <div className={step >= 1 ? 'text-primary' : 'text-muted'}>1. Conexão & Identidade</div>
                            <div className={step >= 2 ? 'text-primary' : 'text-muted'}>2. Discovery</div>
                            <div className={step >= 3 ? 'text-primary' : 'text-muted'}>3. Mapeamento</div>
                        </div>

                        {/* STEP 1: Connection */}
                        {step === 1 && (
                            <div>
                                <h4 className='mb-5'>Credenciais do Microsoft Graph API</h4>
                                <div className='mb-5'>
                                    <label className='form-label'>Client ID</label>
                                    <input
                                        type='text'
                                        className='form-control'
                                        value={credentials.clientId}
                                        onChange={e => setCredentials({ ...credentials, clientId: e.target.value })}
                                        placeholder='Ex: 53569420-...'
                                    />
                                </div>
                                <div className='mb-5'>
                                    <label className='form-label'>Client Secret</label>
                                    <input
                                        type='password'
                                        className='form-control'
                                        value={credentials.clientSecret}
                                        onChange={e => setCredentials({ ...credentials, clientSecret: e.target.value })}
                                    />
                                    <div className='form-text'>Para demonstração, deixe em branco para usar o Mock Mode (1000 usuários).</div>
                                </div>

                                <h4 className='mb-3 mt-10'>Identificador Único</h4>
                                <p className='text-muted fs-7'>Qual campo do ERP identifica unicamente o colaborador?</p>
                                <select
                                    className='form-select'
                                    value={uniqueIdentifier}
                                    onChange={e => setUniqueIdentifier(e.target.value)}
                                >
                                    <option value='userPrincipalName'>User Principal Name (Email)</option>
                                    <option value='mail'>Email Address</option>
                                    <option value='employeeId'>Employee ID (Matrícula)</option>
                                    <option value='cpf'>CPF (Somente Números)</option>
                                    <option value='onPremisesSamAccountName'>SAM Account Name</option>
                                </select>
                            </div>
                        )}

                        {/* STEP 2: Discovery Loading */}
                        {step === 2 && (
                            <div className='text-center py-10'>
                                <span className='spinner-border spinner-border-lg align-middle ms-2'></span>
                                <h3 className='mt-5'>Analisando estrutura do ERP...</h3>
                                <p className='text-muted'>Conectando ao Microsoft Graph e buscando amostra de dados.</p>
                            </div>
                        )}

                        {/* STEP 3: Mapping */}
                        {step === 3 && (
                            <div>
                                <div className='alert alert-primary d-flex align-items-center p-5 mb-10'>
                                    <span className='svg-icon svg-icon-2hx svg-icon-primary me-3'>...</span>
                                    <div className='d-flex flex-column'>
                                        <h4 className='mb-1 text-primary'>Mapeamento Inteligente Concluído</h4>
                                        <span>O sistema detectou automaticamente {Object.keys(mapping).length} correspondências. Revise abaixo.</span>
                                    </div>
                                </div>

                                <div className='table-responsive'>
                                    <table className='table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3'>
                                        <thead>
                                            <tr className='fw-bolder text-muted'>
                                                <th className='min-w-150px'>Campo do Iuppy</th>
                                                <th className='min-w-150px'>Campo do ERP (Origem)</th>
                                                <th className='min-w-100px text-end'>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {internalFields.map(field => (
                                                <tr key={field.key}>
                                                    <td>
                                                        <span className='text-dark fw-bolder text-hover-primary fs-6'>{field.label}</span>
                                                        <span className='text-muted d-block fs-7'>({field.key})</span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className='form-select form-select-sm'
                                                            value={mapping[field.key] || ''}
                                                            onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                                                        >
                                                            <option value=''>-- Não Mapeado --</option>
                                                            {schema.map(s => (
                                                                <option key={s.key} value={s.key}>
                                                                    {s.label} ({s.key})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {mapping[field.key] && (
                                                            <div className='text-muted fs-7 mt-1 ml-2'>
                                                                Exemplo: {schema.find(s => s.key === mapping[field.key])?.sampleValue}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className='text-end'>
                                                        {mapping[field.key] ? (
                                                            <span className='badge badge-light-success'>Mapeado</span>
                                                        ) : (
                                                            <span className='badge badge-light-warning'>Pendente</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='modal-footer'>
                        {step === 1 && (
                            <button className='btn btn-primary' onClick={handleDiscovery}>
                                Conectar e Analisar <i className='fas fa-arrow-right ms-2'></i>
                            </button>
                        )}
                        {step === 3 && (
                            <>
                                <button className='btn btn-light' onClick={() => setStep(1)}>Voltar</button>
                                <button className='btn btn-success' onClick={handleSave} disabled={loading}>
                                    Salvar Integração <i className='fas fa-check ms-2'></i>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IntegrationConfigUI
