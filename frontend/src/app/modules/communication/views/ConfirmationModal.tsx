// frontend/src/app/modules/communication/views/ConfirmationModal.tsx
import React from 'react';
import { Modal } from 'bootstrap';

interface Props {
    show: boolean;
    title: string;
    body: string;
    onConfirm(): void;
    onCancel(): void;
}

const ConfirmationModal: React.FC<Props> = ({ show, title, body, onConfirm, onCancel }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (ref.current) {
            const m = new Modal(ref.current, { backdrop: 'static', keyboard: false });
            show ? m.show() : m.hide();
        }
    }, [show]);

    return (
        <div className="modal fade" tabIndex={-1} ref={ref}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
                <div className="modal-content border-danger">
                    <div className="modal-header bg-danger">
                        <h5 className="modal-title text-white">{title}</h5>
                    </div>
                    <div className="modal-body">
                        <p>{body}</p>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-light" onClick={onCancel}>Cancelar</button>
                        <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;