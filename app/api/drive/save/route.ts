import { cookies } from 'next/headers'
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get('drive_token')

    if (!tokenCookie) {
      return NextResponse.json({ error: 'no_google_oauth' })
    }

    const tokens = JSON.parse(tokenCookie.value)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET,
      `${baseUrl}/api/drive/callback`
    )
    oauth2Client.setCredentials(tokens)

    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      if (!tokens.refresh_token) {
        return NextResponse.json({ error: 'no_google_oauth' })
      }
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const fileName = (form.get('fileName') as string | null) ?? 'Legal Document.pdf'
    const fileId = form.get('fileId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const bodyStream = Readable.from(buffer)

    if (fileId) {
      await drive.files.update({
        fileId,
        media: { mimeType: 'application/pdf', body: bodyStream },
      })
      return NextResponse.json({ fileId, fileUrl: `https://drive.google.com/file/d/${fileId}/view` })
    } else {
      const res = await drive.files.create({
        requestBody: { name: fileName, mimeType: 'application/pdf' },
        media: { mimeType: 'application/pdf', body: bodyStream },
        fields: 'id',
      })
      const newFileId = res.data.id!
      return NextResponse.json({
        fileId: newFileId,
        fileUrl: `https://drive.google.com/file/d/${newFileId}/view`,
      })
    }
  } catch (err: unknown) {
    console.error('Drive save error:', err)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
