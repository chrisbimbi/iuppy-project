// src/app/core/hooks/useETaggedFetch.ts
import { useEffect, useRef, useState } from 'react'
import { api } from 'src/app/api'

type Options<T> = {
    url: string
    params?: Record<string, any>
    enabled?: boolean
    ttlMs?: number
    selector?: (payload: any) => T
    /** máximo de tentativas em erro transitório (5xx / network). default: 1 retry */
    retries?: number
}

type CacheEntry = { etag: string; data: any; ts: number }
const mem = new Map<string, CacheEntry>()

const keyOf = (url: string, params?: Record<string, any>) => url + '::' + JSON.stringify(params || {})

export function useETaggedFetch<T = any>({
    url,
    params,
    enabled = true,
    ttlMs = 30_000,
    selector,
    retries = 1,
}: Options<T>) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<T | null>(null)
    const aliveRef = useRef(true)

    useEffect(() => () => { aliveRef.current = false }, [])

    useEffect(() => {
        if (!enabled) return
        const k = keyOf(url, params)
        const cached = mem.get(k)
        const now = Date.now()

        const run = async () => {
            setLoading(true); setError(null)
            let attempts = 0
            while (attempts <= retries) {
                try {
                    const headers: Record<string, string> = {}
                    if (cached && now - cached.ts < ttlMs) headers['If-None-Match'] = cached.etag

                    const res = await api.get(url, {
                        params,
                        headers,
                        validateStatus: (s) => [200, 304, 412].includes(s), // 412 ETag inválido/antigo
                    })

                    // ETag hit
                    if (res.status === 304 && cached) {
                        if (!aliveRef.current) return
                        setData(selector ? selector(cached.data) : cached.data)
                        setLoading(false)
                        return
                    }

                    // ETag caiu/ficou inválida
                    if (res.status === 412) {
                        mem.delete(k)
                        // força nova tentativa sem If-None-Match
                        attempts++
                        continue
                    }

                    const etag = String(res.headers['etag'] || '')
                    if (etag) mem.set(k, { etag, data: res.data, ts: now })
                    if (!aliveRef.current) return
                    setData(selector ? selector(res.data) : res.data)
                    setLoading(false)
                    return
                } catch (e: any) {
                    const transient = !!(e?.code === 'ERR_NETWORK' || (e?.response?.status >= 500 && e?.response?.status <= 599))
                    if (!transient || attempts >= retries) {
                        if (!aliveRef.current) return
                        setError(e?.message ?? 'Erro ao carregar')
                        setLoading(false)
                        return
                    }
                    attempts++
                    await new Promise((r) => setTimeout(r, 300 * attempts)) // pequeno backoff
                }
            }
        }

        run()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, JSON.stringify(params), enabled, ttlMs, retries])

    return { data, loading, error }
}