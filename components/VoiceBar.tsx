'use client'

import { useState, useRef } from 'react'

interface Props {
  onTranscript: (text: string) => void
}

type Lang = 'hi' | 'en-IN'

const CHUNK_MS = 3000 // record for 3s, then send complete blob

export default function VoiceBar({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [lang, setLang]               = useState<Lang>('hi')
  const [status, setStatus]           = useState('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')

  const streamRef      = useRef<MediaStream | null>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const isRecordingRef = useRef(false)
  const langRef        = useRef<Lang>('hi')
  const mimeTypeRef    = useRef('audio/webm')
  langRef.current      = lang

  const sendBlob = async (blob: Blob) => {
    if (!blob.size) return
    try {
      const form = new FormData()
      form.append('audio', blob, 'audio.' + (mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm'))
      form.append('lang', langRef.current)
      form.append('mimeType', mimeTypeRef.current)
      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      const { transcript } = await res.json()
      if (transcript?.trim()) onTranscript(transcript.trim() + ' ')
    } catch (e) {
      console.error('Transcribe error:', e)
    }
  }

  // Start a fresh MediaRecorder, record for CHUNK_MS, stop → onstop sends complete blob
  const startChunk = (stream: MediaStream) => {
    if (!isRecordingRef.current) return

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4'
    mimeTypeRef.current = mimeType

    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    recorder.onstop = () => {
      if (chunks.length) {
        const blob = new Blob(chunks, { type: mimeType })
        sendBlob(blob)
      }
      // Chain next chunk if still recording
      startChunk(stream)
    }

    recorder.start()
    recorderRef.current = recorder
    setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop()
    }, CHUNK_MS)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      isRecordingRef.current = true
      setIsRecording(true)
      setStatus('सुन रहा है... बोलें')
      startChunk(stream)
    } catch {
      setStatus('माइक access नहीं मिला — browser permissions जांचें')
    }
  }

  const stopRecording = () => {
    isRecordingRef.current = false
    try { recorderRef.current?.stop() } catch {}
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setIsRecording(false)
    setStatus('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')
  }

  const toggleLang = () => {
    const next: Lang = lang === 'hi' ? 'en-IN' : 'hi'
    setLang(next)
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
      <button
        onClick={() => isRecording ? stopRecording() : startRecording()}
        title={isRecording ? 'बंद करें' : 'बोलकर टाइप करें'}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 transition-all
          ${isRecording ? 'bg-red-600 mic-recording' : 'bg-indigo-800 hover:bg-indigo-700'}`}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
          {status}
        </p>
        {isRecording && (
          <p className="text-xs text-indigo-500 mt-0.5">हर 3 सेकंड में टेक्स्ट आएगा...</p>
        )}
      </div>

      <button
        onClick={toggleLang}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0"
        title="भाषा बदलें"
      >
        🌐 {lang === 'hi' ? 'हिंदी' : 'English'}
      </button>
    </div>
  )
}
