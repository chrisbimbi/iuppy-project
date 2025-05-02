// frontend/src/app/modules/groups/providers/useGroupActions.ts
import { useCallback } from 'react'
import { GroupsService } from '../services/groups.service'
import {
  CreateGroupDto,
  UpdateGroupDto,
  User,
  UserGroup,
} from '@shared/types'

interface UseGroupActionsProps {
  onDone?: () => void
  onError?: (msg: string) => void
}

export const useGroupActions = ({
  onDone,
  onError,
}: UseGroupActionsProps = {}) => {
  const createGroup = useCallback(
    async (dto: CreateGroupDto): Promise<UserGroup> => {
      try {
        const g = await GroupsService.create(dto)
        onDone?.()
        return g
      } catch (err: any) {
        onError?.(err.message)
        throw err
      }
    },
    [onDone, onError]
  )

  const updateGroup = useCallback(
    async (id: string, dto: UpdateGroupDto): Promise<UserGroup> => {
      try {
        const g = await GroupsService.update(id, dto)
        onDone?.()
        return g
      } catch (err: any) {
        onError?.(err.message)
        throw err
      }
    },
    [onDone, onError]
  )

  const removeGroup = useCallback(
    async (id: string): Promise<void> => {
      try {
        await GroupsService.remove(id)
        onDone?.()
      } catch (err: any) {
        onError?.(err.message)
        throw err
      }
    },
    [onDone, onError]
  )

  const duplicateGroup = useCallback(
    async (id: string): Promise<void> => {
      try {
        const original: UserGroup = await GroupsService.get(id)
        const dto: CreateGroupDto = {
          companyId: original.companyId,
          name: original.name + ' (Cópia)',
          identifier: original.identifier
            ? original.identifier + '-copy'
            : undefined,
          type: original.type,
          conditions: [...original.conditions],
          adminIds: [...original.adminIds],
        }
        await GroupsService.create(dto)
        onDone?.()
      } catch (err: any) {
        onError?.(err.message)
        throw err
      }
    },
    [onDone, onError]
  )

  const listMembers = useCallback(
    async (groupId: string): Promise<User[]> => {
      return GroupsService.listMembers(groupId)
    },
    []
  )

  const addMember = useCallback(
    async (groupId: string, userId: string): Promise<void> => {
      return GroupsService.addMember(groupId, userId)
    },
    []
  )

  const removeMember = useCallback(
    async (groupId: string, userId: string): Promise<void> => {
      return GroupsService.removeMember(groupId, userId)
    },
    []
  )

  return {
    createGroup,
    updateGroup,
    removeGroup,
    duplicateGroup,
    listMembers,
    addMember,
    removeMember,
  }
}