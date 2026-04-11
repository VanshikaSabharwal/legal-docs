const DOC_PREFIX     = 'vl:doc:'
const FILEID_PREFIX  = 'vl:fileId:'

export function saveDoc(id: string, html: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(DOC_PREFIX + id, html) } catch {}
}

export function loadDoc(id: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(DOC_PREFIX + id) } catch { return null }
}

export function clearDoc(id: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(DOC_PREFIX + id) } catch {}
}

export function saveFileId(id: string, fileId: string): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(FILEID_PREFIX + id, fileId) } catch {}
}

export function loadFileId(id: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(FILEID_PREFIX + id) } catch { return null }
}
