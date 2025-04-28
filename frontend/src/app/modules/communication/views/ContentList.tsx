// frontend/src/app/modules/communication/views/ContentList.tsx
import React, { useEffect, useRef } from 'react';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
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

// Imagem padrão quando não houver thumbnail
const DEFAULT_THUMB = '../media/stock/1600x800/img-1.jpg';

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
    const headerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        MenuComponent.reinitialization();
    }, [items]);

    // Ordena do mais recente ao mais antigo
    const sortedItems = items
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        const openStats = (item: Content) => {
            const drawerEl = document.getElementById('kt_stats_drawer');
            if (!drawerEl) return;
            // 'getOrCreateInstance' não existe no tipo, então usamos cast para any
            const dr = (DrawerComponent as any).getOrCreateInstance(drawerEl);
            const titleEl = (dr.element as HTMLElement).querySelector<HTMLElement>('.drawer-title');
            if (titleEl) titleEl.innerText = `Estatísticas do conteúdo “${item.title}”`;
            dr.show();
        };
    if (loading) return <div>Carregando conteúdos...</div>;
    if (error) return <div>Erro ao carregar conteúdos.</div>;

    return (
        <div className="card card-flush h-lg-100">
            <div className="card-header py-5 d-flex justify-content-between align-items-center">
                <h3>{channelName ?? 'Conteúdos'}</h3>
                <div>
                    {channelName && (
                        <>
                            <button className="btn btn-sm btn-light me-2" onClick={onEditChannel}>
                                <i className="bi bi-gear"></i>
                            </button>
                            <button className="btn btn-primary btn-sm" onClick={onCreatePost}>
                                Criar post
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="card-body py-3">
                {sortedItems.length === 0 ? (
                    <div className="text-center text-muted">Nenhum conteúdo encontrado.</div>
                ) : (
                    <table className="table table-row-dashed gy-5 align-middle fw-semibold">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        ref={headerRef}
                                        type="checkbox"
                                        checked={
                                            sortedItems.length > 0 && sortedItems.every(i => selectedIds.includes(i.id))
                                        }
                                        onChange={e => sortedItems.forEach(i => onSelect(i.id, e.target.checked))}
                                    />
                                </th>
                                <th>Thumb</th>
                                <th>Título</th>
                                <th>Status</th>
                                <th>Stats</th>
                                <th>Atualizado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map(item => {
                                const isChecked = selectedIds.includes(item.id);
                                const thumbUrl = item.highlightImages?.[0] || DEFAULT_THUMB;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => onSelect(item.id, e.target.checked)}
                                            />
                                        </td>
                                        <td>
                                            <img
                                                src={thumbUrl}
                                                alt="thumb"
                                                className="rounded"
                                                style={{ width: 120, height: 80, objectFit: 'cover' }}
                                            />
                                        </td>
                                        <td>{item.title}</td>
                                        <td>{item.isPublished ? 'Publicado' : 'Rascunho'}</td>
                                        <td>
                                            <button
                                                className="btn btn-icon btn-sm"
                                                onClick={() => openStats(item)}
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
                                                    id={`dropdown-${item.id}`}
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                >
                                                    <i className="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`dropdown-${item.id}`}>
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
                                                        <button className="dropdown-item text-danger" onClick={() => onDelete(item.id)}>
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
