import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Content } from 'src/layout/components/Content';
import { PageTitle } from 'src/layout/core';

export default function AuditExportPage() {
    const intl = useIntl();
    const [signing, setSigning] = useState<string | null>(null);

    // Mock data for MVP
    const evidence = [
        { id: '1', type: 'inventario', file_url: 'pgr_2025.pdf', sha256: 'a1b2...', signed: true, created_at: '2025-12-10' },
        { id: '2', type: 'certificado', file_url: 'cert_john_doe.pdf', sha256: 'c3d4...', signed: false, created_at: '2025-12-12' },
    ];

    const handleSign = (id: string) => {
        setSigning(id);
        setTimeout(() => {
            alert('Assinatura ICP-Brasil simulada com sucesso!');
            setSigning(null);
            // In real app, refetch data here
        }, 1500);
    };

    return (
        <Content>
            <PageTitle>Auditoria & Evidências (ICP-Brasil)</PageTitle>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Cofre de Evidências</h3>
                    <div className="card-toolbar">
                        <button className="btn btn-light-primary me-3">
                            <i className="bi bi-download"></i> Exportar Auditoria (JSON)
                        </button>
                    </div>
                </div>
                <div className="card-body py-3">
                    <div className="table-responsive">
                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bolder text-muted">
                                    <th className="min-w-150px">Arquivo</th>
                                    <th className="min-w-100px">Tipo</th>
                                    <th className="min-w-100px">Integridade (SHA-256)</th>
                                    <th className="min-w-100px">Status</th>
                                    <th className="min-w-100px text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evidence.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="symbol symbol-45px me-5">
                                                    <span className="symbol-label bg-light-primary">
                                                        <i className="bi bi-file-earmark-pdf fs-2x text-primary"></i>
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-start flex-column">
                                                    <span className="text-dark fw-bolder text-hover-primary fs-6">
                                                        {item.file_url}
                                                    </span>
                                                    <span className="text-muted fw-bold text-muted d-block fs-7">
                                                        {item.created_at}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-light fw-bolder">{item.type}</span>
                                        </td>
                                        <td className="text-muted font-monospace fs-7">
                                            {item.sha256.substring(0, 10)}...
                                        </td>
                                        <td>
                                            {item.signed ? (
                                                <span className="badge badge-light-success">Assinado (ICP)</span>
                                            ) : (
                                                <span className="badge badge-light-warning">Pendente</span>
                                            )}
                                        </td>
                                        <td className="text-end">
                                            {!item.signed && (
                                                <button
                                                    className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                    onClick={() => handleSign(item.id)}
                                                    disabled={signing === item.id}
                                                >
                                                    {signing === item.id ? (
                                                        <span className="spinner-border spinner-border-sm"></span>
                                                    ) : (
                                                        <i className="bi bi-pen-fill" title="Assinar Digitalmente"></i>
                                                    )}
                                                </button>
                                            )}
                                            <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm">
                                                <i className="bi bi-download"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Content>
    );
}
