import React, { useState, useEffect, useMemo } from 'react'
import { useIntl } from 'react-intl'
import { Modal } from 'bootstrap'
import { spacesService } from '../services/spaces.service'
import { useSpaceActions } from '../provider/useSpaceActions'
import { useGroups } from '../../groups/provider/useGroups'
import { useUsers } from '../../groups/provider/useUsers'

interface Props {
    show: boolean
    onHide: () => void
    spaceId?: string
    companyId: string
    onSave: () => void
}

const SpaceModal: React.FC<Props> = ({ show, onHide, spaceId, companyId, onSave }) => {
    const intl = useIntl()
    const { createSpace, updateSpace, loading } = useSpaceActions()
    const { groups } = useGroups({ companyId })
    const { users } = useUsers(companyId)

    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [description, setDescription] = useState('')
    const [active, setActive] = useState(true)
    const [priority, setPriority] = useState(0)
    const [selectedGroups, setSelectedGroups] = useState<string[]>([])
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Feedback
    const [error, setError] = useState<string | null>(null)

    // Reset or Load on Show
    useEffect(() => {
        if (!show) return
        setError(null)
        if (spaceId) {
            spacesService.get(spaceId).then(s => {
                setName(s.name)
                setSlug(s.slug)
                setDescription(s.description || '')
                setActive(!!s.active)
                setPriority(s.priority || 0)
                setSelectedGroups(s.targetGroupIds || [])
                // IMPORTANT: We need memberIds. If get() doesn't return it, we might need a separate call or update service
                // Assuming update in backend returns relations if requested.
                // But list/get might not include userSpaces by default in DTO?
                // Step 117: findOne returns with relations=['userSpaces'].
                // But SpaceEntity has userSpaces array of entities. Serializer?
                // If API returns entity, it has userSpaces: [{ userId: '...' }].
                // We need to map that.
                // For now, I'll assume we might need to fetch members separately strictly speaking,
                // but let's check if 's' has memberIds or userSpaces.
                // I'll try to map from s.userSpaces if present.
                const mems = s.userSpaces?.map(us => us.userId) || []
                setSelectedMembers(mems)
            }).catch(err => setError('Error loading space'))
        } else {
            setName('')
            setSlug('')
            setDescription('')
            setActive(true)
            setPriority(0)
            setSelectedGroups([])
            setSelectedMembers([])
        }
    }, [show, spaceId])


    const handleSubmit = async () => {
        if (!name || !slug) {
            setError('Name and Slug are required')
            return
        }

        const payload = {
            companyId,
            name,
            slug,
            description,
            active,
            priority,
            targetGroupIds: selectedGroups,
            memberIds: selectedMembers
        }

        try {
            if (spaceId) {
                await updateSpace(spaceId, payload)
            } else {
                await createSpace(payload)
            }
            onSave()
            onHide()
        } catch (e: any) {
            setError(e.message || 'Error saving space')
        }
    }

    // Auto-slug
    useEffect(() => {
        if (!spaceId && name) {
            setSlug(name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''))
        }
    }, [name, spaceId])

    return (
        <div className={`modal fade${show ? ' show' : ''}`} style={{ display: show ? 'block' : 'none' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{spaceId ? 'Edit Space' : 'New Space'}</h5>
                        <button className="btn-close" onClick={onHide} />
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="mb-3">
                            <label className="form-label">Name</label>
                            <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Slug</label>
                            <input className="form-control" value={slug} onChange={e => setSlug(e.target.value)} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Priority</label>
                                <input type="number" className="form-control" value={priority} onChange={e => setPriority(Number(e.target.value))} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-check-label d-block">&nbsp;</label>
                                <div className="form-check form-switch">
                                    <input className="form-check-input" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                                    <label className="form-check-label">Active</label>
                                </div>
                            </div>
                        </div>

                        <hr />
                        <h6>Audience & Segmentation</h6>
                        <p className="text-muted small">If no groups and no members are selected, this Space will be visible to everyone.</p>

                        <div className="mb-3">
                            <label className="form-label">Target Groups</label>
                            <select multiple className="form-select" style={{ height: '150px' }} value={selectedGroups} onChange={e => setSelectedGroups(Array.from(e.target.selectedOptions, o => o.value))}>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <div className="form-text">Hold Ctrl/Cmd to select multiple.</div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Direct Members</label>
                            <select multiple className="form-select" style={{ height: '150px' }} value={selectedMembers} onChange={e => setSelectedMembers(Array.from(e.target.selectedOptions, o => o.value))}>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                            </select>
                            <div className="form-text">Hold Ctrl/Cmd to select multiple.</div>
                        </div>

                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onHide}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
            {show && <div className="modal-backdrop fade show"></div>}
        </div>
    )
}

export default SpaceModal;
