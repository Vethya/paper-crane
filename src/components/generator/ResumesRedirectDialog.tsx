"use client"

import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface ResumesRedirectDialogProps {
  open: boolean
}

export function ResumesRedirectDialog({ open }: ResumesRedirectDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-white/10 text-slate-100 sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-white">Select a resume first</DialogTitle>
          <DialogDescription className="text-slate-400">
            To edit a saved resume, open it from the Resumes page rather than navigating here directly.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="bg-transparent border-t-0 pt-2">
          <button
            onClick={() => router.push("/resumes")}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Go to Resumes
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
