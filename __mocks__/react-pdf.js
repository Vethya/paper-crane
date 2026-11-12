import { createElement, useEffect } from 'react'

export const pdfjs = { GlobalWorkerOptions: { workerSrc: '' } }
export function Document({ children, onLoadSuccess, file }) {
  useEffect(() => {
    onLoadSuccess({ numPages: file === '/blank.pdf' ? 1 : 2 })
  }, [file, onLoadSuccess])
  return createElement(
    'div',
    { role: 'group', 'aria-label': 'PDF fixture' },
    file === '/blank.pdf' ? null : children
  )
}
export function Page({ pageNumber, onRenderSuccess }) {
  useEffect(() => {
    onRenderSuccess?.({ pageNumber })
  }, [pageNumber, onRenderSuccess])
  return createElement(
    'div',
    null,
    `Jordan Diaz · Senior Frontend Engineer · Page ${pageNumber}`
  )
}
