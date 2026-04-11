'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  label: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PlaceholderModal({ label, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onConfirm(value)
    if (e.key === 'Escape') onCancel()
  }

  const toggleMic = () => {
    if (isListening) {
      try { recognitionRef.current?.stop() } catch {}
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const r = new SR()
    r.lang = 'hi-IN'
    r.continuous = false
    r.interimResults = false
    r.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript
      setValue(text)
    }
    r.onend = () => setIsListening(false)
    r.start()
    recognitionRef.current = r
    setIsListening(true)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <h3 className="text-base font-bold text-indigo-900 mb-4">
          भरें: <span className="text-orange-600">{label}</span>
        </h3>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="यहाँ टाइप करें..."
          className="w-full border-2 border-indigo-200 rounded-lg px-4 py-2.5 text-base text-gray-800 outline-none focus:border-indigo-500 transition-colors"
        />

        <button
          onClick={toggleMic}
          className={`w-full mt-2.5 py-2.5 rounded-lg text-sm font-semibold transition-colors
            ${isListening
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}
          `}
        >
          {isListening ? '⏹ सुन रहा है... क्लिक करें बंद करने के लिए' : '🎤 बोलकर भरें'}
        </button>

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={() => onConfirm(value)}
            className="flex-1 bg-indigo-800 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            ✓ ठीक है
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors"
          >
            ✕ रद्द
          </button>
        </div>
      </div>
    </div>
  )
}
