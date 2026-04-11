import { auth, clerkClient } from '@clerk/nextjs/server'
import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { Readable } from 'stream'

interface RequestBody {
  content: string
  fileName: string
  fileId?: string
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // 2. Get the user's Google OAuth access token via Clerk
    const client = await clerkClient()
    const tokenResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_google')
    const accessToken = tokenResponse.data?.[0]?.token

    if (!accessToken) {
      // User signed in with email/password — no Google OAuth token
      return NextResponse.json({ error: 'no_google_oauth' })
    }

    // 3. Parse request body
    const body: RequestBody = await req.json()
    const { content, fileName = 'Legal Document.txt', fileId } = body

    if (!content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 })
    }

    // 4. Initialize Google Drive client
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    // 5. Create or update file
    const contentStream = Readable.from([content])

    if (fileId) {
      // Update existing file (no duplicate)
      await drive.files.update({
        fileId,
        media: {
          mimeType: 'text/plain',
          body: contentStream,
        },
      })
      return NextResponse.json({ fileId, fileUrl: `https://drive.google.com/file/d/${fileId}/view` })
    } else {
      // Create new file
      const res = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'text/plain',
        },
        media: {
          mimeType: 'text/plain',
          body: contentStream,
        },
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
