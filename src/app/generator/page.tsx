'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Form } from '../../components/generator/Form'
import { Header } from '../../components/generator/Header'
import { Sidebar } from '../../components/generator/Sidebar'

const Preview = dynamic(
  async () => (await import('../../components/generator/Preview')).Preview,
  { ssr: false }
)

export default function GeneratorPage() {
  return (
    <main className="grid grid-cols-[300px_1fr_400px] grid-rows-[auto_1fr] h-screen">
      <div className="col-span-3">
        <Header />
      </div>
      <div className="border-r p-6" style={{ borderColor: '#374151' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <Sidebar />
        </Suspense>
      </div>
      <div className="p-6">
        <Suspense fallback={<div>Loading...</div>}>
          <Form />
        </Suspense>
      </div>
      <div className="border-l" style={{ borderColor: '#374151' }}>
        <Preview />
      </div>
    </main>
  )
}
