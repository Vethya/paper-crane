'use client'

import dynamic from 'next/dynamic'
import { useAtom } from 'jotai'
import { useState, useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { resumeAtom } from '../../atoms/resume'

// Dynamic import for react-pdf components
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

interface PreviewProps {
  className?: string
}

export function Preview({ className }: PreviewProps) {
  const [resume] = useAtom(resumeAtom)
  const [, setPageCount] = useState(1)
  const [pageNumber] = useState(1)
  const containerRef = useRef<HTMLElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    let cancelled = false

    const setupWorker = async () => {
      try {
        const { pdfjs } = await import('react-pdf')
        if (cancelled) {
          return
        }

        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
      } catch (error) {
        console.warn('Failed to setup PDF.js worker, PDF preview may not work:', error)
      }
    }

    setupWorker()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setPageCount(pdf.numPages)
  }, [])

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.warn('Failed to load PDF document:', error)
  }, [])

  return (
    <output ref={containerRef} className={twMerge(clsx("flex-1 w-full overflow-y-auto flex flex-col", className))} style={{ backgroundColor: '#1f2937' }}>
      <button
        onClick={() => window.open(resume.url)}
        className="px-3 py-2 mb-4 bg-green-500 text-white rounded hover:bg-green-600"
      >
        export as pdf
      </button>
      <article className="flex-1 flex flex-col">
        <Document
          file={resume.url || '/blank.pdf'}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading=""
          className="w-full"
        >
          {containerWidth > 0 && (
            <Page
              pageNumber={pageNumber}
              width={containerWidth * 0.92}
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
