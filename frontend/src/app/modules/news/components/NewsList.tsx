// src/app/modules/news/components/NewsList.tsx
import { News } from '@shared/types';
import React from 'react';

interface Props {
  news: News[];
  loading: boolean;
  error: string | null;
}

export const NewsList: React.FC<Props> = ({ news, loading, error }) => {
  if (loading) {
    return <p>Carregando news...</p>;
  }
  if (error) {
    return <p>Erro: {error}</p>;
  }
  if (!news.length) {
    return <p>Nenhum new encontrado.</p>;
  }

  return (
    <div className="mt-5">
      <h4 className="fw-bold mb-3">Lista de News</h4>
      <div className="table-responsive">
        <table className="table align-middle gs-0 gy-3">
          <thead>
            <tr className="fw-bold text-muted bg-light">
              <th>Título</th>
              <th>Data de Criação</th>
              <th>Status</th>
              <th className="min-w-100px">Ações</th>
            </tr>
          </thead>
          <tbody>
            {news.map((news) => (
              <tr key={news.id}>
                <td>{news.title}</td>
                <td>{news.createdAt ? new Date(news.createdAt).toLocaleDateString() : '--'}</td>
                <td>{news.isPublished ? 'Publicado' : 'Rascunho'}</td>
                <td>
                  {/* Botões de ação (Editar/Deletar etc.) */}
                  <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1" title="Editar">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm" title="Excluir">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};