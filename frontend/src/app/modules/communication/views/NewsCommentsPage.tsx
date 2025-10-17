import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { PageTitle } from 'src/layout/core'
import { CommentsService, CommentRow } from '../services/comments.service'
import { api } from 'src/app/api'

type Filters = {
    q: string
    status: 'all' | 'pending' | 'approved' | 'rejected'
    from: string
    to: string
    page: number
    pageSize: number
}

const todayISO = () => new Date().toISOString().slice(0, 10)
const minusDays = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10)
}
const fmtDateTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso); return d.toLocaleString('pt-BR')
}

const NewsCommentsPage = () => {
    const { newsId = '' } = useParams()
    const navigate = useNavigate()

    const [filters, setFilters] = useState<Filters>({
        q: '',
        status: 'all',
        from: minusDays(30),
        to: todayISO(),
        page: 1,
        pageSize: 50,
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [summary, setSummary] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
    const [items, setItems] = useState<CommentRow[]>([])
    const [totalRows, setTotalRows] = useState(0)

    // 🔎 detectar se a notícia exige moderação
    const [commentsModerated, setCommentsModerated] = useState<boolean>(true)
    useEffect(() => {
        let alive = true
        if (!newsId) return
            ; (async () => {
                try {
                    const r = await api.get(`/v2/news/${newsId}`)
                    const s = r.data?.settings ?? {}
                    const moderated = !!(s.commentsModerated ?? s.requireModeration ?? s.commentsRequireModeration)
                    if (alive) setCommentsModerated(moderated)
                } catch {
                    if (alive) setCommentsModerated(true) // por segurança, mantém comport. antigo
                }
            })()
        return () => { alive = false }
    }, [newsId])

    const periodBadge = useMemo(() => {
        const from = new Date(filters.from); const to = new Date(filters.to)
        const diff = Math.round((+to - +from) / (1000 * 60 * 60 * 24))
        return `Período: ${fmtDateTime(filters.from)} — ${fmtDateTime(filters.to)} (${diff} dias)`
    }, [filters.from, filters.to])

    const fetchAll = async () => {
        if (!newsId) return
        setLoading(true); setError(null)
        try {
            // counters
            const [sum, list] = await Promise.all([
                CommentsService.summary(newsId, {
                    q: filters.q || undefined,
                    from: filters.from,
                    to: filters.to,
                    // mesmo com moderação desativada, o summary pode existir — backend ignora status
                }),
                CommentsService.list(newsId, {
                    status: commentsModerated ? filters.status : 'all', // ✅ sem moderação → sempre 'all'
                    q: filters.q || undefined,
                    from: filters.from,
                    to: filters.to,
                    page: filters.page,
                    pageSize: filters.pageSize,
                }),
            ])
            setSummary(sum)
            setItems(list.items)
            setTotalRows(list.total || list.items.length)
        } catch (e: any) {
            setError(e?.message || 'Erro ao carregar comentários')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newsId, commentsModerated, filters.status, filters.from, filters.to, filters.page, filters.pageSize])

    useEffect(() => { const t = setTimeout(() => { setFilters(f => ({ ...f, page: 1 })); fetchAll() }, 350); return () => clearTimeout(t) }, [filters.q]) // eslint-disable-line

    const statusLabel = (v: boolean | null | undefined) =>
        v === true ? 'Aprovado' : v === false ? 'Rejeitado' : 'Pendente'

    return (
        <div className='app-container container-xxl'>
            <div className='app-page' id='kt_app_page'>
                <AsideDefault />
                <Content>
                    <PageTitle breadcrumbs={[]}>Comentários da Notícia</PageTitle>

                    <div className='d-flex justify-content-between align-items-center mb-6'>
                        <button className='btn btn-light' onClick={() => navigate(`/contents/${newsId}/stats`)}>← Voltar para métricas</button>
                        <button className='btn btn-primary' onClick={() => navigate(`/contents/${newsId}/stats`)}>Ver painel</button>
                    </div>

                    {/* Filtros */}
                    <div className='card card-body mb-6'>
                        <div className='row g-4 align-items-end'>
                            <div className='col-lg-4'>
                                <label className='form-label'>Buscar</label>
                                <input
                                    className='form-control'
                                    placeholder='texto, usuário, email...'
                                    value={filters.q}
                                    onChange={(e) => setFilters(f => ({ ...f, q: e.target.value }))}
                                />
                                <div className='text-muted fs-8 mt-2'>{periodBadge}</div>
                            </div>

                            {/* ⚙️ só exibe o filtro de status se a moderação estiver ativa */}
                            {commentsModerated && (
                                <div className='col-lg-3'>
                                    <label className='form-label'>Status</label>
                                    <select
                                        className='form-select'
                                        value={filters.status}
                                        onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any, page: 1 }))}
                                    >
                                        <option value='all'>Todos</option>
                                        <option value='pending'>Pendentes</option>
                                        <option value='approved'>Aprovados</option>
                                        <option value='rejected'>Rejeitados</option>
                                    </select>
                                </div>
                            )}

                            <div className='col-lg-2'>
                                <label className='form-label'>De</label>
                                <input
                                    type='datetime-local'
                                    className='form-control'
                                    value={filters.from ? new Date(filters.from).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setFilters(f => ({ ...f, from: e.target.value ? new Date(e.target.value).toISOString() : f.from, page: 1 }))}
                                />
                            </div>
                            <div className='col-lg-2'>
                                <label className='form-label'>Até</label>
                                <input
                                    type='datetime-local'
                                    className='form-control'
                                    value={filters.to ? new Date(filters.to).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setFilters(f => ({ ...f, to: e.target.value ? new Date(e.target.value).toISOString() : f.to, page: 1 }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* KPIs */}
                    <div className='row g-6 mb-6'>
                        <div className='col-md-3'><div className='card card-body'><div className='text-muted'>Total</div><div className='fs-1 fw-bold'>{summary.total}</div></div></div>

                        {/* ⚙️ KPIs por status apenas com moderação */}
                        {commentsModerated && (
                            <>
                                <div className='col-md-3'><div className='card card-body'><div className='text-muted'>Pendentes</div><div className='fs-1 fw-bold'>{summary.pending}</div></div></div>
                                <div className='col-md-3'><div className='card card-body'><div className='text-muted'>Aprovados</div><div className='fs-1 fw-bold'>{summary.approved}</div></div></div>
                                <div className='col-md-3'><div className='card card-body'><div className='text-muted'>Rejeitados</div><div className='fs-1 fw-bold'>{summary.rejected}</div></div></div>
                            </>
                        )}
                    </div>

                    {/* Tabela */}
                    <div className='card'>
                        <div className='card-body p-0'>
                            <div className='table-responsive'>
                                <table className='table align-middle'>
                                    <thead className='text-gray-600'>
                                        <tr>
                                            <th>Usuário</th>
                                            <th>Comentário</th>
                                            <th>Data</th>
                                            {/* ⚙️ esconder coluna de status quando não há moderação */}
                                            {commentsModerated && <th>Status</th>}
                                            {/* ⚙️ esconder ações quando não há moderação */}
                                            {commentsModerated && <th className='text-end'>Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!loading && items.length === 0 && (
                                            <tr><td colSpan={commentsModerated ? 5 : 3} className='text-center text-muted py-10'>Nenhum comentário encontrado.</td></tr>
                                        )}
                                        {items.map((c) => (
                                            <tr key={c.id}>
                                                <td>
                                                    <div className='d-flex align-items-center gap-3'>
                                                        <div className='symbol symbol-35px'>
                                                            {c.avatar ? (
                                                                <img src={c.avatar} alt={c.name ?? 'avatar'} />
                                                            ) : (
                                                                <div className='symbol-label bg-light text-muted fw-bold'>{(c.name || '?').slice(0, 1).toUpperCase()}</div>
                                                            )}
                                                        </div>
                                                        <div>{c.name || c.userId}</div>
                                                    </div>
                                                </td>
                                                <td style={{ maxWidth: 520 }}><div className='text-wrap'>{c.text}</div></td>
                                                <td>{fmtDateTime(c.createdAt ?? '')}</td>

                                                {commentsModerated && <td>{statusLabel(c.approved ?? null)}</td>}

                                                {commentsModerated && (
                                                    <td className='text-end'>
                                                        <div className='btn-group'>
                                                            <button className='btn btn-light btn-sm' onClick={async () => { await CommentsService.approve(newsId, c.id); fetchAll() }}>Aprovar</button>
                                                            <button className='btn btn-light-danger btn-sm' onClick={async () => { await CommentsService.reject(newsId, c.id); fetchAll() }}>Rejeitar</button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* paginação */}
                            <div className='d-flex justify-content-between align-items-center px-6 py-4 text-muted'>
                                <div>Página {filters.page} — {totalRows} registros</div>
                                <div className='btn-group'>
                                    <button
                                        className='btn btn-light'
                                        disabled={filters.page <= 1}
                                        onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                                    >
                                        Anterior
                                    </button>
                                    <button
                                        className='btn btn-light'
                                        disabled={items.length < filters.pageSize}
                                        onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <div className='alert alert-danger mt-6'>Erro: {error}</div>}
                </Content>
            </div>
        </div>
    )
}

export default NewsCommentsPage
