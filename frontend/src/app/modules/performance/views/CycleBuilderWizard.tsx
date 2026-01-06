import React, { useState } from 'react'
import { createCycle } from '../services/performanceService'
import { PerformanceCycleStatus } from '@shared/types'

export function CycleBuilderWizard() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        participantsFilter: { department: 'All' },
        templateId: '',
        includeCalibration: false
    })
    const [loading, setLoading] = useState(false)

    const next = () => setStep(s => s + 1)
    const back = () => setStep(s => s - 1)

    const finish = async () => {
        setLoading(true)
        try {
            await createCycle({
                ...formData,
                status: PerformanceCycleStatus.SETUP
            })
            alert('Ciclo criado com sucesso!')
            // Redirect or Reset
        } catch (error) {
            console.error(error)
            alert('Erro ao criar ciclo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='card'>
            <div className='card-header'>
                <h3 className='card-title'>Criar Ciclo de Desempenho - Passo {step}/3</h3>
            </div>
            <div className='card-body'>
                {step === 1 && (
                    <div>
                        <h4>Informações Básicas</h4>
                        <div className='mb-3'>
                            <label className='form-label'>Nome do Ciclo</label>
                            <input
                                className='form-control'
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder='Ex: Avaliação 2024.1'
                            />
                        </div>
                        <div className='row'>
                            <div className='col-6'>
                                <label className='form-label'>Início</label>
                                <input
                                    type='date'
                                    className='form-control'
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className='col-6'>
                                <label className='form-label'>Fim</label>
                                <input
                                    type='date'
                                    className='form-control'
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h4>Participantes</h4>
                        <div className='alert alert-info'>Defina quem participará deste ciclo.</div>
                        <div className='mb-3'>
                            <label className='form-label'>Departamento</label>
                            <select
                                className='form-select'
                                value={formData.participantsFilter.department}
                                onChange={e => setFormData({ ...formData, participantsFilter: { department: e.target.value } })}
                            >
                                <option value="All">Todos</option>
                                <option value="Tech">Tecnologia</option>
                                <option value="HR">RH</option>
                            </select>
                        </div>
                        <hr className='my-4' />
                        <h4>Configuração de Avaliação</h4>
                        <div className='mb-3'>
                            <label className='form-label'>Modelo de Formulário</label>
                            <select
                                className='form-select'
                                value={formData.templateId}
                                onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                            >
                                <option value="">Selecione um modelo...</option>
                                <option value="tmpl_001">Competências & Cultura (Padrão)</option>
                                <option value="tmpl_002">Liderança 360º</option>
                            </select>
                        </div>
                        <div className='form-check form-switch'>
                            <input
                                className='form-check-input'
                                type='checkbox'
                                id='calibrationSwitch'
                                checked={formData.includeCalibration}
                                onChange={e => setFormData({ ...formData, includeCalibration: e.target.checked })}
                            />
                            <label className='form-check-label' htmlFor='calibrationSwitch'>
                                Habilitar Calibragem (9-Box)?
                            </label>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h4>Revisão e Confirmação</h4>
                        <p><strong>Nome:</strong> {formData.name}</p>
                        <p><strong>Período:</strong> {formData.startDate} até {formData.endDate}</p>
                        <p><strong>Participantes:</strong> {formData.participantsFilter.department}</p>
                        <p><strong>Modelo:</strong> {formData.templateId || 'Não selecionado'}</p>
                        <p><strong>Calibragem:</strong> {formData.includeCalibration ? 'Sim' : 'Não'}</p>
                    </div>
                )}
            </div>
            <div className='card-footer d-flex justify-content-between'>
                <button className='btn btn-secondary' onClick={back} disabled={step === 1}>Voltar</button>
                {step < 3 ? (
                    <button className='btn btn-primary' onClick={next}>Próximo</button>
                ) : (
                    <button className='btn btn-success' onClick={finish} disabled={loading}>
                        {loading ? 'Criando...' : 'Finalizar e Criar'}
                    </button>
                )}
            </div>
        </div>
    )
}
