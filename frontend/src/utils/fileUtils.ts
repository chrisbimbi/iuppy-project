// src/utils/fileUtils.ts
import { v4 as uuid } from 'uuid'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, ensureFirebaseAuth, app } from 'src/lib/firebase'

export type UploadKind =
    | 'highlight'           // News highlights
    | 'attachment'          // Generic attachments
    | 'journey_video_raw'   // Journey videos (raw)
    | 'company_logo'        // Company logo
    | 'company_icon'        // Company icon
    | 'user_avatar'         // User profile picture
    | 'form_attachment'     // Form files
    | 'social_post'         // Social wall post images
    | 'chat_file';          // Chat files

export type UploadProgress = { percent: number }

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

console.log('[storage] using bucket from app.options:', app.options.storageBucket)

export function getFilePath(
    companyId: string,
    kind: UploadKind,
    fileName: string,
    entityId?: string
) {
    const safeName = fileName.replace(/[^\w.\-]/g, '-')
    const timestamp = Date.now()

    switch (kind) {
        case 'journey_video_raw':
            if (!entityId) throw new Error('Step ID required for raw video upload')
            // Path: {companyId}/journeys/steps/{stepId}/raw/{timestamp}_{filename}
            return `${companyId}/journeys/steps/${entityId}/raw/${timestamp}_${safeName}`

        case 'attachment':
            if (entityId) {
                // Journey attachment with stepId
                return `${companyId}/journeys/steps/${entityId}/attachments/${timestamp}_${safeName}`
            }
            // Generic attachment
            return `${companyId}/attachments/${timestamp}_${safeName}`

        case 'company_logo':
            // Always same filename for easy cache busting via query param
            return `${companyId}/company/logo.png`

        case 'company_icon':
            return `${companyId}/company/icon.png`

        case 'user_avatar':
            if (!entityId) throw new Error('User ID required for avatar upload')
            return `${companyId}/users/${entityId}/avatar.jpg`

        case 'form_attachment':
            if (!entityId) throw new Error('Form ID required for form attachment')
            return `${companyId}/forms/${entityId}/${timestamp}_${safeName}`

        case 'social_post':
            if (!entityId) throw new Error('Post ID required for social post media')
            return `${companyId}/social/posts/${entityId}/${timestamp}_${safeName}`

        case 'chat_file':
            if (!entityId) throw new Error('Chat ID required for chat file')
            return `${companyId}/chat/${entityId}/${timestamp}_${safeName}`

        case 'highlight':
            // News highlights - organized by date
            const d = new Date()
            const yyyy = d.getFullYear()
            const mm = pad(d.getMonth() + 1)
            const dd = pad(d.getDate())
            return `${companyId}/news/${yyyy}/${mm}/${dd}/highlight_${timestamp}_${safeName}`

        default:
            throw new Error(`Unknown upload kind: ${kind}`)
    }
}

export async function uploadFileToFirebase(
    file: File,
    companyId: string,
    kind: UploadKind,
    onProgress?: (p: UploadProgress) => void,
    entityId?: string
): Promise<{ name: string; url: string }> {
    await ensureFirebaseAuth() // ✅ garante token

    const path = getFilePath(companyId, kind, file.name, entityId)
    const storageRef = ref(storage, path)

    const metadata = { contentType: file.type || 'application/octet-stream' }
    const task = uploadBytesResumable(storageRef, file, metadata)

    await new Promise<void>((resolve, reject) => {
        task.on(
            'state_changed',
            (snap) => onProgress?.({ percent: (snap.bytesTransferred / snap.totalBytes) * 100 }),
            (err) => { console.error('[upload] error on', path, err); reject(err) },
            () => resolve()
        )
    })

    const url = await getDownloadURL(task.snapshot.ref)
    return { name: file.name, url }
}

// Mantém URLs já existentes e só sobe o que tiver file
export async function uploadArrayOfFiles(
    items: Array<{ file?: File; name: string; url?: string }>,
    companyId: string,
    kind: 'highlight' | 'attachment' | 'journey_video_raw',
    onProgress?: (p: UploadProgress) => void,
    entityId?: string
): Promise<Array<{ name: string; url: string }>> {
    const totalToUpload = items.filter((i) => i.file).length || 0
    let uploadedSoFar = 0

    const results: Array<{ name: string; url: string }> = []

    for (const it of items) {
        if (it.file) {
            const res = await uploadFileToFirebase(it.file, companyId, kind, (p) => {
                // mapa de progresso agregado
                onProgress?.({
                    percent:
                        ((uploadedSoFar + p.percent / 100) / Math.max(1, totalToUpload)) *
                        100,
                })
            }, entityId)
            uploadedSoFar += 1
            onProgress?.({
                percent: (uploadedSoFar / Math.max(1, totalToUpload)) * 100,
            })
            results.push(res)
        } else if (it.url) {
            results.push({ name: it.name, url: it.url })
        }
    }

    return results
}