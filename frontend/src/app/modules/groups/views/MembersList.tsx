import React from 'react';
import { User } from '@shared/types';

interface Props {
  members: User[];
  loading: boolean;
  error: any;
  onRemove(userId: string): void;
}

const MembersList: React.FC<Props> = ({ members, loading, error, onRemove }) => {
  if (loading) return <div className="py-4 text-center">Carregando…</div>;
  if (error)   return <div className="text-danger p-4">Erro ao carregar membros.</div>;
  if (!members.length) return <div className="p-4 text-muted">Nenhum membro</div>;

  return (
    <div className="d-flex flex-wrap gap-3">
      {members.map(u => (
        <div key={u.id} className="position-relative text-center">
          <img src={u.avatarUrl} className="rounded-circle" width={48} height={48} />
          <button
            className="btn btn-sm btn-icon btn-light position-absolute top-0 end-0"
            onClick={() => onRemove(u.id)}
          >
            <i className="bi bi-x-circle-fill text-danger"></i>
          </button>
          <div className="small mt-1">{u.name}</div>
        </div>
      ))}
    </div>
  );
};

export default MembersList;