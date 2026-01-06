import React, { useState } from 'react'
import { createPolicy } from '../services/vacationService'

export function VacationPolicyConfig() {
    const [name, setName] = useState('')
    const [minAntecedence, setMinAntecedence] = useState(30)
    const [allowFractioning, setAllowFractioning] = useState(true)
    const [maxPeriods, setMaxPeriods] = useState(3)
    const [allowCashAllowance, setAllowCashAllowance] = useState(false)
    const [sellingLimitDays, setSellingLimitDays] = useState(10)
    const [sellingTiming, setSellingTiming] = useState('START_OF_PERIOD')
    const [allow13thAdvance, setAllow13thAdvance] = useState(false)
    const [approvalFlow, setApprovalFlow] = useState('MANAGER')
    const [approvalSlaDays, setApprovalSlaDays] = useState(5)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createPolicy({
                companyId: 'DEFAULT', // In real app use auth context
                name,
                minDaysAntecedence: minAntecedence,
                allowFractioning,
                maxPeriods,
                allowCashAllowance,
                sellingLimitDays,
                sellingTiming,
                allow13thAdvance,
                approvalFlow,
                approvalSlaDays,
            })
            alert('Política salva com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar política')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='card'>
            <div className='card-header'>
                <h3 className='card-title'>Configuração de Política de Férias</h3>
            </div>
            <div className='card-body'>
                <form onSubmit={handleSubmit}>
                    <div className='mb-3'>
                        <label className='form-label'>Nome da Política</label>
                        <input
                            type='text'
                            className='form-control'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder='Ex: CLT Padrão'
                            required
                        />
                    </div>
                    <div className='mb-3'>
                        <label className='form-label'>Antecedência Mínima (dias)</label>
                        <input
                            type='number'
                            className='form-control'
                            value={minAntecedence}
                            onChange={(e) => setMinAntecedence(Number(e.target.value))}
                        />
                    </div>
                    {/* Fracionamento */}
                    <div className='row mb-3'>
                        <div className='col-md-4'>
                            <div className='form-check pt-4'>
                                <input
                                    type='checkbox'
                                    className='form-check-input'
                                    id='fractioning'
                                    checked={allowFractioning}
                                    onChange={(e) => setAllowFractioning(e.target.checked)}
                                />
                                <label className='form-check-label' htmlFor='fractioning'>Permitir Fracionamento</label>
                            </div>
                        </div>
                        {allowFractioning && (
                            <div className='col-md-8'>
                                <label className='form-label'>Máximo de Períodos</label>
                                <input
                                    type='number'
                                    className='form-control'
                                    value={maxPeriods}
                                    onChange={(e) => setMaxPeriods(Number(e.target.value))}
                                />
                                <small className='text-muted'>Ex: 3 períodos (CLT)</small>
                            </div>
                        )}
                    </div>

                    {/* Abono Pecuniário */}
                    <div className='row mb-3'>
                        <div className='col-md-4'>
                            <div className='form-check pt-4'>
                                <input
                                    type='checkbox'
                                    className='form-check-input'
                                    id='cashAllowance'
                                    checked={allowCashAllowance}
                                    onChange={(e) => setAllowCashAllowance(e.target.checked)}
                                />
                                <label className='form-check-label' htmlFor='cashAllowance'>Permitir Venda (Abono)</label>
                            </div>
                        </div>
                        {allowCashAllowance && (
                            <>
                                <div className='col-md-4'>
                                    <label className='form-label'>Limite de Dias</label>
                                    <input
                                        type='number'
                                        className='form-control'
                                        value={sellingLimitDays}
                                        onChange={(e) => setSellingLimitDays(Number(e.target.value))}
                                    />
                                </div>
                                <div className='col-md-4'>
                                    <label className='form-label'>Momento da Venda</label>
                                    <select
                                        className='form-select'
                                        value={sellingTiming}
                                        onChange={e => setSellingTiming(e.target.value)}
                                    >
                                        <option value="START_OF_PERIOD">Início das Férias</option>
                                        <option value="ANYTIME">Qualquer momento</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* 13 e Aprovação */}
                    <div className='row mb-3'>
                        <div className='col-md-4'>
                            <div className='form-check pt-4'>
                                <input
                                    type='checkbox'
                                    className='form-check-input'
                                    id='allow13th'
                                    checked={allow13thAdvance}
                                    onChange={(e) => setAllow13thAdvance(e.target.checked)}
                                />
                                <label className='form-check-label' htmlFor='allow13th'>Permitir Adiantamento 13º</label>
                            </div>
                        </div>
                        <div className='col-md-4'>
                            <label className='form-label'>Fluxo de Aprovação</label>
                            <select
                                className='form-select'
                                value={approvalFlow}
                                onChange={e => setApprovalFlow(e.target.value)}
                            >
                                <option value="MANAGER">Gestor Imediato</option>
                                <option value="MANAGER_AND_HR">Gestor + RH</option>
                                <option value="HR_ONLY">Apenas RH</option>
                            </select>
                        </div>
                        <div className='col-md-4'>
                            <label className='form-label'>SLA de Aprovação (Dias)</label>
                            <input
                                type='number'
                                className='form-control'
                                value={approvalSlaDays}
                                onChange={(e) => setApprovalSlaDays(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <button type='submit' className='btn btn-primary' disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar Política Completa'}
                    </button>
                </form>
            </div>
        </div>
    )
}
