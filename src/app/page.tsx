'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '../components/core/Logo'
import { PrimaryButton, Button } from '../components/core/Button'


export default function Home() {
  const router = useRouter()
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSession(!!localStorage.getItem('jsonResume'))
    }
  }, [])

  const startNewSession = () => {
    window.localStorage.clear()
    router.push('/generator')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader()
    reader.addEventListener('load', (e) => {
      // TODO: validate JSON schema using Zod
      const jsonResume = JSON.parse(e.target?.result as string)
      localStorage.setItem('jsonResume', JSON.stringify(jsonResume))
      router.push('/generator')
    })

    if (e.target.files) {
      reader.readAsText(e.target.files[0])
    }
  }

  return (
    <div className="h-screen grid grid-rows-[1fr_75px]">
      <main className="flex flex-col items-center justify-center">
        <Logo className="mb-3" />
        <PrimaryButton onClick={startNewSession}>Make New Resume</PrimaryButton>
        {hasSession && (
          <Link href="/generator" className="no-underline">
            <Button>Continue Session</Button>
          </Link>
        )}
        <label htmlFor="import-json" className="px-3 py-2 text-white border border-green-500 rounded-full cursor-pointer flex justify-center items-center w-[175px] h-[45px] my-[7px] hover:bg-gradient-to-r hover:from-green-600 hover:to-green-500" style={{ backgroundColor: '#1f2937' }}>
          Import JSON
        </label>
        <input
          id="import-json"
          type="file"
          accept="application/json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </main>
      <footer className="border-t px-12 md:px-4 flex justify-between items-center gap-8 text-xs [&>a]:no-underline [&>a]:hover:underline" style={{ backgroundColor: 'rgba(31, 41, 55, 0.98)', borderColor: '#374151', color: '#d1d5db' }}>
        <span className="flex-1">© 2022 Saad Quadri</span>
        <Link href="/about" style={{ color: '#d1d5db' }}>About</Link>
        <a href="https://github.com/saadq/resumake" style={{ color: '#d1d5db' }}>Source</a>
        <a href="https://github.com/saadq/resumake/issues" style={{ color: '#d1d5db' }}>Issues</a>
      </footer>
    </div>
  )
}
