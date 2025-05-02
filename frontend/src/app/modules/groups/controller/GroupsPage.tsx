import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from 'src/app/modules/auth';
import { AsideDefault } from 'src/layout/components/aside/AsideDefault';
import { Content } from 'src/layout/components/Content';
import { Modal } from 'bootstrap';
import { DrawerComponent, MenuComponent } from 'src/assets/ts/components';
import GroupList from '../views/GroupList';
import GroupForm from '../views/GroupForm';
import BulkActionsBar from '../views/BulkActionsBar';
import MembersList from '../views/MembersList';
import AddMembersModal from '../views/AddMembersModal';
import { CreateGroupDto, UpdateGroupDto, UserGroup, UserGroupType, User } from '@shared/types';

import { GroupsService } from '../services/groups.service';
import { useGroups } from '../provider/useGroups';
import { useGroupActions } from '../provider/useGroupActions';
import { useGroupMembers } from '../provider/useGroupMembers';

const GroupsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const companyId = currentUser!.companyId;

  const { groups, loading, error, refetch } = useGroups({ companyId });
  const { createGroup, updateGroup, removeGroup, duplicateGroup } = useGroupActions({ onDone: refetch });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const formRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);
  const [formModal, setFormModal] = useState<Modal | null>(null);
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null);

  const [editing, setEditing] = useState<UserGroup | null>(null);
  const [initialValues, setInitialValues] = useState<CreateGroupDto>({
    companyId, name: '', identifier: '', type: UserGroupType.INTERNAL,
    conditions: [], adminIds: []
  });
  const [toDelete, setToDelete] = useState<string[]>([]);

  const { members, loading: mLoading, error: mError, refetch: refetchMembers } =
    useGroupMembers(editing?.id ?? null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (formRef.current) setFormModal(new Modal(formRef.current));
    if (deleteRef.current) setDeleteModal(new Modal(deleteRef.current));
    DrawerComponent.bootstrap();
    MenuComponent.reinitialization();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setInitialValues({
      companyId, name: '', identifier: '', type: UserGroupType.INTERNAL,
      conditions: [], adminIds: []
    });
    setShowAddModal(false);
    formModal!.show();
  };

  const openEdit = async (g: UserGroup) => {
    setEditing(g);
    setInitialValues({
      companyId: g.companyId,
      name: g.name,
      identifier: g.identifier || '',
      type: g.type,
      conditions: [...g.conditions],
      adminIds: [...g.adminIds],
    });
    await refetchMembers();
    formModal!.show();
  };

  const handleSave = async (dto: CreateGroupDto | UpdateGroupDto) => {
    if (editing) await updateGroup(editing.id, dto as UpdateGroupDto);
    else await createGroup(dto as CreateGroupDto);
    formModal!.hide();
    setSelectedIds([]);
  };

  const openDelete = (ids: string[]) => { setToDelete(ids); deleteModal!.show(); };
  const handleConfirmDelete = async () => {
    await Promise.all(toDelete.map(id => removeGroup(id)));
    deleteModal!.hide();
    setSelectedIds([]);
  };

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <AsideDefault />
        <Content>
          <div className="d-flex justify-content-between align-items-center mb-6">
            <h2 className="fw-bold">Grupos de Usuário</h2>
            <button className="btn btn-primary" onClick={openCreate}>Criar Grupo</button>
          </div>

          {selectedIds.length > 0 && (
            <BulkActionsBar
              count={selectedIds.length}
              onAction={act =>
                act === 'delete'
                  ? openDelete(selectedIds)
                  : selectedIds.forEach(id => duplicateGroup(id))
              }
            />
          )}

          <GroupList
            groups={groups}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelect={(id, chk) =>
              setSelectedIds(chk
                ? [...selectedIds, id]
                : selectedIds.filter(x => x !== id)
              )
            }
            onEdit={openEdit}
            onDelete={id => openDelete([id])}
            onDuplicate={g => duplicateGroup(g.id)}
          />

          {/* ——— Modal de Create/Edit ——— */}
          <div className="modal fade modal-lg" tabIndex={-1} ref={formRef}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <GroupForm
                  initialValues={initialValues}
                  editing={!!editing}
                  onSave={handleSave}
                  onCancel={() => formModal!.hide()}
                  allUsers={[]}    // opcional, pode buscar no hook useUsers
                  members={members}
                  onAddMembers={ids => {
                    // IDs enviados ao Create/Edit não tocam DTO
                  }}
                  onRemoveMember={id => { /* não usado aqui */ }}
                />

                {editing && (
                  <>
                    <hr className="mt-0" />
                    <div className="p-4">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mb-3"
                        onClick={() => setShowAddModal(true)}
                      >
                        + Adicionar Membros
                      </button>
                      <MembersList
                        members={members}
                        loading={mLoading}
                        error={mError}
                        onRemove={async u => {
                          await GroupsService.removeMember(editing.id, u);
                          refetchMembers();
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ——— AddMembersModal ——— */}
          <AddMembersModal
            groupId={editing?.id!}
            show={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdded={() => refetchMembers()}
          />

          {/* ——— Modal de Delete ——— */}
          <div className="modal fade" tabIndex={-1} ref={deleteRef} id="kt_modal_delete">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Confirmação de exclusão</h3>
                  <div
                    className="btn btn-icon btn-sm btn-active-light-primary ms-2"
                    data-bs-dismiss="modal"
                  >
                    <i className="bi bi-x fs-2"></i>
                  </div>
                </div>
                <div className="modal-body">
                  <p>
                    Deseja excluir{' '}
                    {toDelete.length > 1
                      ? `${toDelete.length} grupos`
                      : 'este grupo'}
                    ?
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light"
                    data-bs-dismiss="modal"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmDelete}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>

        </Content>
      </div>
    </div>
  );
};

export default GroupsPage;