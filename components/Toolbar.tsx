'use client'

interface Props {
  fontSize: number
  onFontSizeChange: (size: number) => void
}

export default function Toolbar({ fontSize, onFontSizeChange }: Props) {
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 bg-white border-b border-gray-200">
      {/* Text style */}
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('bold') }}
        title="Bold"
        className="w-8 h-8 rounded hover:bg-gray-100 font-bold text-gray-700 flex items-center justify-center transition-colors"
      >
        B
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('italic') }}
        title="Italic"
        className="w-8 h-8 rounded hover:bg-gray-100 italic text-gray-700 flex items-center justify-center transition-colors"
      >
        I
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('underline') }}
        title="Underline"
        className="w-8 h-8 rounded hover:bg-gray-100 underline text-gray-700 flex items-center justify-center transition-colors"
      >
        U
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Font size */}
      <button
        onMouseDown={(e) => { e.preventDefault(); onFontSizeChange(Math.max(10, fontSize - 1)) }}
        title="Decrease font size"
        className="w-8 h-8 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors"
      >
        A−
      </button>
      <span className="text-sm font-semibold text-gray-600 min-w-[24px] text-center">
        {fontSize}
      </span>
      <button
        onMouseDown={(e) => { e.preventDefault(); onFontSizeChange(Math.min(28, fontSize + 1)) }}
        title="Increase font size"
        className="w-8 h-8 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold transition-colors"
      >
        A+
      </button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* Alignment */}
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft') }}
        title="Align left"
        className="w-8 h-8 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors"
      >
        ≡L
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter') }}
        title="Align center"
        className="w-8 h-8 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors"
      >
        ≡C
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); exec('justifyRight') }}
        title="Align right"
        className="w-8 h-8 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-center text-xs transition-colors"
      >
        ≡R
      </button>
    </div>
  )
}
