import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { PageTitle } from 'src/layout/core';
import { Button } from 'react-bootstrap';
// In real app, import charts from apexcharts or similar

export default function AnalyticsPage() {
    const intl = useIntl();
    const [downloading, setDownloading] = useState(false);

    // Mock Data mimicking backend response
    const data = {
        pgr: { totalRisks: 45, criticalRisks: 4, actionPlanProgress: 65 },
        trainings: { completionRate: 78, averageScore: 8.5 },
        drills: { lastDrillDate: '2025-11-15', participationRate: 92 },
        esocial: { coverage: 98, pendingErrors: 3 },
    };

    const handleDownload = () => {
        setDownloading(true);
        setTimeout(() => {
            alert('Relatório baixado com sucesso!');
            setDownloading(false);
        }, 1500);
    };

    return (
        <>
            <PageTitle>Indicadores & Analytics NR-1</PageTitle>

            <div className="card mb-5">
                <div className="card-header">
                    <h3 className="card-title">Visão Geral de Conformidade</h3>
                    <div className="card-toolbar">
                        <Button variant="light-primary" onClick={handleDownload} disabled={downloading}>
                            {downloading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-download me-2"></i>}
                            Exportar Relatório Geral (CSV)
                        </Button>
                    </div>
                </div>
            </div>

            <div className="row g-5 g-xl-8">
                {/* PGR Card */}
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-header border-0">
                            <h3 className="card-title fw-bolder text-dark">PGR: Inventário de Riscos</h3>
                        </div>
                        <div className="card-body pt-2">
                            <div className="d-flex align-items-center bg-light-warning rounded p-5 mb-7">
                                <span className="svg-icon svg-icon-warning me-5">
                                    <i className="bi bi-exclamation-triangle fs-1 text-warning"></i>
                                </span>
                                <div className="flex-grow-1 me-2">
                                    <a href="#" className="fw-bolder text-gray-800 text-hover-primary fs-6">Riscos Críticos</a>
                                    <span className="text-muted fw-bold d-block">Atenção Imediata</span>
                                </div>
                                <span className="fw-bolder text-warning py-1">{data.pgr.criticalRisks}</span>
                            </div>
                            <div className="d-flex align-items-center bg-light-info rounded p-5">
                                <span className="svg-icon svg-icon-info me-5">
                                    <i className="bi bi-list-check fs-1 text-info"></i>
                                </span>
                                <div className="flex-grow-1 me-2">
                                    <a href="#" className="fw-bolder text-gray-800 text-hover-primary fs-6">Planos de Ação</a>
                                    <span className="text-muted fw-bold d-block">Conclusão</span>
                                </div>
                                <span className="fw-bolder text-info py-1">{data.pgr.actionPlanProgress}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trainings & Drills Card */}
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-header border-0">
                            <h3 className="card-title fw-bolder text-dark">Treinamentos & Simulados</h3>
                        </div>
                        <div className="card-body pt-2">
                            <div className="d-flex align-items-center mb-8">
                                <div className="flex-grow-1">
                                    <span className="text-gray-800 fw-bolder d-block fs-6">Taxa de Conclusão (Treinamentos)</span>
                                    <span className="text-muted fw-bold d-block mt-1">Meta: 100%</span>
                                </div>
                                <span className="fw-bolder text-primary fs-3">{data.trainings.completionRate}%</span>
                            </div>
                            <div className="d-flex align-items-center mb-8">
                                <div className="flex-grow-1">
                                    <span className="text-gray-800 fw-bolder d-block fs-6">Média nas Provas</span>
                                </div>
                                <span className="fw-bolder text-success fs-3">{data.trainings.averageScore} / 10</span>
                            </div>
                            <div className="separator separator-dashed my-4"></div>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <span className="text-gray-800 fw-bolder d-block fs-6">Último Simulado</span>
                                    <span className="text-muted fw-bold d-block mt-1">{data.drills.lastDrillDate}</span>
                                </div>
                                <span className="badge badge-light-success">{data.drills.participationRate}% Presença</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
