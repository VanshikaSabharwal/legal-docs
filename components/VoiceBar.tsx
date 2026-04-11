'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
}

type Lang = 'hi-IN' | 'en-IN'

export default function VoiceBar({ onTranscript }: Props) {
  const [isRecording, setIsRecording] = useState(false)
  const [lang, setLang] = useState<Lang>('hi-IN')
  const [interim, setInterim]  = useState('')
  const [status, setStatus]    = useState('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const buildRecognition = useCallback((language: Lang): SpeechRecognition | null => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null
    const r = new SR()
    r.lang = language
    r.continuous = true
    r.interimResults = true
    return r
  }, [])

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
  }

  const startVoice = (language: Lang) => {
    stopRecognition()
    const r = buildRecognition(language)
    if (!r) {
      alert('Speech Recognition इस ब्राउज़र में उपलब्ध नहीं।\nकृपया Chrome या Edge उपयोग करें।')
      return
    }

    r.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += t
        else interimText += t
      }
      setInterim(interimText)
      if (finalText) {
        onTranscript(finalText)
        setInterim('')
      }
    }

    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') {
        setStatus('त्रुटि: ' + e.error)
        setIsRecording(false)
      }
    }

    r.onend = () => {
      // Auto-restart for continuous dictation
      if (recognitionRef.current === r && isRecordingRef.current) {
        try { r.start() } catch {}
      }
    }

    recognitionRef.current = r
    r.start()
    setIsRecording(true)
    setStatus('सुन रहा है... बोलें')
  }

  // We need a ref for isRecording inside onend closure
  const isRecordingRef = useRef(false)
  isRecordingRef.current = isRecording

  const toggleVoice = () => {
    if (isRecording) {
      stopRecognition()
      setIsRecording(false)
      setInterim('')
      setStatus('माइक दबाएं और बोलें — टेक्स्ट कर्सर पर डलेगा')
    } else {
      startVoice(lang)
    }
  }

  const toggleLang = () => {
    const newLang: Lang = lang === 'hi-IN' ? 'en-IN' : 'hi-IN'
    setLang(newLang)
    if (isRecording) startVoice(newLang)
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200">
      {/* Mic button */}
      <button
        onClick={toggleVoice}
        title={isRecording ? 'बंद करें' : 'बोलकर टाइप करें'}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0 transition-all
          ${isRecording
            ? 'bg-red-600 mic-recording'
            : 'bg-indigo-800 hover:bg-indigo-700'}
        `}
      >
        {isRecording ? '⏹' : '🎤'}
      </button>

      {/* Status + interim text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
          {status}
        </p>
        {interim && (
          <p className="text-xs text-indigo-600 italic truncate mt-0.5">
            {interim}
          </p>
        )}
      </div>

      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0"
        title="भाषा बदलें"
      >
        🌐 {lang === 'hi-IN' ? 'हिंदी' : 'English'}
      </button>
    </div>
  )
}
