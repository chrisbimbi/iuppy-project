// src/utils/fileUtils.ts
import { v4 as uuid } from 'uuid'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage, ensureFirebaseAuth, app } from 'src/lib/firebase'

export type UploadProgress = { percent: number }

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

console.log('[storage] using bucket from app.options:', app.options.storageBucket)

export function buildCompanyNewsPath(
    companyId: string,
    kind: 'highlight' | 'attachment',
    fileName: string
) {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const safeName = fileName.replace(/[^\w.\-]/g, '-')
    return `companies/${companyId}/news/${yyyy}/${mm}/${dd}/${kind}_${Date.now()}_${safeName}`
}

export async function uploadFileToFirebase(
    file: File,
    companyId: string,
    kind: 'highlight' | 'attachment',
    onProgress?: (p: UploadProgress) => void
): Promise<{ name: string; url: string }> {
    await ensureFirebaseAuth() // ✅ garante token

    const path = buildCompanyNewsPath(companyId, kind, file.name)
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
    kind: 'highlight' | 'attachment',
    onProgress?: (p: UploadProgress) => void
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
            })
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