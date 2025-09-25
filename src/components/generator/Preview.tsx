'use client'

import dynamic from 'next/dynamic'
import { useAtom } from 'jotai'
import { useState, useCallback, useEffect } from 'react'
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
  const [scale] = useState(document.body.clientWidth > 1440 ? 1.75 : 1)

  useEffect(() => {
    const setupWorker = async () => {
      try {
        const { pdfjs } = await import('react-pdf')
        const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

        const testResponse = await fetch(workerSrc, { method: 'HEAD' })
        if (testResponse.ok) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
        } else {
          const fallbackSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
          pdfjs.GlobalWorkerOptions.workerSrc = fallbackSrc
        }
      } catch (error) {
        console.warn('Failed to setup PDF.js worker, PDF preview may not work:', error)
      }
    }

    setupWorker()
  }, [])

  const handleDocumentLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setPageCount(pdf.numPages)
  }, [])

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.warn('Failed to load PDF document:', error)
  }, [])

  return (
    <output className={twMerge(clsx("overflow-y-auto", className))} style={{ backgroundColor: '#1f2937' }}>
      <button
        onClick={() => window.open(resume.url)}
        className="px-3 py-2 mb-4 bg-green-500 text-white rounded hover:bg-green-600"
      >
        export as pdf
      </button>
      <article className="w-full h-full">
        <Document
          file={resume.url || '/blank.pdf'}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading=""
          className="w-full"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading=""
            className="flex justify-center items-center py-6 pb-40 [&>canvas]:max-w-[95%] [&>canvas]:h-auto"
          />
        </Document>
      </article>
    </output>
  )
}
