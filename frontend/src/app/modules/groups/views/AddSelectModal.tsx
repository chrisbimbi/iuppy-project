import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import { User } from '@shared/types';

interface Props {
    show: boolean;
    allUsers: User[];
    selected: string[];
    title: string;
    onClose(): void;
    onConfirm(next: string[]): void;
}

const AddSelectModal: React.FC<Props> = ({
    show, allUsers, selected, title, onClose, onConfirm
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [modal, setModal] = useState<Modal | null>(null);
    const [ids, setIds] = useState<string[]>(selected);

    useEffect(() => {
        if (ref.current && !modal) {
            setModal(new Modal(ref.current, { backdrop: 'static' }));
        }
    }, [ref.current]);

    useEffect(() => {
        if (modal) show ? modal.show() : modal.hide();
        setIds(selected);
    }, [show, modal, selected]);

    const toggle = (id: string) => {
        setIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const submit = () => {
        onConfirm(ids);
        onClose();
    };

    return (
        <div className="modal fade" tabIndex={-1} ref={ref}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        <select
                            multiple
                            className="form-select"
                            style={{ minHeight: 200 }}
                            value={ids}
                            onChange={e => {
                                const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                                setIds(opts);
                            }}
                        >
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-light" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" disabled={ids.length === 0} onClick={submit}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSelectModal;