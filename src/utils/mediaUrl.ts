/** Use same-origin /api/v1/media paths so Vite dev proxy (or nginx) can load images. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : undefined)
    if (parsed.pathname.startsWith('/api/v1/media')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    /* fall through */
  }
  if (trimmed.startsWith('/api/v1/media')) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
  const match = trimmed.match(/\/api\/v1\/media\/[^\s?#]*/)
  if (match) return match[0]
  return trimmed
}
