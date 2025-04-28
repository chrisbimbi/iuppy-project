import React from 'react';
import { News as Content } from '@shared/types';

interface Props {
    channelName: string | null;
    onEditChannel(): void;
    onCreatePost(): void;
    items: Content[];
    loading: boolean;
    error: any;
    selectedIds: string[];
    onSelect(id: string, checked: boolean): void;
    onEdit(id: string): void;
    onDuplicate(id: string): void;
    onDelete(id: string): void;
}

const ContentList: React.FC<Props> = ({
    channelName,
    onEditChannel,
    onCreatePost,
    items,
    loading,
    error,
    selectedIds,
    onSelect,
    onEdit,
    onDuplicate,
    onDelete,
}) => {
    if (loading) return <div>Carregando conteúdos...</div>;
    if (error) return <div>Erro ao carregar conteúdos.</div>;

    return (
        <div className="card card-flush h-lg-100">
            <div className="card-header py-5 d-flex justify-content-between align-items-center">
                <h3>{channelName ?? 'Conteúdos'}</h3>
                <div>
                    <button className="btn btn-sm btn-light me-2" onClick={onEditChannel}>
                        <i className="bi bi-gear"></i>
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={onCreatePost}>
                        Criar post
                    </button>
                </div>
            </div>
            <div className="card-body py-3">
                {items.length === 0 ? (
                    <div className="text-center text-muted">Nenhum conteúdo encontrado.</div>
                ) : (
                    <table className="table table-row-dashed gy-5 align-middle fw-semibold">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={items.length > 0 && items.every(i => selectedIds.includes(i.id))}
                                        onChange={e => items.forEach(i => onSelect(i.id, e.target.checked))}
                                    />
                                </th>
                                <th>Título</th>
                                <th>Status</th>
                                <th>Stats</th>
                                <th>Atualizado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const isChecked = selectedIds.includes(item.id);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => onSelect(item.id, e.target.checked)}
                                            />
                                        </td>
                                        <td>{item.title}</td>
                                        <td>{item.isPublished ? 'Publicado' : 'Rascunho'}</td>
                                        <td>
                                            <button
                                                className="btn btn-icon btn-sm"
                                                onClick={() => {/* stats drawer logic */ }}
                                            >
                                                <i className="bi bi-bar-chart-line"></i>
                                            </button>
                                        </td>
                                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                                        <td>
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-icon"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end">
                                                    <li>
                                                        <button className="dropdown-item" onClick={() => onEdit(item.id)}>
                                                            <i className="bi bi-pencil me-2" /> Editar
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button className="dropdown-item" onClick={() => onDuplicate(item.id)}>
                                                            <i className="bi bi-files me-2" /> Duplicar
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            className="dropdown-item text-danger"
                                                            onClick={() => onDelete(item.id)}
                                                        >
                                                            <i className="bi bi-trash me-2" /> Apagar
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ContentList;