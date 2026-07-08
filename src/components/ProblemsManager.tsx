'use client'

import { useState, useEffect } from 'react'
import { addProblem, updateProblem, deleteProblem, reorderProblems } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, X, Terminal, HelpCircle, ArrowUp, ArrowDown, ExternalLink, Code2 } from 'lucide-react'

interface ChallengeDay {
  id: string
  dayNumber: number
  topic: string
  sprintName?: string
}

interface Problem {
  id: string
  challengeDayId: string
  title: string
  platform: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  points: number
  orderIndex: number
  url: string
}

interface ProblemsManagerProps {
  challengeDays: ChallengeDay[]
  initialProblems: Problem[]
}

const PLATFORMS = ['LeetCode', 'Codeforces', 'HackerRank']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export default function ProblemsManager({ challengeDays, initialProblems }: ProblemsManagerProps) {
  // Sort challenge days by sprintName first, then by dayNumber
  const sortedDays = [...challengeDays].sort((a, b) => {
    const sprintA = a.sprintName || ''
    const sprintB = b.sprintName || ''
    if (sprintA !== sprintB) {
      return sprintA.localeCompare(sprintB)
    }
    return a.dayNumber - b.dayNumber
  })
  
  const [selectedDayId, setSelectedDayId] = useState<string>(
    sortedDays.length > 0 ? sortedDays[0].id : ''
  )
  
  const [problems, setProblems] = useState<Problem[]>([])
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Update local problems state when initialProblems changes or day changes
  useEffect(() => {
    const dayProblems = initialProblems
      .filter((p) => p.challengeDayId === selectedDayId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    setProblems(dayProblems)
  }, [initialProblems, selectedDayId])

  const selectedDayInfo = sortedDays.find((d) => d.id === selectedDayId)

  const getPlatformBadgeStyle = (platform: string) => {
    switch (platform) {
      case 'LeetCode':
        return 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
      case 'Codeforces':
        return 'border-blue-500/20 bg-blue-500/10 text-blue-400'
      case 'HackerRank':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      default:
        return 'border-zinc-800 bg-zinc-900 text-zinc-400'
    }
  }

  const getDifficultyBadgeStyle = (diff: 'Easy' | 'Medium' | 'Hard') => {
    switch (diff) {
      case 'Easy':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      case 'Medium':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-500'
      case 'Hard':
        return 'border-red-500/20 bg-red-500/10 text-red-400'
      default:
        return 'border-zinc-800 bg-zinc-900 text-zinc-400'
    }
  }

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    formData.append('challengeDayId', selectedDayId)
    const result = await addProblem(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Problem added successfully!')
      setIsAddOpen(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    formData.append('challengeDayId', selectedDayId)
    if (activeProblem) {
      formData.append('orderIndex', activeProblem.orderIndex.toString())
    }
    const result = await updateProblem(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Problem updated successfully!')
      setIsEditOpen(false)
      setActiveProblem(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!activeProblem) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await deleteProblem(activeProblem.id)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
      setIsDeleteOpen(false)
    } else {
      setSuccess('Problem deleted successfully!')
      setIsDeleteOpen(false)
      setActiveProblem(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  // Handle reordering up/down
  const moveProblem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === problems.length - 1) return

    const newProblems = [...problems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap
    const temp = newProblems[index]
    newProblems[index] = newProblems[targetIndex]
    newProblems[targetIndex] = temp

    // Update local state first for instant feedback
    setProblems(newProblems)
    setLoading(true)

    // Save to server
    const problemIds = newProblems.map((p) => p.id)
    const result = await reorderProblems(problemIds)
    setLoading(false)

    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Problems reordered successfully!')
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-red-400">
            <span className="font-bold">Error:</span> {error}
            <div className="mt-2 text-[10px] text-zinc-500">
              Note: Ensure you have run the migration script adding `platform`, `points`, and `orderIndex` to the `problems` table.
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-emerald-400">{success}</div>
        </div>
      )}

      {/* Header and Day Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl">
        <div className="flex-1 max-w-sm">
          <label className="block text-[10px] font-mono text-zinc-500 mb-1.5">MANAGE PROBLEMS FOR DAY</label>
          <select
            value={selectedDayId}
            onChange={(e) => setSelectedDayId(e.target.value)}
            className="block w-full rounded border border-zinc-850 bg-black px-3 py-2 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono transition-all"
          >
            {sortedDays.length === 0 ? (
              <option value="">No Challenge Days Available</option>
            ) : (
              sortedDays.map((day) => (
                <option key={day.id} value={day.id}>
                  [{day.sprintName || 'General'}] Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}: {day.topic}
                </option>
              ))
            )}
          </select>
        </div>

        {selectedDayId && (
          <button
            onClick={() => {
              setError(null)
              setIsAddOpen(true)
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-semibold text-black transition-all font-mono cursor-pointer self-end sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Add Problem
          </button>
        )}
      </div>

      {/* Problems List Table */}
      {selectedDayId && (
        <div>
          <h3 className="text-xs font-mono font-bold text-zinc-400 mb-4 uppercase tracking-wider">
            Problems List ({problems.length})
          </h3>
          
          {problems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-850 p-10 text-center">
              <Code2 className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-mono italic">No practice problems added for this day yet.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-white underline hover:text-zinc-300"
              >
                Add the first problem
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-zinc-950/20">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/65 text-zinc-500 text-[10px] uppercase font-bold">
                    <th className="py-3 px-4 text-center w-20">Reorder</th>
                    <th className="py-3 px-4">Problem Title</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4 text-center">Points</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {problems.map((prob, idx) => (
                    <tr 
                      key={prob.id}
                      className="hover:bg-zinc-950/30 transition-colors"
                    >
                      {/* Reorder actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => moveProblem(idx, 'up')}
                            disabled={idx === 0 || loading}
                            className={`p-1 rounded hover:bg-zinc-900 transition-colors ${idx === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'}`}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => moveProblem(idx, 'down')}
                            disabled={idx === problems.length - 1 || loading}
                            className={`p-1 rounded hover:bg-zinc-900 transition-colors ${idx === problems.length - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white cursor-pointer'}`}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Title & link */}
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{prob.title}</span>
                          <a
                            href={prob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium ${getPlatformBadgeStyle(prob.platform)}`}>
                          {prob.platform || 'LeetCode'}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium ${getDifficultyBadgeStyle(prob.difficulty)}`}>
                          {prob.difficulty}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3 px-4 text-center font-bold text-zinc-300">
                        {prob.points || 10}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveProblem(prob)
                              setIsEditOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setActiveProblem(prob)
                              setIsDeleteOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900 px-2 py-1 text-[10px] text-zinc-450 hover:text-red-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Migration Script Help Box */}
      <div className="rounded-xl border border-zinc-850 bg-zinc-950/50 p-4">
        <h4 className="text-xs font-bold font-mono text-zinc-300 mb-2 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-zinc-500" />
          PROBLEMS TABLE SCHEMA MIGRATION
        </h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Ensure your Supabase database has the updated columns. If not, run this SQL script in your Supabase SQL Editor:
        </p>
        <pre className="mt-2.5 p-3 rounded bg-black/80 border border-zinc-900 text-[9px] text-zinc-400 font-mono overflow-x-auto select-all">
{`ALTER TABLE public.problems 
  ADD COLUMN IF NOT EXISTS platform text check (platform in ('LeetCode', 'Codeforces', 'HackerRank')) not null default 'LeetCode',
  ADD COLUMN IF NOT EXISTS points integer not null default 10,
  ADD COLUMN IF NOT EXISTS orderIndex integer not null default 0;`}
        </pre>
      </div>

      {/* -------------------- ADD PROBLEM MODAL -------------------- */}
      {isAddOpen && selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAddOpen(false)}
          />
          
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-blue-500" />
                ADD PROBLEM TO DAY {selectedDayInfo.dayNumber}
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500">PROBLEM TITLE *</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">PLATFORM *</label>
                  <select
                    name="platform"
                    required
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DIFFICULTY *</label>
                  <select
                    name="difficulty"
                    required
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">POINTS *</label>
                <input
                  type="number"
                  name="points"
                  required
                  min="1"
                  defaultValue="10"
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">PROBLEM URL *</label>
                <input
                  type="url"
                  name="url"
                  required
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 px-4 py-1.5 text-xs font-mono font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-white hover:bg-zinc-200 px-4 py-1.5 text-xs font-mono font-semibold text-black transition-all cursor-pointer"
                >
                  {loading ? 'Adding...' : 'Add Problem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- EDIT PROBLEM MODAL -------------------- */}
      {isEditOpen && activeProblem && selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsEditOpen(false)
              setActiveProblem(null)
            }}
          />
          
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-emerald-500" />
                EDIT PROBLEM ON DAY {selectedDayInfo.dayNumber}
              </h3>
              <button 
                onClick={() => {
                  setIsEditOpen(false)
                  setActiveProblem(null)
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="id" value={activeProblem.id} />
              
              <div>
                <label className="block text-[10px] font-mono text-zinc-500">PROBLEM TITLE *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={activeProblem.title}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">PLATFORM *</label>
                  <select
                    name="platform"
                    required
                    defaultValue={activeProblem.platform || 'LeetCode'}
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500">DIFFICULTY *</label>
                  <select
                    name="difficulty"
                    required
                    defaultValue={activeProblem.difficulty}
                    className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">POINTS *</label>
                <input
                  type="number"
                  name="points"
                  required
                  min="1"
                  defaultValue={activeProblem.points || 10}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">PROBLEM URL *</label>
                <input
                  type="url"
                  name="url"
                  required
                  defaultValue={activeProblem.url}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false)
                    setActiveProblem(null)
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

      {/* -------------------- DELETE PROBLEM CONFIRMATION MODAL -------------------- */}
      {isDeleteOpen && activeProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteOpen(false)
              setActiveProblem(null)
            }}
          />
          
          <div className="relative w-full max-w-sm rounded-xl border border-red-500/20 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  DELETE PROBLEM?
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold font-mono">{activeProblem.title}</span>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setActiveProblem(null)
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
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
