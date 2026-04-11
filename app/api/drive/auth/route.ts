import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/dashboard'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    `${baseUrl}/api/drive/callback`
  )

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state: encodeURIComponent(returnTo),
    prompt: 'consent',
  })

  return NextResponse.redirect(url)
}
