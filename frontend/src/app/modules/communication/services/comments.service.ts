import { api } from 'src/app/api'

export type CommentStatus = 'all' | 'pending' | 'approved' | 'rejected'

export type CommentRow = {
    id: string
    text: string
    createdAt: string | null
    userId: string
    name: string | null
    avatar: string | null
    approved?: boolean | null
}

export const CommentsService = {
    async summary(
        newsId: string,
        params: { from?: string; to?: string; q?: string },
    ) {
        const r = await api.get<{ total: number; pending: number; approved: number; rejected: number }>(
            `/v2/news/${newsId}/comments/summary`,
            { params },
        )
        return r.data
    },

    async list(
        newsId: string,
        opts: { status: CommentStatus; from?: string; to?: string; q?: string; page?: number; pageSize?: number },
    ) {
        const { status, from, to, q, page = 1, pageSize = 50 } = opts
        const params = { status, from, to, q, page, pageSize } // sempre envia status
        const r = await api.get<{ items: CommentRow[]; total: number }>(
            `/v2/news/${newsId}/comments`,
            { params },
        )
        return r.data
    },

    async approve(newsId: string, commentId: string) {
        await api.post(`/v2/news/${newsId}/comments/${commentId}/approve`, {})
    },

    async reject(newsId: string, commentId: string) {
        await api.post(`/v2/news/${newsId}/comments/${commentId}/reject`, {})
    },
}