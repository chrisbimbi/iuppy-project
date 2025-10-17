import { createHash } from 'crypto'

export function buildEtag(companyId: string, params: unknown, lastMarkerISO: string): string {
  const h = createHash('sha1')
  h.update(companyId)
  h.update(JSON.stringify(params ?? {}))
  h.update(lastMarkerISO || '')
  return `"${h.digest('hex')}"`
}