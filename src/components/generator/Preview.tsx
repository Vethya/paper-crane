'use client'

import dynamic from 'next/dynamic'
import { useAtom, useAtomValue } from 'jotai'
import { useState, useCallback, useEffect, useRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { resumeAtom, isLoadingResumeAtom } from '../../atoms/resume'
import { formDataAtom } from '../../atoms/formData'

// Configure PDF.js before either component is rendered. If the worker is
// configured in an effect, Document can start loading the PDF first and leave
// PDF.js with a destroyed message handler during a file change.
const loadPdfModule = async () => {
  const mod = await import('react-pdf')
  mod.pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  return mod
}

const Document = dynamic(
  () => loadPdfModule().then((mod) => ({ default: mod.Document })),
  { ssr: false }
)
const Page = dynamic(
  () => loadPdfModule().then((mod) => ({ default: mod.Page })),
  { ssr: false }
)

interface PreviewProps {
  className?: string
}

const ZOOM_STEPS = [1.0, 1.25, 1.5, 2.0]

// Inline SVG icons
function IconDownload() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v8M5 7l3 3 3-3" />
      <path d="M2 12h12" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}

function IconArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M5 7h4M11 11l2.5 2.5" />
    </svg>
  )
}

function IconZoomIn() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M5 7h4M7 5v4M11 11l2.5 2.5" />
    </svg>
  )
}

function IconPrinter() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="10" height="6" rx="1" />
      <path d="M5 6V3h6v3" />
      <rect x="5" y="9" width="6" height="3" />
    </svg>
  )
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

export function Preview({ className }: PreviewProps) {
  const [resume] = useAtom(resumeAtom)
  const formData = useAtomValue(formDataAtom)
  const isLoadingResume = useAtomValue(isLoadingResumeAtom)
  const hasJson = formData !== null
  const [numPages, setNumPages] = useState(1)
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1.0)
  const containerRef = useRef<HTMLOutputElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages)
    setPageNumber(1)
  }, [])

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.warn('Failed to load PDF document:', error)
  }, [])

  const handleDownloadPdf = useCallback(() => {
    if (!resume.url) return
    triggerDownload(resume.url, 'resume.pdf')
  }, [resume.url])

  const handleDownloadLatex = useCallback(async () => {
    if (!formData) return
    try {
      const res = await fetch('/api/generate-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('LaTeX generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      triggerDownload(url, 'resume.zip')
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('[Preview] LaTeX download failed:', err)
    }
  }, [formData])

  const handleDownloadJson = useCallback(() => {
    if (!formData) return
    const blob = new Blob([JSON.stringify(formData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, 'resume.json')
    URL.revokeObjectURL(url)
  }, [formData])

  const handlePrint = useCallback(() => {
    if (!resume.url) return
    window.open(resume.url, '_blank')
  }, [resume.url])

  const handlePrevPage = useCallback(() => {
    setPageNumber((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPageNumber((p) => Math.min(numPages, p + 1))
  }, [numPages])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.indexOf(z)
      return idx > 0 ? ZOOM_STEPS[idx - 1] : z
    })
  }, [])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => {
      const idx = ZOOM_STEPS.indexOf(z)
      return idx < ZOOM_STEPS.length - 1 ? ZOOM_STEPS[idx + 1] : z
    })
  }, [])

  const zoomIdx = ZOOM_STEPS.indexOf(zoom)
  const pageWidth =
    containerWidth > 0 ? containerWidth * 0.92 * zoom : undefined
  const pdfFile = resume.url || '/blank.pdf'

  const btnClass =
    'flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white/80 text-xs'
  const isNarrow = containerWidth > 0 && containerWidth < 520

  return (
    <output
      ref={containerRef}
      className={twMerge(
        clsx('flex-1 w-full flex flex-col bg-app-control', className)
      )}
    >
      {/* Toolbar */}
      <div className="grid grid-cols-3 items-center gap-1 px-3 py-2 bg-app-surfaceElevated border-b border-white/10 text-sm shrink-0">
        {/* Left group: downloads — dropdown on narrow, individual buttons on wide */}
        <div className="flex items-center gap-1 justify-start">
          {isNarrow ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={btnClass} title="Download">
                  <IconDownload />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[130px] bg-app-surfaceElevated border border-white/10 rounded shadow-lg py-1"
              >
                <DropdownMenuItem
                  onClick={handleDownloadPdf}
                  disabled={!resume.url || isLoadingResume}
                  className="flex items-center gap-2 px-3 py-1.5 text-white/70 hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  <IconDownload /> PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadLatex}
                  disabled={!hasJson || isLoadingResume}
                  className="flex items-center gap-2 px-3 py-1.5 text-white/70 hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  <IconDownload /> LaTeX
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDownloadJson}
                  disabled={!hasJson || isLoadingResume}
                  className="flex items-center gap-2 px-3 py-1.5 text-white/70 hover:text-white focus:text-white hover:bg-white/10 focus:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  <IconDownload /> JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                className={btnClass}
                onClick={handleDownloadPdf}
                disabled={!resume.url || isLoadingResume}
                title="Download PDF"
              >
                <IconDownload /> PDF
              </button>
              <button
                className={btnClass}
                onClick={handleDownloadLatex}
                disabled={!hasJson || isLoadingResume}
                title="Download LaTeX source (ZIP)"
              >
                <IconDownload /> LaTeX
              </button>
              <button
                className={btnClass}
                onClick={handleDownloadJson}
                disabled={!hasJson || isLoadingResume}
                title="Download JSON"
              >
                <IconDownload /> JSON
              </button>
            </>
          )}
        </div>

        {/* Center group: page navigation — always truly centered */}
        <div className="flex items-center gap-1 justify-center">
          <button
            className={btnClass}
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            title="Previous page"
          >
            <IconArrowLeft />
          </button>
          <span className="text-white/60 text-xs px-1 tabular-nums whitespace-nowrap">
            {isNarrow
              ? `${pageNumber}/${numPages}`
              : `Page ${pageNumber} / ${numPages}`}
          </span>
          <button
            className={btnClass}
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            title="Next page"
          >
            <IconArrowRight />
          </button>
        </div>

        {/* Right group: zoom + print */}
        <div className="flex items-center gap-1 justify-end">
          <button
            className={btnClass}
            onClick={handleZoomOut}
            disabled={zoomIdx <= 0}
            title="Zoom out"
          >
            <IconZoomOut />
          </button>
          <button
            className={btnClass}
            onClick={handleZoomIn}
            disabled={zoomIdx >= ZOOM_STEPS.length - 1}
            title="Zoom in"
          >
            <IconZoomIn />
          </button>
          <button
            className={btnClass}
            onClick={handlePrint}
            disabled={!resume.url || isLoadingResume}
            title="Print"
          >
            <IconPrinter />
          </button>
        </div>
      </div>

      {/* PDF viewer */}
      <article
        className="flex-1 overflow-y-auto"
        style={{ overflowX: zoom > 1 ? 'auto' : 'hidden' }}
      >
        <Document
          key={pdfFile}
          file={pdfFile}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading=""
          className="w-full"
        >
          {pageWidth !== undefined && (
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading=""
              className="flex justify-center py-6"
            />
          )}
        </Document>
      </article>
    </output>
  )
}
