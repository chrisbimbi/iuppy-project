import { useMemo } from 'react'
import type { ModuleKey } from '@shared/types'
import { useAccess } from '../../providers/AccessProvider';

type Action = 'view' | 'edit' | 'manage'
type SpaceLite = { id: string; name: string }

export function useAllowedSpaces(moduleKey: ModuleKey, action: Action, spaces: SpaceLite[]) {
    const { can } = useAccess()
    return useMemo(
        () => spaces.filter(s => can(action, moduleKey, s.id) || can(action, moduleKey)),
        [spaces, can, moduleKey, action]
    )
}

export function canActOnAnySpace(
    can: (a: Action, m: ModuleKey, sid?: string) => boolean,
    action: Action,
    moduleKey: ModuleKey,
    spaceIds?: string[]
) {
    if (can(action, moduleKey)) return true // ALL_SPACES
    if (!spaceIds?.length) return false
    return spaceIds.some(id => can(action, moduleKey, id))
}