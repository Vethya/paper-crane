"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateResumeDialogProps {
  children: React.ReactNode
}

export function CreateResumeDialog({ children }: CreateResumeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!title.trim()) {
      setError("Please enter a title.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to create resume")
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

  function handleOpenChange(next: boolean) {
    if (!loading) {
      setOpen(next)
      if (!next) {
        setTitle("")
        setError(null)
      }
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
          <DialogTitle className="text-white">New Resume</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="resume-title" className="text-slate-300 text-sm">
            Title
          </Label>
          <Input
            id="resume-title"
            placeholder="e.g. Software Engineer – Google"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
            disabled={loading}
            autoFocus
            className="bg-slate-800 border-white/10 text-slate-100 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter className="bg-transparent border-t-0 -mx-0 -mb-0 pt-2">
          <button
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim()}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create"}
          </button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}
