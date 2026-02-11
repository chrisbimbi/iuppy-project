import { useEffect, useRef } from 'react'

/**
 * Hook to track time spent on a page/component
 * Automatically sends duration to backend when component unmounts
 * 
 * Usage:
 * ```tsx
 * function NewsDetailPage({ newsId }: { newsId: string }) {
 *   const { recordDuration } = usePageViewTimer(newsId)
 *   
 *   // Optionally manually record (e.g., on scroll to bottom)
 *   const handleScrollEnd = () => recordDuration()
 *   
 *   return <div>...content...</div>
 * }
 * ```
 */
export function usePageViewTimer(
    newsId: string,
    options?: {
        onSend?: (durationMs: number) => void
        minDuration?: number // Don't send if less than this (default: 500ms)
    }
) {
    const startTime = useRef<number>(Date.now())
    const sentRef = useRef<boolean>(false)

    const recordDuration = () => {
        if (sentRef.current) return // Already sent

        const durationMs = Date.now() - startTime.current
        const minDuration = options?.minDuration ?? 500

        // Don't track super short visits (likely accidental clicks/back button)
        if (durationMs < minDuration) return

        sentRef.current = true

        // Send to backend via existing news open endpoint
        const token = localStorage.getItem('accessToken')
        if (!token) return

        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/v2/news/${newsId}/open`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meta: {
                    origin: 'web',
                    durationMs,
                    url: window.location.href,
                },
            }),
        })
            .then(() => {
                options?.onSend?.(durationMs)
            })
            .catch((err) => {
                console.warn('[usePageViewTimer] Failed to send duration:', err)
            })
    }

    useEffect(() => {
        // Reset timer when newsId changes
        startTime.current = Date.now()
        sentRef.current = false

        // Send duration when component unmounts or newsId changes
        return () => {
            recordDuration()
        }
    }, [newsId])

    // Also send on page visibility change (user switches tab/closes)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                recordDuration()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [newsId])

    return { recordDuration }
}
