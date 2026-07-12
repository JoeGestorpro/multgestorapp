export function sanitizeCssUrl(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'data:') {
      return trimmed
    }
    return null
  } catch {
    return null
  }
}
