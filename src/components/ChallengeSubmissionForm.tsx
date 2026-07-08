'use client'

import { useState } from 'react'
import { submitChallenge } from '@/app/actions/challenge'

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
      // Small reload to revalidate and show the "Pending" status
      window.location.reload()
    }
  }

  if (success) {
    return (
      <div className="border border-blue-900 bg-blue-950/10 p-3 text-center text-xs font-mono text-blue-400">
        Submission sent for review.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
      <div>
        <label htmlFor="subType" className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          Submission Type
        </label>
        <select
          name="subType"
          id="subType"
          required
          className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-zinc-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="GitHub Repository">GitHub Repository URL</option>
          <option value="GitHub Gist">GitHub Gist URL</option>
          <option value="LeetCode URL">LeetCode URL</option>
          <option value="Codeforces Submission">Codeforces Submission ID</option>
        </select>
      </div>

      <div>
        <label htmlFor="profileLink" className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
          Link or Submission ID
        </label>
        <input
          type="text"
          name="profileLink"
          id="profileLink"
          required
          placeholder="https://github.com/... or Submission ID"
          className="mt-1 block w-full rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-zinc-200 placeholder-zinc-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error && (
        <div className="border border-red-900 bg-red-950/15 p-2.5 text-red-400 leading-normal">
          Error: {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center rounded border border-blue-500/40 bg-blue-950/10 px-3 py-2 font-bold text-blue-400 hover:bg-blue-950/30 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {loading ? 'Submitting...' : 'Submit solution'}
      </button>
    </form>
  )
}
