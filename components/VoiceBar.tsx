'use client'

import { useState, useRef } from 'react'

interface Props {
  onTranscript: (text: string) => void
}

type Lang = 'hi' | 'en-IN'

const DG_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY

export default function VoiceBar({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [lang, setLang]               = useState<Lang>('hi')
  const [interim, setInterim]         = useState('')
  const [status, setStatus]           = useState('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')

  const wsRef          = useRef<WebSocket | null>(null)
  const recorderRef    = useRef<MediaRecorder | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const isRecordingRef = useRef(false)
  const langRef        = useRef<Lang>('hi')
  langRef.current      = lang

  const stopRecording = () => {
    isRecordingRef.current = false
    try { wsRef.current?.close() }          catch {}
    try { recorderRef.current?.stop() }     catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop())
    wsRef.current       = null
    recorderRef.current = null
    streamRef.current   = null
    setIsRecording(false)
    setInterim('')
    setStatus('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')
  }

  const startRecording = async (language: Lang) => {
    stopRecording()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current  = stream
      isRecordingRef.current = true

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?language=${language}&model=nova-2&punctuate=true&interim_results=true&endpointing=400`,
        ['token', DG_KEY!]
      )
      wsRef.current = ws

      ws.onopen = () => {
        setIsRecording(true)
        setStatus('सुन रहा है... बोलें')

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

        const recorder = new MediaRecorder(stream, { mimeType })
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        }
        recorder.start(250) // 250ms chunks — smooth streaming
        recorderRef.current = recorder
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const transcript = data?.channel?.alternatives?.[0]?.transcript ?? ''
          const isFinal    = data?.is_final

          if (isFinal && transcript.trim()) {
            onTranscript(transcript.trim() + ' ')
            setInterim('')
          } else if (!isFinal && transcript) {
            setInterim(transcript)
          }
        } catch {}
      }

      ws.onerror = () => {
        setStatus('Connection error — दोबारा कोशिश करें')
        stopRecording()
      }

      ws.onclose = () => {
        // Auto-reconnect if user didn't manually stop
        if (isRecordingRef.current) {
          setTimeout(() => {
            if (isRecordingRef.current) startRecording(langRef.current)
          }, 500)
        }
      }
    } catch {
      setStatus('माइक access नहीं मिला — browser permissions जांचें')
      isRecordingRef.current = false
    }
  }

  const toggleVoice = () => {
    if (isRecording) stopRecording()
    else startRecording(lang)
  }

  const toggleLang = () => {
    const next: Lang = lang === 'hi' ? 'en-IN' : 'hi'
    setLang(next)
    if (isRecording) startRecording(next)
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
      <button
        onClick={toggleVoice}
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
        {interim && (
          <p className="text-xs text-indigo-600 italic truncate mt-0.5">{interim}</p>
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
