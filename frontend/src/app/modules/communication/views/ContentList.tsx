import React, { useEffect, useRef } from 'react';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
import { News as Content } from '@shared/types';
import clsx from 'clsx';
import { toAbsoluteUrl } from 'src/helpers';

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
    onDeleteMultiple(): void;
    onDuplicateMultiple(): void;
    onTogglePublishMultiple(): void;
}

const DEFAULT_THUMB = '../media/stock/1600x800/img-1.jpg';

const Spinner = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
        </div>
    </div>
);

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
    onDeleteMultiple,
    onDuplicateMultiple,
    onTogglePublishMultiple,
}) => {
    const headerRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        MenuComponent.reinitialization();
    }, [items]);

    const sorted = [...items].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const selectedItems = sorted.filter(i => selectedIds.includes(i.id));
    const allPublished = selectedItems.every(i => i.isPublished);
    const allDraft = selectedItems.every(i => !i.isPublished);

    const openStats = (item: Content) => {
        const drawerEl = document.getElementById('kt_stats_drawer');
        if (!drawerEl) return;
        const dr = (DrawerComponent as any).getOrCreateInstance(drawerEl);
        const titleEl = dr.element.querySelector('.drawer-title') as HTMLElement;
        if (titleEl) titleEl.innerText = `Estatísticas: ${item.title}`;
        dr.show();
    };

    if (loading) return <Spinner />;
    if (error) return <div className="text-danger p-5">Erro ao carregar conteúdos.</div>;

    return (
        <div className="card card-flush h-lg-100">
            <div className="card-header py-5 d-flex justify-content-between align-items-center">
                <h3>{channelName ?? 'Conteúdos'}</h3>
                <div className="d-flex align-items-center">
                    {selectedIds.length > 0 && (
                        <div className="me-3">
                            <button className="btn btn-sm btn-light me-2" onClick={onDuplicateMultiple}>
                                <i className="bi bi-files"></i>
                            </button>
                            {(allPublished || allDraft) && (
                                <button className="btn btn-sm btn-light me-2" onClick={onTogglePublishMultiple}>
                                    <i className={`bi ${allPublished ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                                </button>
                            )}
                            <button className="btn btn-sm btn-danger me-2" onClick={onDeleteMultiple}>
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    )}
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
                {sorted.length === 0 ? (
                    <div className="text-center">
                        <img
                            src={toAbsoluteUrl('../media/illustrations/sigma-1/20-dark.png')}
                            alt="Sem conteúdos"
                            className="mw-100 mb-4"
                            style={{ maxHeight: 200 }}
                        />
                        <div className="text-muted">Nenhum conteúdo encontrado neste canal.</div>
                    </div>
                ) : (
                    <table className="table table-row-dashed gy-5 align-middle fw-semibold">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        ref={headerRef}
                                        type="checkbox"
                                        checked={sorted.length > 0 && sorted.every(i => selectedIds.includes(i.id))}
                                        onChange={e => sorted.forEach(i => onSelect(i.id, e.target.checked))}
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
                            {sorted.map(item => {
                                const isChecked = selectedIds.includes(item.id);
                                const thumb = item.highlightImages?.[0] || DEFAULT_THUMB;
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
                                                src={thumb}
                                                alt="thumb"
                                                className="rounded"
                                                style={{ width: 120, height: 80, objectFit: 'cover' }}
                                            />
                                        </td>
                                        <td>{item.title}</td>
                                        <td>{item.isPublished ? 'Publicado' : 'Rascunho'}</td>
                                        <td>
                                            <button className="btn btn-icon btn-sm" onClick={() => openStats(item)}>
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
                                                <ul
                                                    className="dropdown-menu dropdown-menu-end"
                                                    aria-labelledby={`dropdown-${item.id}`}
                                                >
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