'use client'

import dynamic from 'next/dynamic'
import { useAtom, useAtomValue, useStore } from 'jotai'
import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { LoaderCircle } from 'lucide-react'
import {
  resumeAtom,
  isLoadingResumeAtom,
  autoRenderAtom
} from '../../atoms/resume'
import { useRenderIndicator } from '@/hooks/useRenderIndicator'
import { toast } from '@/components/ui/sonner'
import { formDataAtom } from '../../atoms/formData'
import { clampPdfPage, retainPdfUrl, releasePdfUrl } from '../../lib/pdfBuffer'

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

interface PdfBuffer {
  url: string
  numPages: number
}

interface PreviewProps {
  className?: string
  formId?: string
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

export function Preview({ className, formId = 'resume-form' }: PreviewProps) {
  const [resume, setResume] = useAtom(resumeAtom)
  const [autoRender, setAutoRender] = useAtom(autoRenderAtom)
  const store = useStore()
  const formData = useAtomValue(formDataAtom)
  const isLoadingResume = useAtomValue(isLoadingResumeAtom)
  const hasJson = formData !== null
  const [buffers, setBuffers] = useState<{
    requestedUrl: string
    displayed: PdfBuffer | null
    candidate: PdfBuffer | null
  }>({ requestedUrl: '', displayed: null, candidate: null })
  // Adjust before children commit so a superseded candidate cannot stay mounted.
  if (buffers.requestedUrl !== resume.url) {
    setBuffers({
      ...buffers,
      requestedUrl: resume.url,
      candidate:
        resume.url && resume.url !== buffers.displayed?.url
          ? { url: resume.url, numPages: 0 }
          : null
    })
  }
  const { displayed, candidate } = buffers
  const numPages = displayed?.numPages ?? 1
  const [pageNumber, setPageNumber] = useState(1)
  const [zoom, setZoom] = useState(1.0)
  const containerRef = useRef<HTMLOutputElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const scrollRef = useRef<HTMLElement>(null)
  const swapScroll = useRef<{ top: number; left: number } | null>(null)
  const pageWidth =
    containerWidth > 0 ? (containerWidth - 64) * zoom : undefined
  const target = useRef({ pageNumber, pageWidth, candidate })
  useLayoutEffect(() => {
    target.current = { pageNumber, pageWidth, candidate }
  })

  const displayedUrl = displayed?.url ?? ''
  const candidateUrl = candidate?.url ?? ''
  useLayoutEffect(() => {
    retainPdfUrl(displayedUrl)
    retainPdfUrl(candidateUrl)
    return () => {
      releasePdfUrl(displayedUrl)
      releasePdfUrl(candidateUrl)
    }
  }, [displayedUrl, candidateUrl])

  useLayoutEffect(() => {
    if (!swapScroll.current || !scrollRef.current) return
    scrollRef.current.scrollTop = swapScroll.current.top
    scrollRef.current.scrollLeft = swapScroll.current.left
    swapScroll.current = null
  }, [displayedUrl])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const failCandidate = (url: string) => {
    if (target.current.candidate?.url !== url) return
    setResume((current) =>
      current.url === url
        ? { ...current, url: displayedUrl, isError: true }
        : current
    )
  }

  const promoteCandidate = (
    url: string,
    renderedPage: number,
    width: number
  ) => {
    const current = target.current
    const pdf = current.candidate
    if (
      pdf?.url !== url ||
      store.get(resumeAtom).url !== url ||
      current.pageWidth !== width ||
      renderedPage !== clampPdfPage(current.pageNumber, pdf.numPages)
    )
      return
    if (scrollRef.current) {
      swapScroll.current = {
        top: scrollRef.current.scrollTop,
        left: scrollRef.current.scrollLeft
      }
    }
    setPageNumber(renderedPage)
    setBuffers((state) =>
      state.candidate?.url === url
        ? { ...state, displayed: pdf, candidate: null }
        : state
    )
  }

  const handleDownloadPdf = useCallback(() => {
    if (displayedUrl) triggerDownload(displayedUrl, 'resume.pdf')
  }, [displayedUrl])

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
      toast.error('Unable to download the LaTeX source.')
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
    if (displayedUrl) window.open(displayedUrl, '_blank')
  }, [displayedUrl])

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
  const hasPdf = !!displayed
  const isBuilding = resume.isLoading || isLoadingResume
  const indicator = useRenderIndicator(
    resume.isLoading || !!candidate,
    hasPdf,
    resume.isError
  )
  const isNarrow = containerWidth > 0 && containerWidth < 520

  const toolButton =
    'flex h-8 min-w-8 items-center justify-center rounded-app-button px-1.5 text-slate-400 transition-colors hover:bg-app-control hover:text-white disabled:pointer-events-none disabled:opacity-40'
  const menuItem =
    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-300 focus:bg-app-control focus:text-white data-[disabled]:opacity-40'

  return (
    <output
      ref={containerRef}
      className={twMerge(
        clsx('flex w-full flex-1 flex-col bg-app-surface', className)
      )}
    >
      {/* Toolbar */}
      <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-1 border-b border-app-border py-2 pl-4 pr-2">
        <span className="text-sm font-medium text-white">Preview</span>
        <button
          type="button"
          role="switch"
          aria-checked={autoRender}
          onClick={() => setAutoRender(!autoRender)}
          className="ml-2 flex items-center gap-1.5 rounded-app-small text-xs text-slate-400 focus-visible:outline focus-visible:outline-2"
        >
          Auto render
          <span
            data-checked={autoRender}
            className="h-3.5 w-6 rounded-full bg-app-control p-0.5 after:block after:h-2.5 after:w-2.5 after:rounded-full after:bg-white after:transition-transform data-[checked=true]:bg-slate-400 data-[checked=true]:after:translate-x-2.5"
            aria-hidden="true"
          />
        </button>
        {indicator === 'spinner' && (
          <LoaderCircle
            className="ml-1 h-3 w-3 animate-spin text-slate-400"
            role="status"
            aria-label="Rendering"
          />
        )}
        <div className="flex-1" />

        {numPages > 1 && (
          <div className="mr-1 flex items-center">
            <button
              className={toolButton}
              onClick={handlePrevPage}
              disabled={pageNumber <= 1}
              title="Previous page"
            >
              <IconArrowLeft />
            </button>
            <span className="px-1 text-xs tabular-nums text-slate-400">
              {pageNumber} / {numPages}
            </span>
            <button
              className={toolButton}
              onClick={handleNextPage}
              disabled={pageNumber >= numPages}
              title="Next page"
            >
              <IconArrowRight />
            </button>
          </div>
        )}
        <button
          className={toolButton}
          onClick={handleZoomOut}
          disabled={zoomIdx <= 0}
          title="Zoom out"
        >
          <IconZoomOut />
        </button>
        <button
          className={toolButton}
          onClick={handleZoomIn}
          disabled={zoomIdx >= ZOOM_STEPS.length - 1}
          title="Zoom in"
        >
          <IconZoomIn />
        </button>
        <button
          className={toolButton}
          onClick={handlePrint}
          disabled={!hasPdf || isBuilding}
          title="Print"
        >
          <IconPrinter />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 flex h-8 items-center gap-1.5 rounded-app-button border border-app-border px-2.5 text-xs font-medium text-white transition-colors hover:bg-app-control"
              title="Download"
            >
              <IconDownload />
              {!isNarrow && 'Download'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[180px] rounded-app-card border border-app-border bg-app-surfaceElevated py-1 shadow-lg"
          >
            <DropdownMenuItem
              onClick={handleDownloadPdf}
              disabled={!hasPdf || isBuilding}
              className={menuItem}
            >
              PDF
              <span className="ml-auto text-xs text-slate-400">.pdf</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownloadLatex}
              disabled={!hasJson || isBuilding}
              className={menuItem}
            >
              LaTeX source
              <span className="ml-auto text-xs text-slate-400">.zip</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDownloadJson}
              disabled={!hasJson || isBuilding}
              className={menuItem}
            >
              JSON
              <span className="ml-auto text-xs text-slate-400">.json</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* PDF viewer */}
      <article
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto bg-app-background"
        style={{
          overflowX: zoom > 1 ? 'auto' : 'hidden',
          overflowAnchor: 'none'
        }}
      >
        {indicator === 'error' && (
          <div
            role="alert"
            className="sticky top-0 z-10 flex justify-center px-4 pt-4"
          >
            <p className="rounded-app-button border border-red-400/30 bg-app-surface px-3 py-2 text-xs text-red-400 shadow-lg">
              {"Couldn't render"}{' '}
              <button type="submit" form={formId} className="ml-2 underline">
                Retry
              </button>
            </p>
          </div>
        )}
        {[displayed, candidate].map((pdf) =>
          pdf ? (
            <div
              key={pdf.url}
              aria-hidden={pdf !== displayed}
              className={clsx(
                'w-full',
                pdf !== displayed &&
                  'pointer-events-none invisible absolute left-0 top-0'
              )}
            >
              <Document
                file={pdf.url}
                onLoadSuccess={({ numPages }) =>
                  setBuffers((state) =>
                    state.candidate?.url === pdf.url &&
                    state.candidate.numPages !== numPages
                      ? { ...state, candidate: { url: pdf.url, numPages } }
                      : state
                  )
                }
                onSourceError={() => failCandidate(pdf.url)}
                onLoadError={() => failCandidate(pdf.url)}
                loading=""
                error=""
                className={clsx(
                  'w-full transition-opacity',
                  isBuilding && 'opacity-60'
                )}
              >
                {pdf.numPages > 0 && pageWidth !== undefined && (
                  <Page
                    pageNumber={clampPdfPage(pageNumber, pdf.numPages)}
                    width={pageWidth}
                    onRenderSuccess={({ pageNumber }) =>
                      promoteCandidate(pdf.url, pageNumber, pageWidth)
                    }
                    onLoadError={() => failCandidate(pdf.url)}
                    onRenderError={() => failCandidate(pdf.url)}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    loading=""
                    error=""
                    className="flex justify-center !bg-transparent py-8 [&>canvas]:rounded-app-small [&>canvas]:shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.18)]"
                  />
                )}
              </Document>
            </div>
          ) : null
        )}
        {!hasPdf && !candidate && !isBuilding && (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-8 text-center">
            <p className="text-sm font-medium text-white">No preview yet</p>
            <p className="max-w-xs text-xs text-slate-400">
              Fill in your details, then press Render to build your resume.
            </p>
          </div>
        )}
        {indicator === 'loading-engine' && (
          <div
            aria-live="polite"
            className="flex h-full items-center justify-center text-sm text-slate-400"
          >
            Loading preview engine…
          </div>
        )}
      </article>
    </output>
  )
}
