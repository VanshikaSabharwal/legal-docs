interface SaveRequest {
  content: string
  fileName: string
  fileId?: string
}

interface SaveSuccess {
  fileId: string
  fileUrl: string
}

interface SaveError {
  error: string
}

export async function saveToDrive(req: SaveRequest): Promise<SaveSuccess | SaveError> {
  try {
    const res = await fetch('/api/drive/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
    const data = await res.json()
    return data
  } catch (err) {
    return { error: String(err) }
  }
}
