
import React, { useState } from 'react';
import { createCollectiveVacation } from '../services/vacationService';
import { useAuth } from '../../../modules/auth/core/Auth';

interface Props {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CollectiveVacationModal: React.FC<Props> = ({ show, onClose, onSuccess }) => {
    const { currentUser } = useAuth();
    const [title, setTitle] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createCollectiveVacation({
                companyId: currentUser?.companyId || 'DEFAULT',
                title,
                startDate,
                endDate,
                targetFilters: department ? { departments: [department] } : { departments: [] }, // Empty = All? Let's assume specific logic or validation
                description: 'Criado via Portal do RH'
            });
            alert('Férias Coletivas criadas com sucesso!');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar férias coletivas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Férias Coletivas</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Título</label>
                                <input type="text" className="form-control" required value={title} onChange={e => setTitle(e.target.value)} />
                            </div>
                            <div className="row">
                                <div className="col-6 mb-3">
                                    <label className="form-label">Início</label>
                                    <input type="date" className="form-control" required value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className="col-6 mb-3">
                                    <label className="form-label">Fim</label>
                                    <input type="date" className="form-control" required value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Departamento (Opcional)</label>
                                <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                                    <option value="">Toda a Empresa</option>
                                    <option value="Tech">Tech</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Criando...' : 'Criar Férias Coletivas'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
