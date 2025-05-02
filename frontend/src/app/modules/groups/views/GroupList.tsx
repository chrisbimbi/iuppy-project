// frontend/src/app/modules/groups/views/GroupList.tsx
import React, { useEffect, useRef } from 'react'
import { UserGroup } from '@shared/types'
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components'
interface Props {
  groups: UserGroup[];
  loading: boolean;
  error: any;
  selectedIds: string[];
  onSelect: (id: string, chk: boolean) => void;
  onEdit: (g: UserGroup) => void;
  onDelete: (id: string) => void;
  onDuplicate: (g: UserGroup) => void;
}

const Spinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Carregando…</span>
    </div>
  </div>
);

const GroupList: React.FC<Props> = ({
  groups, loading, error, selectedIds, onSelect, onEdit, onDelete, onDuplicate
}) => {
  const hdrRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    MenuComponent.reinitialization();
    DrawerComponent.reinitialization();
  }, [groups]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-danger p-5">Erro ao carregar.</div>;

  const sorted = [...groups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const all = sorted.length > 0 && sorted.every(g => selectedIds.includes(g.id));

  return (
    <div className="card card-flush">
      <div className="card-body py-3">
        <table className="table table-row-dashed gy-5 align-middle fw-semibold">
          <thead><tr>
            <th><input ref={hdrRef} type="checkbox" checked={all}
              onChange={e => sorted.forEach(g => onSelect(g.id, e.target.checked))} />
            </th>
            <th>Nome</th><th>Tipo</th><th>Criado em</th><th>Ações</th>
          </tr></thead>
          <tbody>
            {sorted.map(g => (
              <tr key={g.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.includes(g.id)}
                    onChange={e => onSelect(g.id, e.target.checked)} />
                </td>
                <td>{g.name}</td>
                <td>{g.type}</td>
                <td>{new Date(g.createdAt).toLocaleString()}</td>
                <td>
                  <div className="dropdown">
                    <button className="btn btn-icon" data-bs-toggle="dropdown">
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><button className="dropdown-item" onClick={() => onEdit(g)}>
                        <i className="bi bi-pencil me-2" />Editar
                      </button></li>
                      <li><button className="dropdown-item" onClick={() => onDuplicate(g)}>
                        <i className="bi bi-files me-2" />Duplicar
                      </button></li>
                      <li><button className="dropdown-item text-danger" onClick={() => onDelete(g.id)}>
                        <i className="bi bi-trash me-2" />Apagar
                      </button></li>
                    </ul>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupList;