import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';
import { User } from '@shared/types';
import { UsersService } from 'src/app/modules/users/services/users.service';
import { GroupsService } from '../services/groups.service';
import { useAuth } from 'src/app/modules/auth';

interface Props {
  groupId: string;
  show: boolean;
  onClose(): void;
  onAdded(): void;
}

const AddMembersModal: React.FC<Props> = ({ groupId, show, onClose, onAdded }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (ref.current) {
      const m = new Modal(ref.current, { backdrop: 'static' });
      setModal(m);
    }
  }, []);

  useEffect(() => {
    if (!modal) return;
    show ? modal.show() : modal.hide();
  }, [show, modal]);

  useEffect(() => {
    if (!currentUser) return;
    UsersService.list(currentUser.companyId).then(setAllUsers);
  }, [currentUser]);

  const handleAdd = async () => {
    await Promise.all(selectedIds.map(u => GroupsService.addMember(groupId, u)));
    onAdded(); onClose();
  };

  return (
    <div className="modal fade" tabIndex={-1} ref={ref}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Adicionar Membros</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label className="form-label">Selecione os usuários:</label>
            <select
              multiple
              className="form-select"
              value={selectedIds}
              style={{ minHeight: 200 }}
              onChange={e => {
                const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                setSelectedIds(opts);
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
            <button type="button" className="btn btn-light" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedIds.length}
              onClick={handleAdd}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;