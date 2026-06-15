'use client'

import { useState } from 'react'
import { createChallengeDay, updateChallengeDay, deleteChallengeDay } from '@/app/actions/admin'
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Terminal, HelpCircle } from 'lucide-react'

interface ChallengeDay {
  id: string
  dayNumber: number
  topic: string
  description: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  unlockDay?: number | null
}

interface ChallengeDaysManagerProps {
  challengeDays: ChallengeDay[]
}

export default function ChallengeDaysManager({ challengeDays }: ChallengeDaysManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [activeDay, setActiveDay] = useState<ChallengeDay | null>(null)
  
  // Status states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter challenge days based on search term
  const filteredDays = challengeDays.filter(day => 
    day.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    day.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `day ${day.dayNumber}`.includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.dayNumber - b.dayNumber)

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const result = await createChallengeDay(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Challenge day created successfully!')
      setIsCreateOpen(false)
      // Reset success/error messages after a delay
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateChallengeDay(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Challenge day updated successfully!')
      setIsEditOpen(false)
      setActiveDay(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!activeDay) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await deleteChallengeDay(activeDay.id)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
      setIsDeleteOpen(false)
    } else {
      setSuccess(`Day ${activeDay.dayNumber} deleted successfully!`)
      setIsDeleteOpen(false)
      setActiveDay(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const openEditModal = (day: ChallengeDay) => {
    setActiveDay(day)
    setIsEditOpen(true)
  }

  const openDeleteModal = (day: ChallengeDay) => {
    setActiveDay(day)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-red-400">
            <span className="font-bold">Error:</span> {error}
            <div className="mt-2 text-[10px] text-zinc-500">
              Note: If this is a database error, please check if your Supabase schema matches the latest `supabase/schema.sql` (specifically the new `difficulty` and `unlockDay` columns on `challengedays`).
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-emerald-400">
            {success}
          </div>
        </div>
      )}

      {/* Actions and Search bar header */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search topic or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border border-zinc-850 bg-black/60 pl-10 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono transition-all"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={() => {
            setError(null)
            setIsCreateOpen(true)
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-semibold text-black transition-all font-mono cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Day
        </button>
      </div>

      {/* Table view */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-900">
            <thead className="bg-zinc-950/80">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Day
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Topic & Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Unlock Condition
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
              {filteredDays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-zinc-500 italic font-mono">
                    No challenge days found.
                  </td>
                </tr>
              ) : (
                filteredDays.map((day) => {
                  const difficulty = day.difficulty || 'Easy'
                  return (
                    <tr key={day.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold font-mono text-orange-500">
                        Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-white font-mono">{day.topic}</div>
                        <div className="text-xs text-zinc-400 mt-1 max-w-md line-clamp-2">{day.description}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded px-2.5 py-0.5 text-[10px] font-mono font-medium border ${
                          difficulty === 'Easy' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                          difficulty === 'Medium' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                          'border-red-500/20 bg-red-500/10 text-red-400'
                        }`}>
                          {difficulty}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-mono text-zinc-300">
                        {day.unlockDay ? (
                          <span>Requires Day {day.unlockDay}</span>
                        ) : (
                          <span className="text-zinc-500">Sequential (Default)</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-xs font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(day)}
                          className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2 py-1 text-[11px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(day)}
                          className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 hover:border-red-900 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Migration Help Message */}
      <div className="rounded-xl border border-zinc-850 bg-zinc-950/50 p-4">
        <h4 className="text-xs font-bold font-mono text-zinc-300 mb-2 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-zinc-500" />
          DATABASE SCHEMA MIGRATION GUIDE
        </h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          If you are connecting this system to a live Supabase instance and haven&apos;t run the latest migration, please execute the following SQL script in your Supabase SQL Editor to support Difficulty and Unlock Days:
        </p>
        <pre className="mt-2.5 p-3 rounded bg-black/80 border border-zinc-900 text-[9px] text-zinc-400 font-mono overflow-x-auto select-all">
{`ALTER TABLE public.challengedays ADD COLUMN IF NOT EXISTS difficulty text check (difficulty in ('Easy', 'Medium', 'Hard')) not null default 'Easy';
ALTER TABLE public.challengedays ADD COLUMN IF NOT EXISTS "unlockDay" integer;`}
        </pre>
      </div>

      {/* -------------------- CREATE DAY MODAL -------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCreateOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-orange-500" />
                CREATE CHALLENGE DAY
              </h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DAY NUMBER *</label>
                  <input
                    type="number"
                    name="dayNumber"
                    min="1"
                    max="21"
                    required
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DIFFICULTY *</label>
                  <select
                    name="difficulty"
                    required
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">TOPIC NAME *</label>
                <input
                  type="text"
                  name="topic"
                  required
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="e.g. Sliding Window"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">DESCRIPTION *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="Describe the learning objectives and details..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">UNLOCK PREREQUISITE (UNLOCK DAY)</label>
                <input
                  type="number"
                  name="unlockDay"
                  min="1"
                  max="21"
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-750 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="Optional day number (e.g. Day 1)"
                />
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                  Leave blank for standard sequential progression (unlocked when the previous day is solved).
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 px-4 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-white hover:bg-zinc-200 px-4 py-1.5 text-xs font-mono font-semibold text-black transition-all cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- EDIT DAY MODAL -------------------- */}
      {isEditOpen && activeDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsEditOpen(false)
              setActiveDay(null)
            }}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-emerald-500" />
                EDIT CHALLENGE DAY {activeDay.dayNumber}
              </h3>
              <button 
                onClick={() => {
                  setIsEditOpen(false)
                  setActiveDay(null)
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="id" value={activeDay.id} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DAY NUMBER *</label>
                  <input
                    type="number"
                    name="dayNumber"
                    min="1"
                    max="21"
                    required
                    defaultValue={activeDay.dayNumber}
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DIFFICULTY *</label>
                  <select
                    name="difficulty"
                    required
                    defaultValue={activeDay.difficulty || 'Easy'}
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">TOPIC NAME *</label>
                <input
                  type="text"
                  name="topic"
                  required
                  defaultValue={activeDay.topic}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">DESCRIPTION *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  defaultValue={activeDay.description}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">UNLOCK PREREQUISITE (UNLOCK DAY)</label>
                <input
                  type="number"
                  name="unlockDay"
                  min="1"
                  max="21"
                  defaultValue={activeDay.unlockDay || ''}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-750 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="Optional day number (e.g. Day 1)"
                />
                <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                  Leave blank for standard sequential progression (unlocked when the previous day is solved).
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false)
                    setActiveDay(null)
                  }}
                  className="rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 px-4 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-white hover:bg-zinc-200 px-4 py-1.5 text-xs font-mono font-semibold text-black transition-all cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- DELETE DAY CONFIRMATION MODAL -------------------- */}
      {isDeleteOpen && activeDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteOpen(false)
              setActiveDay(null)
            }}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-sm rounded-xl border border-red-500/20 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  DELETE CHALLENGE DAY {activeDay.dayNumber}?
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold font-mono">Day {activeDay.dayNumber}: {activeDay.topic}</span>?
                </p>
                <p className="text-[10px] text-red-400 font-mono mt-3 leading-relaxed">
                  Warning: This action is permanent and will cascade-delete all related learning resources, practice problem links, and submissions for this day.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setActiveDay(null)
                }}
                disabled={loading}
                className="rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 px-4 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="rounded bg-red-600 hover:bg-red-500 px-4 py-1.5 text-xs font-mono font-bold text-white transition-all cursor-pointer"
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
