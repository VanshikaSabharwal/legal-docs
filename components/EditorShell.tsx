'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { TEMPLATES } from '@/lib/templates'
import { templateToHtml } from '@/lib/placeholder'
import { saveDoc, loadDoc, saveFileId, loadFileId } from '@/lib/localStorage'
import { saveToDrive } from '@/lib/driveClient'
import Toolbar from './Toolbar'
import VoiceBar from './VoiceBar'
import PlaceholderModal from './PlaceholderModal'
import { BiSolidPencil } from "react-icons/bi";
import { FaCloud } from "react-icons/fa6";
import { IoMdDownload } from "react-icons/io";
import { IoPrint } from "react-icons/io5";
import { LuRepeat } from "react-icons/lu";

interface Props {
  id: string
}

interface ModalState {
  span: HTMLSpanElement
  label: string
}

export default function EditorShell({ id }: Props) {
  const editorRef   = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedRangeRef = useRef<Range | null>(null)

  const [fontSize,    setFontSize]    = useState(16)
  const [saveStatus,  setSaveStatus]  = useState('')
  const [isSaving,    setIsSaving]    = useState(false)
  const [driveFileId, setDriveFileId] = useState<string | null>(null)
  const [modal,       setModal]       = useState<ModalState | null>(null)
  const [phCount,     setPhCount]     = useState(0)
  const [fileName,    setFileName]    = useState('')
  const [editingName, setEditingName] = useState(false)
  const [paperSize,   setPaperSize]   = useState<'a4' | 'letter' | 'legal' | 'a3' | 'a5'>('a4')

  const template = TEMPLATES[id] ?? TEMPLATES['new']

  // ── Initial load ──────────────────────────────────────
  useEffect(() => {
    if (!editorRef.current) return
    const saved   = loadDoc(id)
    const initial = saved ?? (template.content ? templateToHtml(template.content) : '')
    editorRef.current.innerHTML = initial
    updatePhCount()

    const fid = loadFileId(id)
    if (fid) setDriveFileId(fid)
    setFileName(template.title)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Placeholder count ─────────────────────────────────
  const updatePhCount = useCallback(() => {
    if (!editorRef.current) return
    setPhCount(editorRef.current.querySelectorAll('.ph').length)
  }, [])

  // ── Auto-save on input (debounced 500ms) ──────────────
  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveDoc(id, editorRef.current!.innerHTML)
      setSaveStatus('✓ Auto-saved')
      setTimeout(() => setSaveStatus(''), 2000)
      updatePhCount()
    }, 500)
  }, [id, updatePhCount])

  // ── Placeholder click delegation ──────────────────────
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('ph')) {
        const label = target.getAttribute('data-ph') || target.textContent?.replace(/\{\{|\}\}/g, '') || ''
        setModal({ span: target as HTMLSpanElement, label })
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [])

  const applyPlaceholder = (value: string) => {
    if (!modal) return
    if (value.trim()) {
      const textNode = document.createTextNode(value.trim())
      modal.span.replaceWith(textNode)
    }
    setModal(null)
    if (editorRef.current) {
      saveDoc(id, editorRef.current.innerHTML)
      updatePhCount()
    }
  }

  // ── Save cursor position before mic click ─────────────
  const saveRange = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  // ── Voice transcript insert ───────────────────────────
  const insertTranscript = useCallback((text: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()

    const sel = window.getSelection()
    // Restore saved range if cursor is outside editor
    if (savedRangeRef.current && (!sel?.rangeCount || !el.contains(sel.getRangeAt(0).commonAncestorContainer))) {
      sel?.removeAllRanges()
      sel?.addRange(savedRangeRef.current)
    }

    document.execCommand('insertText', false, text + ' ')
    // Save new cursor position
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }, [])

  // ── Font size ─────────────────────────────────────────
  const handleFontSize = (size: number) => {
    setFontSize(size)
    if (editorRef.current) editorRef.current.style.fontSize = size + 'px'
  }

  // ── Build PDF from editor content ────────────────────
  const buildPdf = async () => {
    const canvas = await html2canvas(editorRef.current!, { scale: 1.5 })
    const imgData = canvas.toDataURL('image/jpeg', 0.85)
    const pdf = new jsPDF('p', 'mm', paperSize)
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgH = (canvas.height * pageW) / canvas.width
    let remaining = imgH
    let offset = 0
    pdf.addImage(imgData, 'JPEG', 0, offset, pageW, imgH)
    remaining -= pageH
    while (remaining > 0) {
      offset -= pageH
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, offset, pageW, imgH)
      remaining -= pageH
    }
    return pdf
  }

  // ── Save to Google Drive as PDF ───────────────────────
  const handleSaveToDrive = async () => {
    if (!editorRef.current || isSaving) return
    setIsSaving(true)
    setSaveStatus('Generating PDF...')

    const pdf = await buildPdf()
    const pdfBlob = pdf.output('blob')
    const name = `${fileName || template.title}.pdf`

    setSaveStatus('Saving to Google Drive...')
    const result = await saveToDrive(pdfBlob, name, driveFileId)

    setIsSaving(false)
    if ('error' in result) {
      if (result.error === 'no_google_oauth') {
        window.location.href = `/api/drive/auth?returnTo=/editor/${id}`
        return
      }
      setSaveStatus(`Error: ${result.error}`)
    } else {
      setDriveFileId(result.fileId)
      saveFileId(id, result.fileId)
      setSaveStatus('✓ Saved to Google Drive!')
    }
    setTimeout(() => setSaveStatus(''), 5000)
  }

  // ── Download PDF ──────────────────────────────────────
  const handleDownload = async () => {
    if (!editorRef.current || isSaving) return
    setIsSaving(true)
    setSaveStatus('Generating PDF...')
    const pdf = await buildPdf()
    pdf.save(`${fileName || template.title}.pdf`)
    setIsSaving(false)
    setSaveStatus('✓ Downloaded!')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  // ── Print ─────────────────────────────────────────────
  const handlePrint = () => window.print()

  // ── Clear draft ───────────────────────────────────────
  const handleClear = () => {
    if (!confirm('दस्तावेज़ रीसेट करें? (टेम्प्लेट फिर से लोड होगा)')) return
    if (!editorRef.current) return
    const initial = template.content ? templateToHtml(template.content) : ''
    editorRef.current.innerHTML = initial
    saveDoc(id, initial)
    updatePhCount()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-700 text-white shadow no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="text-indigo-200 hover:text-white text-sm transition-colors">
            ← डैशबोर्ड
          </Link>
          <div className="w-px h-5 bg-indigo-500" />
          <span className="text-sm font-semibold truncate flex-1">{template.title}</span>
          {phCount > 0 && (
            <span className="text-xs bg-orange-400/80 text-white px-2 py-0.5 rounded-full">
              {phCount} placeholder बचे
            </span>
          )}
          <UserButton />
        </div>
      </header>

      {/* ── Action bar (top) ── */}
      <div className="no-print bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 flex-nowrap overflow-x-auto scrollbar-none">
          {/* Paper size selector */}
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as typeof paperSize)}
            className="text-sm text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 outline-none focus:border-indigo-400 cursor-pointer"
            title="Paper size"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="legal">Legal</option>
            <option value="a3">A3</option>
            <option value="a5">A5</option>
          </select>

          {/* Editable file name */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 min-w-0">
            {editingName ? (
              <input
                autoFocus
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false) }}
                className="text-sm text-gray-700 bg-transparent outline-none w-40 sm:w-56"
              />
            ) : (
              <span className="text-sm text-gray-700 truncate max-w-[10rem] sm:max-w-[14rem]">
                {fileName || template.title}
              </span>
            )}
            <span className="text-xs text-gray-400 shrink-0">.pdf</span>
            <button
              onClick={() => setEditingName(true)}
              title="Edit file name"
              className="ml-1 text-gray-400 hover:text-indigo-600 transition-colors text-xs shrink-0"
            >
              <BiSolidPencil />
            </button>
          </div>

          <button
            onClick={handleSaveToDrive}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <span><FaCloud /></span>
            <span className="hidden sm:inline">Google Drive</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <span><IoMdDownload /></span>
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <span><IoPrint /></span>
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 border border-gray-200 hover:border-red-200 text-sm font-medium transition-colors"
          >
            <span><LuRepeat /></span>
            <span className="hidden sm:inline">रीसेट</span>
          </button>

          {saveStatus && (
            <span className={`text-xs font-medium ml-1 ${saveStatus.startsWith('❌') || saveStatus.startsWith('⚠️') ? 'text-red-600' : 'text-green-700'}`}>
              {saveStatus}
            </span>
          )}

          {driveFileId && (
            <a
              href={`https://drive.google.com/file/d/${driveFileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline ml-auto hidden sm:block"
            >
              Drive में खोलें ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Editor wrapper ── */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4">
        <div className="flex-1 flex flex-col rounded-xl shadow bg-white border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="no-print">
            <Toolbar fontSize={fontSize} onFontSizeChange={handleFontSize} />
          </div>

          {/* Voice bar */}
          <div className="no-print">
            <VoiceBar onTranscript={insertTranscript} />
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onMouseUp={saveRange}
            onKeyUp={saveRange}
            className="editor-area flex-1 focus:outline-none"
            style={{ fontSize: `${fontSize}px` }}
          />
        </div>

        <p className="text-xs text-gray-400 text-center mt-2 no-print">
          पीले <strong>{'{{'}placeholder{'}}'}</strong> पर क्लिक करके भरें • Auto-save चालू है
        </p>
      </div>

      {/* ── Placeholder modal ── */}
      {modal && (
        <PlaceholderModal
          label={modal.label}
          onConfirm={applyPlaceholder}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  )
}
