import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const returnTo = state ? decodeURIComponent(state) : '/dashboard'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`

  if (!code) {
    return NextResponse.redirect(new URL(returnTo, baseUrl))
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_ID,
    process.env.GOOGLE_SECRET,
    `${baseUrl}/api/drive/callback`
  )

  const { tokens } = await oauth2Client.getToken(code)

  const response = NextResponse.redirect(new URL(returnTo, baseUrl))
  response.cookies.set('drive_token', JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days — refresh token keeps it alive
    path: '/',
    sameSite: 'lax',
  })

  return response
}
