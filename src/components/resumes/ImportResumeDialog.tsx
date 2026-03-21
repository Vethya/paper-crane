"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { FiUpload } from "react-icons/fi"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ImportResumeDialogProps {
  children: React.ReactNode
}

export function ImportResumeDialog({ children }: ImportResumeDialogProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [parsedContent, setParsedContent] = useState<object | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setTitle("")
    setParsedContent(null)
    setFileName(null)
    setDragging(false)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!loading) {
      setOpen(next)
      if (!next) reset()
    }
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".json")) {
      setError("Please select a .json file.")
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        setParsedContent(parsed)
        setFileName(file.name)
        setError(null)
        // Pre-fill title from basics.name if available
        const name = (parsed as { basics?: { name?: string } }).basics?.name
        if (name && !title) setTitle(name)
      } catch {
        setError("Invalid JSON file.")
        setParsedContent(null)
        setFileName(null)
      }
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  async function handleImport() {
    if (!parsedContent || !title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: parsedContent }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to import resume")
      }
      const { _id } = await res.json()
      setOpen(false)
      router.push(`/generator?id=${_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {children}
      </span>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-slate-900 border-white/10 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Import Resume</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Drop zone */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={[
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
                dragging
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : parsedContent
                  ? "border-green-500/50 bg-green-500/5 text-slate-300"
                  : "border-white/10 bg-slate-800/50 text-slate-400 hover:border-white/20 hover:text-slate-300",
              ].join(" ")}
            >
              <FiUpload size={22} className={parsedContent ? "text-green-400" : undefined} />
              {parsedContent ? (
                <span className="text-sm">
                  <span className="font-medium text-green-400">{fileName}</span>
                  <span className="ml-1 text-slate-500">loaded</span>
                </span>
              ) : (
                <span className="text-sm">
                  Drop a <span className="font-medium text-slate-200">.json</span> file here, or{" "}
                  <span className="font-medium text-blue-400">browse</span>
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Title field — only shown once a file is loaded */}
            {parsedContent && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="import-title" className="text-slate-300 text-sm">
                  Title
                </Label>
                <Input
                  id="import-title"
                  placeholder="e.g. Software Engineer – Google"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleImport()}
                  disabled={loading}
                  autoFocus
                  className="bg-slate-800 border-white/10 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          <DialogFooter className="bg-transparent border-t-0 pt-2">
            <button
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !parsedContent || !title.trim()}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? "Importing…" : "Import"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
