'use client'

import { useState, useRef } from 'react'
import { FaMicrophone } from "react-icons/fa6";
import { GiSandsOfTime } from "react-icons/gi";
import { BsGlobe } from "react-icons/bs";

interface Props {
  onTranscript: (text: string) => void
}

type Lang = 'hi' | 'en-IN'

export default function VoiceBar({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [lang, setLang]               = useState<Lang>('hi')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [status, setStatus]           = useState('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const chunksRef   = useRef<Blob[]>([])

  const stopRecording = () => {
    try { recorderRef.current?.stop() } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current   = null
    recorderRef.current = null
    setIsRecording(false)
  }

  const startRecording = async (language: Lang) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      chunksRef.current = []
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) return

        setIsTranscribing(true)
        setStatus('लिख रहा है...')

        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const form = new FormData()
        form.append('audio', blob, `recording.${ext}`)
        form.append('lang', language)
        form.append('mimeType', mimeType)

        try {
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transcript?.trim()) {
            onTranscript(data.transcript.trim())
          }
        } catch {
          setStatus('Error — दोबारा कोशिश करें')
        }

        setIsTranscribing(false)
        setStatus('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')
      }

      recorder.start()
      recorderRef.current = recorder
      setIsRecording(true)
      setStatus('सुन रहा है... बोलें')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        setStatus('माइक access नहीं मिला — browser permissions जांचें')
      } else {
        setStatus(`Error: ${msg}`)
      }
    }
  }

  const toggleVoice = () => {
    if (isRecording) stopRecording()
    else if (!isTranscribing) startRecording(lang)
  }

  const toggleLang = () => {
    const next: Lang = lang === 'hi' ? 'en-IN' : 'hi'
    setLang(next)
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
      <button
        onClick={toggleVoice}
        disabled={isTranscribing}
        title={isRecording ? 'बंद करें' : 'बोलकर टाइप करें'}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 transition-all
          ${isTranscribing ? 'bg-yellow-500 cursor-wait'
            : isRecording ? 'bg-red-600 mic-recording'
            : 'bg-indigo-800 hover:bg-indigo-700'}`}
      >
        {isTranscribing ? <GiSandsOfTime /> : isRecording ? '⏹' : <FaMicrophone />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
          {status}
        </p>
      </div>

      <button
        onClick={toggleLang}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0"
        title="भाषा बदलें"
      >
        <BsGlobe /> {lang === 'hi' ? 'हिंदी' : 'English'}
      </button>
    </div>
  )
}
