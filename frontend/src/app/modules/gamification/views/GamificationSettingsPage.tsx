import React, { useState } from 'react'
import { PageTitle } from 'src/layout/core'
import { Content } from 'src/layout/components/Content'
import { Card, CardBody, CardHeader, Row, Col, Form, Button } from 'react-bootstrap'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from 'src/app/modules/auth/core/_requests'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const DEFAULT_EXPLANATION = `## Como funciona a pontuação? 🎮

Ei! Aqui valorizamos sua participação e engajamento. Quanto mais você interage, mais pontos (XP) você ganha!

### 📰 Comunicados (News)
- **Ler um comunicado**: 1 XP (até 10 por dia)
- **Reagir**: 2 XP (até 20 por dia)
- **Comentar**: 3 XP (até 5 por dia)
- **Compartilhar**: 5 XP (até 10 por dia)

### 💬 Mural Social
- **Criar um post**: 5 XP (até 3 por dia)
- **Reagir a um post**: 2 XP (até 20 por dia)
- **Comentar**: 5 XP (até 5 por dia)
- **Compartilhar**: 3 XP (até 10 por dia)

### 🚀 Jornadas
- **Completar um passo**: 50 XP
- **Concluir uma jornada**: 100 XP

### 📊 Enquetes
- **Responder uma enquete**: 20 XP

### 📈 Níveis
Conforme você acumula XP, você sobe de nível! Cada nível te dá mais destaque e pode desbloquear conquistas especiais.

**Continua crescendo!** 🌟`

interface GamificationSettings {
    NEWS_READ?: { points: number; dailyLimit?: number }
    NEWS_REACTION?: { points: number; dailyLimit?: number }
    NEWS_COMMENT?: { points: number; dailyLimit?: number }
    NEWS_SHARE?: { points: number; dailyLimit?: number }
    SOCIAL_POST?: { points: number; dailyLimit?: number }
    SOCIAL_REACTION?: { points: number; dailyLimit?: number }
    SOCIAL_COMMENT?: { points: number; dailyLimit?: number }
    SOCIAL_SHARE?: { points: number; dailyLimit?: number }
    JOURNEY_STEP?: { points: number }
    JOURNEY_COMPLETION?: { points: number }
    SURVEY_COMPLETION?: { points: number }
}

const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
    NEWS_READ: { points: 1, dailyLimit: 10 },
    NEWS_REACTION: { points: 2, dailyLimit: 20 },
    NEWS_COMMENT: { points: 3, dailyLimit: 5 },
    NEWS_SHARE: { points: 5, dailyLimit: 10 },
    SOCIAL_POST: { points: 5, dailyLimit: 3 },
    SOCIAL_REACTION: { points: 2, dailyLimit: 20 },
    SOCIAL_COMMENT: { points: 5, dailyLimit: 5 },
    SOCIAL_SHARE: { points: 3, dailyLimit: 10 },
    JOURNEY_STEP: { points: 50 },
    JOURNEY_COMPLETION: { points: 100 },
    SURVEY_COMPLETION: { points: 20 },
}

const GamificationSettings: React.FC = () => {
    const queryClient = useQueryClient()

    const { data: settings, isLoading: loadingSettings } = useQuery<GamificationSettings>({
        queryKey: ['gamification-settings'],
        queryFn: async () => {
            const res = await api.get('/gamification/settings')
            return res.data || {}
        }
    })

    const { data: explanation, isLoading: loadingExplanation } = useQuery<{ content: string | null }>({
        queryKey: ['gamification-explanation'],
        queryFn: async () => {
            const res = await api.get('/gamification/explanation')
            return res.data
        }
    })

    const [formData, setFormData] = useState<GamificationSettings>({})
    const [explanationText, setExplanationText] = useState('')

    React.useEffect(() => {
        if (settings) {
            // Check if settings object is empty (no configs in DB yet)
            const isEmpty = Object.keys(settings).length === 0
            if (isEmpty) {
                setFormData(DEFAULT_GAMIFICATION_SETTINGS)
            } else {
                setFormData(settings)
            }
        }
    }, [settings])

    React.useEffect(() => {
        if (explanation) {
            setExplanationText(explanation.content || DEFAULT_EXPLANATION)
        }
    }, [explanation])

    const saveSettings = useMutation({
        mutationFn: async (data: GamificationSettings) => {
            await api.put('/gamification/settings', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-settings'] })
            alert('Configura\u00e7\u00f5es salvas com sucesso!')
        },
    })

    const saveExplanation = useMutation({
        mutationFn: async (content: string) => {
            await api.put('/gamification/explanation', { content })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-explanation'] })
            alert('Texto explicativo salvo!')
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        saveSettings.mutate(formData)
    }

    const handleSaveExplanation = () => {
        saveExplanation.mutate(explanationText)
    }

    const handleResetDefaults = () => {
        setFormData(DEFAULT_GAMIFICATION_SETTINGS)
    }

    const updateField = (key: keyof GamificationSettings, field: 'points' | 'dailyLimit', value: number) => {
        setFormData((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }))
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Configurações de Gamificação</PageTitle>

            {/* XP Configuration Form */}
            <Content>
                <Card className="mb-5">
                    <CardHeader>
                        <h3 className="card-title">Configuração de Pontos (XP)</h3>
                        <div className="card-toolbar">
                            <Button variant="light" size="sm" onClick={handleResetDefaults}>
                                Restaurar Padrões
                            </Button>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <Form onSubmit={handleSubmit}>
                            {/* News Section */}
                            <h4 className="mb-3">📰 Comunicados (News)</h4>
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Ler (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_READ?.points || 0}
                                            onChange={(e) => updateField('NEWS_READ', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_READ?.dailyLimit || 0}
                                            onChange={(e) => updateField('NEWS_READ', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Reagir (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_REACTION?.points || 0}
                                            onChange={(e) => updateField('NEWS_REACTION', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_REACTION?.dailyLimit || 0}
                                            onChange={(e) => updateField('NEWS_REACTION', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Comentar (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_COMMENT?.points || 0}
                                            onChange={(e) => updateField('NEWS_COMMENT', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_COMMENT?.dailyLimit || 0}
                                            onChange={(e) => updateField('NEWS_COMMENT', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Compartilhar (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_SHARE?.points || 0}
                                            onChange={(e) => updateField('NEWS_SHARE', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.NEWS_SHARE?.dailyLimit || 0}
                                            onChange={(e) => updateField('NEWS_SHARE', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr className="my-5" />

                            {/* Social Section */}
                            <h4 className="mb-3">💬 Mural Social</h4>
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Criar Post (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_POST?.points || 0}
                                            onChange={(e) => updateField('SOCIAL_POST', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_POST?.dailyLimit || 0}
                                            onChange={(e) => updateField('SOCIAL_POST', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Reagir (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_REACTION?.points || 0}
                                            onChange={(e) => updateField('SOCIAL_REACTION', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_REACTION?.dailyLimit || 0}
                                            onChange={(e) => updateField('SOCIAL_REACTION', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mb-4">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Comentar (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_COMMENT?.points || 0}
                                            onChange={(e) => updateField('SOCIAL_COMMENT', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_COMMENT?.dailyLimit || 0}
                                            onChange={(e) => updateField('SOCIAL_COMMENT', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Compartilhar (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_SHARE?.points || 0}
                                            onChange={(e) => updateField('SOCIAL_SHARE', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>Limite Diário</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SOCIAL_SHARE?.dailyLimit || 0}
                                            onChange={(e) => updateField('SOCIAL_SHARE', 'dailyLimit', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <hr className="my-5" />

                            {/* Other Actions */}
                            <h4 className="mb-3">🚀 Outras Ações</h4>
                            <Row className="mb-4">
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Passo de Jornada (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.JOURNEY_STEP?.points || 0}
                                            onChange={(e) => updateField('JOURNEY_STEP', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Conclusão de Jornada (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.JOURNEY_COMPLETION?.points || 0}
                                            onChange={(e) => updateField('JOURNEY_COMPLETION', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label>Responder Enquete (XP)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={formData.SURVEY_COMPLETION?.points || 0}
                                            onChange={(e) => updateField('SURVEY_COMPLETION', 'points', Number(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="text-end mt-5">
                                <Button variant="primary" type="submit" disabled={saveSettings.isPending}>
                                    {saveSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                                </Button>
                            </div>
                        </Form>
                    </CardBody>
                </Card>

                {/* Explanation Text Editor */}
                <Card>
                    <CardHeader>
                        <h3 className="card-title">Texto Explicativo</h3>
                    </CardHeader>
                    <CardBody>
                        <p className="text-muted mb-4">
                            Este texto será exibido para os usuários explicando como funciona o sistema de pontuação.
                        </p>
                        <ReactQuill
                            theme="snow"
                            value={explanationText}
                            onChange={setExplanationText}
                            style={{ height: '300px', marginBottom: '50px' }}
                        />
                        <div className="text-end mt-5">
                            <Button variant="primary" onClick={handleSaveExplanation} disabled={saveExplanation.isPending}>
                                {saveExplanation.isPending ? 'Salvando...' : 'Salvar Texto Explicativo'}
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </Content>
        </>
    )
}

export default GamificationSettings
