
import React, { useEffect, useState } from 'react'
import { IntegrationsService, IntegrationProvider } from './services/integrations.service'
import AiSavingsWidget from './components/AiSavingsWidget'

import IntegrationConfigUI from './components/IntegrationConfigUI'
import SuccessModal from './components/SuccessModal'

const IntegrationsWorkspace: React.FC = () => {
    const [providers, setProviders] = useState<IntegrationProvider[]>([])
    const [loading, setLoading] = useState(false)
    const [configConnectionId, setConfigConnectionId] = useState<string | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await IntegrationsService.getProviders()
            setProviders(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async (providerKey: string) => {
        try {
            // Mock connection ID for demo purposes
            await IntegrationsService.triggerSync('f207d707-8c30-49b0-a820-d35767ade5af', 'FULL')
            setShowSuccessModal(true)
        } catch (error) {
            console.error('Sync failed', error)
            alert('Falha ao iniciar sincronização.')
        }
    }

    const handleConfigure = (providerKey: string) => {
        // In a real scenario, we'd fetch the connection ID for this provider.
        // For the Phase 6 demo, we'll assume a fixed connection ID for the 'Microsoft' provider
        // or just pass a mock one to trigger the UI.
        const mockConnectionId = 'f207d707-8c30-49b0-a820-d35767ade5af';
        setConfigConnectionId(mockConnectionId);
    }

    return (
        <>
            <AiSavingsWidget />

            <div className='card mb-5 mb-xl-10'>
                <div className='card-header border-0 cursor-pointer'>
                    <div className='card-title m-0'>
                        <h3 className='fw-bolder m-0'>Integrações Disponíveis</h3>
                    </div>
                </div>

                <div className='card-body border-top p-9'>
                    {loading && <p>Carregando...</p>}

                    <div className='row'>
                        {providers.map((provider) => (
                            <div key={provider.key} className='col-md-4 mb-5'>
                                <div className='card shadow-sm'>
                                    <div className='card-body p-5 d-flex flex-column align-items-center'>
                                        <div className='symbol symbol-60px mb-5'>
                                            <span className='symbol-label bg-light-primary text-primary fs-1 fw-bold'>
                                                {provider.name.charAt(0)}
                                            </span>
                                        </div>
                                        <h4 className='mb-1'>{provider.name}</h4>
                                        <p className='text-muted text-center fs-7 mb-5'>{provider.description}</p>

                                        <div className='d-flex gap-2'>
                                            <button
                                                className='btn btn-light btn-sm'
                                                onClick={() => handleConfigure(provider.key)}
                                            >
                                                Configurar
                                            </button>
                                            <button
                                                className='btn btn-primary btn-sm'
                                                onClick={() => handleSync(provider.key)}
                                            >
                                                Sincronizar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {configConnectionId && (
                <IntegrationConfigUI
                    connectionId={configConnectionId}
                    onClose={() => setConfigConnectionId(null)}
                />
            )}

            <SuccessModal
                show={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Sincronização Iniciada!"
                message="A importação completa dos usuários foi solicitada com sucesso. Em instantes os dados aparecerão na listagem."
            />
        </>
    )
}

export default IntegrationsWorkspace
