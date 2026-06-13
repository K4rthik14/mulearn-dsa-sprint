'use client'

import { useState } from 'react'
import { submitChallenge } from '@/app/actions/challenge'
import { Terminal, Upload, Link as LinkIcon } from 'lucide-react'

interface ChallengeSubmissionFormProps {
  challengeDayId: string
}

export default function ChallengeSubmissionForm({ challengeDayId }: ChallengeSubmissionFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('challengeDayId', challengeDayId)

    const result = await submitChallenge(formData)

    if (result && result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Small reload to revalidate and show the "Completed" state
      window.location.reload()
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
        <span className="text-xs font-mono text-emerald-400">Submission recorded successfully!</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="profileLink" className="block text-[10px] font-mono font-medium leading-6 text-zinc-500">
          LEETCODE PROFILE LINK (OPTIONAL)
        </label>
        <div className="mt-1.5 relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <LinkIcon className="h-3.5 w-3.5 text-zinc-500" />
          </div>
          <input
            type="url"
            name="profileLink"
            id="profileLink"
            placeholder="https://leetcode.com/u/username/"
            className="block w-full rounded-md border border-zinc-800 bg-black pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
          />
        </div>
      </div>

      <div>
        <label htmlFor="screenshot" className="block text-[10px] font-mono font-medium leading-6 text-zinc-500">
          UPLOAD SCREENSHOT PROOF (OPTIONAL)
        </label>
        <div className="mt-1.5 flex justify-center rounded-lg border border-dashed border-zinc-850 px-6 py-6 bg-zinc-950/20 hover:bg-zinc-950/40 transition-all cursor-pointer relative">
          <div className="text-center">
            <Upload className="mx-auto h-6 w-6 text-zinc-650" />
            <div className="mt-2 flex text-xs leading-6 text-zinc-400 justify-center">
              <label
                htmlFor="screenshot"
                className="relative cursor-pointer rounded-md font-semibold text-zinc-350 hover:text-white"
              >
                <span>Upload a file</span>
                <input
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-[10px] leading-5 text-zinc-600 font-mono">PNG, JPG up to 5MB</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs font-mono text-red-400 leading-normal">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center rounded-md bg-white border border-transparent px-3 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition-all font-mono disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Submitting Log...' : 'Submit Solutions'}
      </button>
    </form>
  )
}
