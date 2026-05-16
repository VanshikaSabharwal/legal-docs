import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get('audio') as File | null
    const lang  = (form.get('lang') as string | null) ?? 'hi'

    if (!audio || !audio.size) {
      return NextResponse.json({ transcript: '' })
    }

    const mimeType = (form.get('mimeType') as string | null) ?? audio.type ?? 'audio/webm'
    const buffer   = Buffer.from(await audio.arrayBuffer())

    const dgRes = await fetch(
      `https://api.deepgram.com/v1/listen?language=${lang}&model=nova-2&punctuate=true`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': mimeType,
        },
        body: buffer,
      }
    )

    if (!dgRes.ok) {
      const err = await dgRes.text()
      console.error('Deepgram error:', err)
      return NextResponse.json({ transcript: '' })
    }

    const data = await dgRes.json()
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('Transcribe route error:', err)
    return NextResponse.json({ transcript: '' })
  }
}
