import React, { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { debounce } from 'lodash'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface SearchUser {
    id: string
    name: string
    email: string
    avatarUrl?: string
    xp: number
    level: number
}

interface UserSearchAutocompleteProps {
    selectedUserIds: string[]
    onToggleUser: (id: string) => void
}

export const UserSearchAutocomplete: React.FC<UserSearchAutocompleteProps> = ({
    selectedUserIds,
    onToggleUser,
}) => {
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    const debouncedSearch = useCallback(
        debounce((value: string) => {
            setDebouncedQuery(value)
        }, 300),
        []
    )

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)
        debouncedSearch(value)
    }

    const { data: searchResults, isLoading } = useQuery<SearchUser[]>({
        queryKey: ['user-search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) return []
            const res = await axios.get(`${API_URL}/gamification/users/search?q=${debouncedQuery}`)
            return res.data
        },
        enabled: debouncedQuery.length >= 2,
    })

    return (
        <div>
            <input
                type="text"
                className="form-control form-control-solid mb-3"
                placeholder="Digite o nome ou email do usuário..."
                value={query}
                onChange={handleSearchChange}
            />

            {isLoading && <div className="text-muted fs-7">Buscando...</div>}

            {searchResults && searchResults.length > 0 && (
                <div className="border p-4 rounded max-h-300px overflow-auto">
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            className="d-flex align-items-center justify-content-between mb-3 cursor-pointer hover-bg-light p-2 rounded"
                            onClick={() => onToggleUser(user.id)}
                        >
                            <div className="d-flex align-items-center">
                                <input
                                    type="checkbox"
                                    className="form-check-input me-3"
                                    checked={selectedUserIds.includes(user.id)}
                                    readOnly
                                />
                                {user.avatarUrl && (
                                    <div className="symbol symbol-35px me-3">
                                        <img src={user.avatarUrl} alt={user.name} />
                                    </div>
                                )}
                                <div>
                                    <div className="fw-bold text-dark">{user.name}</div>
                                    <div className="text-muted fs-7">{user.email}</div>
                                </div>
                            </div>
                            <div className="text-end">
                                <div className="fs-7 text-muted">{user.xp} XP</div>
                                <div className="badge badge-light-success fs-8">Nível {user.level}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {query.length > 0 && !isLoading && (!searchResults || searchResults.length === 0) && (
                <div className="text-muted fs-7">Nenhum usuário encontrado</div>
            )}
        </div>
    )
}
