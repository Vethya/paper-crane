'use client'

import { Toaster as Sonner, toast } from 'sonner'

export { toast }

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      toastOptions={{
        classNames: {
          toast:
            'border border-app-border bg-app-surface text-slate-100 shadow-xl',
          description: 'text-slate-400',
          actionButton:
            'rounded-app-button bg-white text-app-background hover:bg-app-primaryHover',
          cancelButton:
            'rounded-app-button border border-app-controlBorder bg-app-control text-white'
        }
      }}
    />
  )
}
