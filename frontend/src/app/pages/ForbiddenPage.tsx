import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ForbiddenPage() {
    const navigate = useNavigate()
    return (
        <div className="d-flex flex-column align-items-center justify-content-center p-10">
            <h1 className="mb-3">Acesso negado</h1>
            <p className="text-muted mb-6">
                Seu perfil não tem acesso ao painel administrativo.
            </p>

            <button
                className="btn btn-primary"
                onClick={() => navigate('/logout?to=/auth/login', { replace: true })}
            >
                Voltar ao login
            </button>
        </div>
    )
}