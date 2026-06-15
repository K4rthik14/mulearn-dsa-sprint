'use client'

import React, { useState, useTransition } from 'react'
import { Calendar, Trash2, Link as LinkIcon, Plus, Info, Globe } from 'lucide-react'
import { createContest, deleteContest } from '@/app/actions/admin'

interface Contest {
  id: string
  name: string
  startTime: string
  endTime: string
  contestLink: string
  contestType: 'Codeforces' | 'HackerRank' | 'External'
}

interface ContestManagerProps {
  initialContests: Contest[]
}

export default function ContestManager({ initialContests }: ContestManagerProps) {
  const [contests, setContests] = useState<Contest[]>(initialContests)
  const [isPending, startTransition] = useTransition()
  const [showAddModal, setShowAddModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [name, setName] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [contestLink, setContestLink] = useState('')
  const [contestType, setContestType] = useState<'Codeforces' | 'HackerRank' | 'External'>('Codeforces')

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return

    startTransition(async () => {
      const res = await deleteContest(id)
      if (res.error) {
        alert(res.error)
      } else {
        setContests(prev => prev.filter(c => c.id !== id))
      }
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!name || !startTime || !endTime || !contestLink) {
      setErrorMsg('All fields are required.')
      return
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setErrorMsg('Start time must be before end time.')
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('startTime', startTime)
    formData.append('endTime', endTime)
    formData.append('contestLink', contestLink)
    formData.append('contestType', contestType)

    startTransition(async () => {
      const res = await createContest(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        // Refresh page/state (we can just reload or add it locally)
        // Since we don't have the newly created ID, we can reload or add a temp ID
        window.location.reload()
      }
    })
  }

  const getStatusBadge = (start: string, end: string) => {
    const now = new Date()
    const startDate = new Date(start)
    const endDate = new Date(end)

    if (now < startDate) {
      return (
        <span className="border border-blue-500/20 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
          Upcoming
        </span>
      )
    }
    if (now > endDate) {
      return (
        <span className="border border-zinc-800 bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
          Ended
        </span>
      )
    }
    return (
      <span className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold animate-pulse uppercase">
        Active
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            CONTEST MANAGEMENT
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Schedule Codeforces, HackerRank, or external contests for Day 21 and milestone sprints.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded bg-white px-3.5 py-2 text-xs font-mono font-bold text-black hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          CREATE CONTEST
        </button>
      </div>

      {/* Contests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contests.length === 0 ? (
          <div className="col-span-full rounded-xl border border-zinc-900 bg-zinc-950/20 p-8 text-center text-zinc-500 italic font-mono text-xs">
            No contests scheduled yet. Click "Create Contest" to get started.
          </div>
        ) : (
          contests.map((contest) => (
            <div
              key={contest.id}
              className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5 flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              {/* Top Row: Name and Type badge */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white font-mono line-clamp-1">
                    {contest.name}
                  </h3>
                  <div className="shrink-0 flex gap-1.5">
                    {getStatusBadge(contest.startTime, contest.endTime)}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                  <Globe className="h-3 w-3" />
                  <span>{contest.contestType.toUpperCase()} CONTEST</span>
                </div>
              </div>

              {/* Contest Times */}
              <div className="space-y-1.5 border-t border-zinc-900/60 pt-3 text-[11px] font-mono text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">Starts:</span>
                  <span>{new Date(contest.startTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">Ends:</span>
                  <span>{new Date(contest.endTime).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3">
                <a
                  href={contest.contestLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 text-xs text-white transition-all font-mono"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-zinc-400" />
                  Contest Link
                </a>

                <button
                  onClick={() => handleDelete(contest.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 hover:border-red-900 hover:text-red-400 px-2.5 py-1.5 text-xs text-zinc-500 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Contest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Calendar className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-white uppercase">CREATE NEW CONTEST</h3>
            </div>

            {errorMsg && (
              <div className="rounded border border-red-500/20 bg-red-500/10 p-2.5 text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Contest Name</label>
              <input
                type="text"
                placeholder="Day 21 Grand Finale Sprint"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Contest Type</label>
                <select
                  value={contestType}
                  onChange={(e) => setContestType(e.target.value as any)}
                  className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                >
                  <option value="Codeforces">Codeforces</option>
                  <option value="HackerRank">HackerRank</option>
                  <option value="External">External Link</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Contest Link</label>
                <input
                  type="url"
                  placeholder="https://codeforces.com/contest/..."
                  value={contestLink}
                  onChange={(e) => setContestLink(e.target.value)}
                  className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 uppercase">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setErrorMsg('')
                }}
                className="rounded border border-zinc-900 bg-zinc-950 px-4 py-2 text-zinc-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-white px-4 py-2 font-bold text-black hover:bg-zinc-200"
              >
                {isPending ? 'CREATING...' : 'CREATE'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
