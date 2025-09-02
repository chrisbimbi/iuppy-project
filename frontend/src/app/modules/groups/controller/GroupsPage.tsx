import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useAuth } from 'src/app/modules/auth'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { Modal } from 'bootstrap'
import GroupList from '../views/GroupList'
import GroupForm from '../views/GroupForm'
import BulkActionsBar from '../views/BulkActionsBar'
import MembersList from '../views/MembersList'
import UserPickerModal from '../views/UserPickerModal'
import {
  CreateGroupDto,
  Role,
  UpdateGroupDto,
  UserGroup,
  UserGroupType,
  User,
} from '@shared/types'
import { useUsers } from '../provider/useUsers'
import { useGroups } from '../provider/useGroups'
import { useGroupActions } from '../provider/useGroupActions'
import { useGroupMembers } from '../provider/useGroupMembers'

// ⬇️ capabilities
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'
import { WithCapability } from 'src/app/modules/company/components/WithCapability'

const GroupsPage: React.FC = () => {
  const { currentUser } = useAuth()
  const companyId = currentUser!.companyId
  const { can } = useAccess()

  // hooks de dados
  const { users: allUsers } = useUsers(companyId)
  const { groups, loading, error, refetch } = useGroups({ companyId })

  // estado de edição
  const [editing, setEditing] = useState<UserGroup | null>(null)

  // membros do grupo em edição
  const {
    members,
    loading: mLoading,
    error: mError,
    refetch: refetchMembers,
  } = useGroupMembers(editing?.id ?? null)

  // ações de CRUD + membros
  const {
    createGroup,
    updateGroup,
    removeGroup,
    duplicateGroup,
    addMember,
    removeMember,
  } = useGroupActions({
    onDone: () => {
      refetch()
      if (editing) refetchMembers()
    },
  })

  // seleção em massa
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // refs e instâncias Bootstrap
  const formRef = useRef<HTMLDivElement>(null)
  const deleteRef = useRef<HTMLDivElement>(null)
  const [formModal, setFormModal] = useState<Modal | null>(null)
  const [deleteModal, setDeleteModal] = useState<Modal | null>(null)
  const [toDelete, setToDelete] = useState<string[]>([])

  // valores iniciais do form
  const [initialValues, setInitialValues] = useState<CreateGroupDto>({
    companyId,
    name: '',
    identifier: '',
    type: UserGroupType.INTERNAL,
    conditions: [],
    adminIds: [],
  })

  // durante criação, guardamos IDs de membros selecionados
  const [creationMemberIds, setCreationMemberIds] = useState<string[]>([])

  // mostrar/ocultar pickers
  const [showAdminPicker, setShowAdminPicker] = useState(false)
  const [showMemberPicker, setShowMemberPicker] = useState(false)

  // inicializa os modais uma única vez
  useEffect(() => {
    if (formRef.current) setFormModal(Modal.getOrCreateInstance(formRef.current))
    if (deleteRef.current) setDeleteModal(Modal.getOrCreateInstance(deleteRef.current))
  }, [])

  // abre modal de criação
  const openCreate = () => {
    if (!can('edit', 'groups')) {
      alert('Você não tem permissão para criar grupos.')
      return
    }
    setEditing(null)
    setInitialValues({
      companyId,
      name: '',
      identifier: '',
      type: UserGroupType.INTERNAL,
      conditions: [],
      adminIds: [],
    })
    setCreationMemberIds([])
    Modal.getOrCreateInstance(formRef.current!).show()
  }

  // abre modal de edição
  const openEdit = async (g: UserGroup) => {
    if (!can('edit', 'groups')) {
      alert('Você não tem permissão para editar grupos.')
      return
    }
    setEditing(g)
    setInitialValues({
      companyId: g.companyId,
      name: g.name,
      identifier: g.identifier || '',
      type: g.type,
      conditions: [...g.conditions],
      adminIds: [...g.adminIds],
    })
    await refetchMembers()
    Modal.getOrCreateInstance(formRef.current!).show()
  }

  const handleSave = async (
    dto: CreateGroupDto | UpdateGroupDto
  ): Promise<void> => {
    if (!can('edit', 'groups')) {
      alert('Você não tem permissão para salvar alterações em grupos.')
      return
    }

    const dtoWithAdmins = {
      ...dto,
      adminIds: initialValues.adminIds,
    };

    if (editing) {
      await updateGroup(editing.id, dtoWithAdmins as UpdateGroupDto);
    } else {
      const newGroup = await createGroup(dtoWithAdmins as CreateGroupDto);
      for (const userId of creationMemberIds) {
        await addMember(newGroup.id, userId);
      }
    }

    refetch()
    Modal.getOrCreateInstance(formRef.current!).hide()
    setSelectedIds([])
  }

  // abre modal de delete
  const openDelete = (ids: string[]) => {
    if (!can('edit', 'groups')) {
      alert('Você não tem permissão para excluir grupos.')
      return
    }
    setToDelete(ids)
    Modal.getOrCreateInstance(deleteRef.current!).show()
  }
  const handleConfirmDelete = async () => {
    await Promise.all(toDelete.map(id => removeGroup(id)))
    Modal.getOrCreateInstance(deleteRef.current!).hide()
    setSelectedIds([])
  }

  // mapa de quantos membros cada grupo tem
  const membersCount = groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = g.members?.length ?? 0
    return acc
  }, {})

  // mapa de quantos admins cada grupo tem
  const adminsCount = groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.id] = g.adminIds?.length ?? 0
    return acc
  }, {})

  // selecionados completos
  const selectedAdmins: User[] = initialValues.adminIds
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is User => !!u)

  const selectedCreationMembers: User[] = creationMemberIds
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is User => !!u)

  return (
    <div className="app-container container-xxl">
      <div className="app-page" id="kt_app_page">
        <AsideDefault />
        <Content>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-6">
            <h2 className="fw-bold">Grupos de Usuário</h2>

            <WithCapability action="edit" moduleKey="groups">
              {(enabled) => (
                <button className="btn btn-primary" onClick={openCreate} disabled={!enabled}>
                  Criar Grupo
                </button>
              )}
            </WithCapability>
          </div>

          {/* Bulk Actions */}
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

          {/* Lista de Grupos */}
          <GroupList
            groups={groups}
            membersCount={membersCount}
            adminsCount={adminsCount}
            loading={loading}
            error={error}
            selectedIds={selectedIds}
            onSelect={(id, chk) =>
              setSelectedIds(prev =>
                chk ? [...prev, id] : prev.filter(x => x !== id)
              )
            }
            onEdit={openEdit}
            onDelete={id => openDelete([id])}
            onDuplicate={g => duplicateGroup(g.id)}
          />

          {/* Modal Create / Edit */}
          <div className="modal fade modal-lg" tabIndex={-1} ref={formRef}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <GroupForm
                  key={editing?.id ?? 'new'}
                  initialValues={initialValues}
                  editing={!!editing}
                  onSave={handleSave}
                  onCancel={() => Modal.getOrCreateInstance(formRef.current!).hide()}
                />

                <hr />
                <div className="p-4">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mb-3 me-3"
                    onClick={() => setShowAdminPicker(true)}
                  >
                    + Administradores
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary mb-3"
                    onClick={() => setShowMemberPicker(true)}
                  >
                    + Membros
                  </button>

                  {selectedAdmins.length > 0 && (
                    <div className="mb-4">
                      <div className="fw-semibold mb-2">
                        Administradores Selecionados
                      </div>
                      <MembersList
                        members={selectedAdmins}
                        loading={false}
                        error={null}
                        onRemove={id =>
                          setInitialValues(iv => ({
                            ...iv,
                            adminIds: iv.adminIds.filter(x => x !== id),
                          }))
                        }
                      />
                    </div>
                  )}

                  {(editing ? members : selectedCreationMembers).length > 0 && (
                    <div className="mb-4">
                      <div className="fw-semibold mb-2">Membros Selecionados</div>
                      <MembersList
                        members={editing ? members : selectedCreationMembers}
                        loading={mLoading && Boolean(editing)}
                        error={mError && Boolean(editing) ? mError : null}
                        onRemove={async id => {
                          if (editing) {
                            await removeMember(editing.id, id)
                            refetchMembers()
                          } else {
                            setCreationMemberIds(curr => curr.filter(x => x !== id))
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Picker de Administradores */}
          <UserPickerModal
            title="Selecione Administradores"
            show={showAdminPicker}
            allUsers={allUsers.filter(u => u.role === Role.HRAdmin)}
            selected={initialValues.adminIds}
            onClose={() => setShowAdminPicker(false)}
            onConfirm={ids => {
              setInitialValues(iv => ({ ...iv, adminIds: ids }))
              setShowAdminPicker(false)
            }}
          />

          {/* Picker de Membros */}
          <UserPickerModal
            title="Selecione Membros"
            show={showMemberPicker}
            allUsers={allUsers}
            selected={editing ? members.map(m => m.id) : creationMemberIds}
            onClose={() => setShowMemberPicker(false)}
            onConfirm={async ids => {
              if (editing) {
                const toAdd = ids.filter(i => !members.some(m => m.id === i))
                for (const u of toAdd) await addMember(editing.id, u)
                const toRemove = members.map(m => m.id).filter(i => !ids.includes(i))
                for (const u of toRemove) await removeMember(editing.id, u)
                refetchMembers()
              } else {
                setCreationMemberIds(ids)
              }
              setShowMemberPicker(false)
            }}
          />

          {/* Modal de Delete */}
          <div className="modal fade" tabIndex={-1} ref={deleteRef}>
            <div className="modal-dialog">
              <div className="modal-content p-4">
                <div className="modal-header">
                  <h3 className="modal-title">Confirmação de exclusão</h3>
                  <button
                    type="button"
                    className="btn btn-icon btn-sm btn-active-light-primary ms-2"
                    onClick={() => Modal.getOrCreateInstance(deleteRef.current!).hide()}
                  >
                    <i className="bi bi-x fs-2"></i>
                  </button>
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
                    onClick={() => Modal.getOrCreateInstance(deleteRef.current!).hide()}
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
  )
}

export default GroupsPage