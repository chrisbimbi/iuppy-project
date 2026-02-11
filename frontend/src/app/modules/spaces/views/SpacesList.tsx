import React, { useState } from 'react'
import { useSpaces } from '../hooks/useSpaces'
import SpaceModal from '../components/SpaceModal'
import { useSpaceActions } from '../provider/useSpaceActions'
import { KTIcon } from 'src/helpers'
import { useIntl } from 'react-intl'

interface Props {
    companyId: string
}


export const SpacesList: React.FC<Props> = ({ companyId }) => {
    const { data: spaces, loading, error: listError, refetch } = useSpaces(companyId)

    const [showModal, setShowModal] = useState(false)
    const [editId, setEditId] = useState<string | undefined>(undefined)
    const { deleteSpace } = useSpaceActions()

    const handleEdit = (id: string) => {
        setEditId(id)
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this space?')) {
            try {
                await deleteSpace(id)
                refetch()
            } catch (e: any) {
                alert(e.message || 'Error deleting space')
            }
        }
    }

    const handleCreate = () => {
        setEditId(undefined)
        setShowModal(true)
    }

    const handleSave = () => {
        refetch()
    }

    if (loading) return <div>Loading...</div>
    // if (listError) return <div>Error loading spaces</div>

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3>Spaces</h3>
                </div>
                <div className="card-toolbar">
                    <button className="btn btn-primary" onClick={handleCreate}>
                        <KTIcon iconName="plus" className="fs-2" />
                        New Space
                    </button>
                </div>
            </div>
            <div className="card-body py-4">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                <th>Name</th>
                                <th>Slug</th>
                                <th>Priority</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {spaces.map(space => (
                                <tr key={space.id}>
                                    <td>{space.name}</td>
                                    <td>{space.slug}</td>
                                    <td>{space.priority}</td>
                                    <td>
                                        <span className={`badge badge-light-${space.active ? 'success' : 'danger'}`}>
                                            {space.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1" onClick={() => handleEdit(space.id)}>
                                            <KTIcon iconName="pencil" className="fs-3" />
                                        </button>
                                        <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm" onClick={() => handleDelete(space.id)}>
                                            <KTIcon iconName="trash" className="fs-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <SpaceModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSave={handleSave}
                companyId={companyId}
                spaceId={editId}
            />
        </div>
    )
}
