import React, { useMemo } from 'react';
import { Badge } from 'react-bootstrap';

interface Props {
    risks: any[];
    onCellClick: (prob: number, sev: number) => void;
    selectedCell: { p: number, s: number } | null;
}

// 5x5 Matrix
// Columns (Severity): 1 (Leve) -> 5 (Fatal)
// Rows (Probability): 1 (Rara) -> 5 (Frequente)
// We typically render Probability on Y (inverted? or standard?) and Severity on X.
// Let's assume standard: Y=Probability, X=Severity.

export default function RiskMatrix({ risks, onCellClick, selectedCell }: Props) {

    // Calculate counts
    const matrix = useMemo(() => {
        const m: Record<string, number> = {};
        risks.forEach(r => {
            // Assume risk has probability (p) and severity (s) stored in it, 
            // or derived from classification. 
            // For Phase 3, let's assume we store p and s directly or calculate them.
            // If they are not in the top level, check 'analysis' object.
            const p = r.probabilidade || r.analysis?.probability || 0;
            const s = r.severidade || r.analysis?.severity || 0;
            if (p > 0 && s > 0) {
                const key = `${p}-${s}`;
                m[key] = (m[key] || 0) + 1;
            }
        });
        return m;
    }, [risks]);

    const getColor = (p: number, s: number) => {
        const level = p * s;
        if (level <= 5) return 'bg-success'; // Trivial / Aceitável
        if (level <= 10) return 'bg-primary'; // Moderado
        if (level <= 15) return 'bg-warning'; // Substancial
        if (level >= 16) return 'bg-danger';  // Intolerável/Crítico
        return 'bg-secondary';
    };

    const renderCell = (p: number, s: number) => {
        const count = matrix[`${p}-${s}`] || 0;
        const isSelected = selectedCell?.p === p && selectedCell?.s === s;
        const bgClass = getColor(p, s);

        return (
            <td
                key={`${p}-${s}`}
                className={`text-center border cursor-pointer ${isSelected ? 'border-primary border-3' : ''}`}
                style={{ width: '60px', height: '60px', opacity: count > 0 || isSelected ? 1 : 0.4 }}
                onClick={() => onCellClick(p, s)}
            >
                <div className={`d-flex align-items-center justify-content-center w-100 h-100 rounded ${count > 0 ? bgClass : 'bg-light'}`}>
                    <span className={`fw-bold fs-6 ${count > 0 ? 'text-white' : 'text-muted'}`}>
                        {count > 0 ? count : '-'}
                    </span>
                </div>
            </td>
        );
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header">
                <h3 className="card-title">Matriz de Riscos (5x5)</h3>
            </div>
            <div className="card-body d-flex justify-content-center">
                <div className="d-flex flex-row">
                    <div className="d-flex flex-column justify-content-center me-3">
                        <span className="fw-bold text-muted" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                            PROBABILIDADE
                        </span>
                    </div>
                    <div>
                        <table className="table table-bordered mb-0">
                            <tbody>
                                {[5, 4, 3, 2, 1].map(p => (
                                    <tr key={p}>
                                        {[1, 2, 3, 4, 5].map(s => renderCell(p, s))}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    {/* Axis Labels for Severity */}
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <td key={`label-${s}`} className="text-center fw-bold text-muted border-0 small">
                                            {s}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                        <div className="text-center fw-bold text-muted mt-2">SEVERIDADE</div>
                    </div>
                </div>
            </div>
            <div className="card-footer d-flex justify-content-around py-2">
                <Badge bg="success">Aceitável (1-5)</Badge>
                <Badge bg="primary">Moderado (6-10)</Badge>
                <Badge bg="warning">Substancial (11-15)</Badge>
                <Badge bg="danger">Crítico (16-25)</Badge>
            </div>
        </div>
    );
}
