
import React from 'react'
import { Modal } from 'react-bootstrap'

interface SuccessModalProps {
    show: boolean
    onClose: () => void
    title?: string
    message: string
}

const SuccessModal: React.FC<SuccessModalProps> = ({ show, onClose, title = 'Sucesso!', message }) => {
    return (
        <Modal show={show} onHide={onClose} centered contentClassName='shadow-lg'>
            <Modal.Body className='py-10 px-10 text-center'>
                <div className='mb-6'>
                    {/* Metronic Check/Success Icon Style */}
                    <div className='symbol symbol-100px'>
                        <div className='symbol-label fs-2x fw-bold text-success bg-light-success border border-success border-dashed'>
                            <i className='bi bi-check-lg fs-3x text-success'></i>
                        </div>
                    </div>
                </div>

                <h1 className='fw-bolder text-dark mb-3'>{title}</h1>
                <div className='fs-5 text-gray-600 mb-8'>{message}</div>

                <button
                    type='button'
                    className='btn btn-lg btn-success fw-bolder'
                    onClick={onClose}
                >
                    OK, Entendido!
                </button>
            </Modal.Body>
        </Modal>
    )
}

export default SuccessModal
