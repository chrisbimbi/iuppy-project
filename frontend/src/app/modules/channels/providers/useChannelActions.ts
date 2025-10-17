import { useCallback } from 'react'
import { ChannelsService } from '../services/channels.service'
import { Channel } from '@shared/types/Channel'

interface Props {
    onDone?: () => void
    onError?: (msg: string) => void
}

export const useChannelActions = ({ onDone, onError }: Props = {}) => {
    const createChannel = useCallback(
        async (dto: Partial<Channel>): Promise<Channel> => {
            try {
                const c = await ChannelsService.createChannel(dto)
                onDone?.()
                return c
            } catch (err: any) {
                onError?.(err.message)
                throw err
            }
        },
        [onDone, onError]
    )

    const updateChannel = useCallback(
        async (id: string, dto: Partial<Channel>): Promise<Channel> => {
            try {
                const c = await ChannelsService.updateChannel(id, dto)
                onDone?.()
                return c
            } catch (err: any) {
                onError?.(err.message)
                throw err
            }
        },
        [onDone, onError]
    )

    const removeChannel = useCallback(
        async (id: string): Promise<void> => {
            try {
                await ChannelsService.deleteChannel(id)
                onDone?.()
            } catch (err: any) {
                onError?.(err.message)
                throw err
            }
        },
        [onDone, onError]
    )

    const listChannels = useCallback(
        async (companyId: string, spaceId?: string) => {
            return ChannelsService.list(companyId, spaceId)
        },
        []
    )

    return {
        createChannel,
        updateChannel,
        removeChannel,
        listChannels,
    }
}