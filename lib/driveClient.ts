interface SaveSuccess {
  fileId: string
  fileUrl: string
}

interface SaveError {
  error: string
}

export async function saveToDrive(
  pdfBlob: Blob,
  fileName: string,
  fileId?: string | null,
): Promise<SaveSuccess | SaveError> {
  try {
    const form = new FormData()
    form.append('file', pdfBlob, fileName)
    form.append('fileName', fileName)
    if (fileId) form.append('fileId', fileId)

    const res = await fetch('/api/drive/save', { method: 'POST', body: form })
    return await res.json()
  } catch (err) {
    return { error: String(err) }
  }
}
