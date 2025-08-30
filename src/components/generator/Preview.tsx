'use client'

import dynamic from 'next/dynamic'
import { useAtom } from 'jotai'
import { useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'

import { resumeAtom } from '../../atoms/resume'

// Dynamic import for react-pdf components
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), { ssr: false })
const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), { ssr: false })

const Output = styled.output`
  grid-area: preview;
  background: ${(props) => props.theme.lightBlack};
  overflow-y: auto;
`

const PdfContainer = styled.article`
  width: 100%;
  height: 100%;
`

const ResumeDocument = styled(Document)`
  width: 100%;
`

const ResumePage = styled(Page)`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5em 0 10rem 0;

  canvas {
    max-width: 95% !important;
    height: auto !important;
  }
`

export function Preview() {
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

  const handleDocumentLoadSuccess = useCallback((pdf: any) => {
    setPageCount(pdf.numPages)
  }, [])

  const handleDocumentLoadError = useCallback((error: Error) => {
    console.warn('Failed to load PDF document:', error)
  }, [])

  return (
    <Output>
      <button onClick={() => window.open(resume.url)}>export as pdf</button>
      <PdfContainer>
        <ResumeDocument
          file={resume.url || '/blank.pdf'}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading=""
        >
          <ResumePage
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading=""
          />
        </ResumeDocument>
      </PdfContainer>
    </Output>
  )
}
