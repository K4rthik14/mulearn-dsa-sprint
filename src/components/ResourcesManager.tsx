'use client'

import { useState } from 'react'
import { addResource, updateResource, deleteResource } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, X, Terminal, HelpCircle, Play, FileText, BookOpen, File, PlaySquare, ExternalLink } from 'lucide-react'

interface ChallengeDay {
  id: string
  dayNumber: number
  topic: string
}

interface Resource {
  id: string
  challengeDayId: string
  title: string
  url: string
  type: string
}

interface ResourcesManagerProps {
  challengeDays: ChallengeDay[]
  initialResources: Resource[]
}

const RESOURCE_TYPES = ['YouTube', 'Article', 'Documentation', 'PDF', 'Playlist']

export default function ResourcesManager({ challengeDays, initialResources }: ResourcesManagerProps) {
  // Sort challenge days by dayNumber
  const sortedDays = [...challengeDays].sort((a, b) => a.dayNumber - b.dayNumber)
  
  const [selectedDayId, setSelectedDayId] = useState<string>(
    sortedDays.length > 0 ? sortedDays[0].id : ''
  )
  
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  const [activeResource, setActiveResource] = useState<Resource | null>(null)
  
  // Status states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Get resources for currently selected day
  const currentDayResources = initialResources.filter(
    (res) => res.challengeDayId === selectedDayId
  )

  const selectedDayInfo = sortedDays.find((d) => d.id === selectedDayId)

  // Render resource icon based on its type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'YouTube':
        return <Play className="h-4 w-4 text-red-500" />
      case 'Article':
        return <FileText className="h-4 w-4 text-blue-400" />
      case 'Documentation':
        return <BookOpen className="h-4 w-4 text-emerald-400" />
      case 'PDF':
        return <File className="h-4 w-4 text-amber-500" />
      case 'Playlist':
        return <PlaySquare className="h-4 w-4 text-purple-400" />
      default:
        return <FileText className="h-4 w-4 text-zinc-400" />
    }
  };

  const getResourceTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'YouTube':
        return 'border-red-500/20 bg-red-500/10 text-red-400'
      case 'Article':
        return 'border-blue-500/20 bg-blue-500/10 text-blue-400'
      case 'Documentation':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      case 'PDF':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-400'
      case 'Playlist':
        return 'border-purple-500/20 bg-purple-500/10 text-purple-400'
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
    // Add current selected day ID explicitly
    formData.append('challengeDayId', selectedDayId)
    const result = await addResource(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Resource added successfully!')
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
    const result = await updateResource(formData)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
    } else {
      setSuccess('Resource updated successfully!')
      setIsEditOpen(false)
      setActiveResource(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!activeResource) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await deleteResource(activeResource.id)

    setLoading(false)
    if (result && result.error) {
      setError(result.error)
      setIsDeleteOpen(false)
    } else {
      setSuccess('Resource deleted successfully!')
      setIsDeleteOpen(false)
      setActiveResource(null)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2">
          <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-red-400">
            <span className="font-bold">Error:</span> {error}
            <div className="mt-2 text-[10px] text-zinc-500">
              Note: If this is a database column error, ensure you have run the migration script adding the `type` column to your `resources` table.
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

      {/* Header and Day Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl">
        <div className="flex-1 max-w-sm">
          <label className="block text-[10px] font-mono text-zinc-500 mb-1.5">MANAGE RESOURCES FOR DAY</label>
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
                  Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}: {day.topic}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Add Resource Button */}
        {selectedDayId && (
          <button
            onClick={() => {
              setError(null)
              setIsAddOpen(true)
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-semibold text-black transition-all font-mono cursor-pointer self-end sm:self-center"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </button>
        )}
      </div>

      {/* Resources Cards Grid */}
      {selectedDayId && (
        <div>
          <h3 className="text-xs font-mono font-bold text-zinc-400 mb-4 uppercase tracking-wider">
            Resources List ({currentDayResources.length})
          </h3>
          
          {currentDayResources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-850 p-10 text-center">
              <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-mono italic">No learning resources added for this day yet.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-white underline hover:text-zinc-300"
              >
                Add the first resource
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentDayResources.map((res) => {
                const resourceType = res.type || 'Article'
                return (
                  <div
                    key={res.id}
                    className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 flex flex-col justify-between gap-4 hover:border-zinc-850 transition-all group"
                  >
                    <div>
                      {/* Badge and Link Icon */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[9px] font-mono font-medium ${getResourceTypeBadgeStyle(resourceType)}`}>
                          {getResourceIcon(resourceType)}
                          {resourceType}
                        </span>
                        
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-white font-mono mt-3 leading-snug">
                        {res.title}
                      </h4>

                      {/* URL truncated */}
                      <p className="text-[10px] text-zinc-500 font-mono truncate mt-1 select-all">
                        {res.url}
                      </p>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-900 pt-3">
                      <button
                        onClick={() => {
                          setActiveResource(res)
                          setIsEditOpen(true)
                        }}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-700 px-2 py-1 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setActiveResource(res)
                          setIsDeleteOpen(true)
                        }}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900 px-2 py-1 text-[10px] font-mono text-zinc-450 hover:text-red-400 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* SQL Migration Help Message */}
      <div className="rounded-xl border border-zinc-850 bg-zinc-950/50 p-4">
        <h4 className="text-xs font-bold font-mono text-zinc-300 mb-2 flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-zinc-500" />
          RESOURCES TABLE SCHEMA MIGRATION
        </h4>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Ensure your Supabase instance has the resource type check constraint. If not, run this SQL in your Supabase SQL Editor:
        </p>
        <pre className="mt-2.5 p-3 rounded bg-black/80 border border-zinc-900 text-[9px] text-zinc-400 font-mono overflow-x-auto select-all">
{`ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS type text check (type in ('YouTube', 'Article', 'Documentation', 'PDF', 'Playlist')) not null default 'Article';`}
        </pre>
      </div>

      {/* -------------------- ADD RESOURCE MODAL -------------------- */}
      {isAddOpen && selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAddOpen(false)}
          />
          
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-orange-500" />
                ADD RESOURCE TO DAY {selectedDayInfo.dayNumber}
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
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE TYPE *</label>
                <select
                  name="type"
                  required
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE TITLE *</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  placeholder="e.g. YouTube: Breadth First Search Visualized"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE URL *</label>
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
                  {loading ? 'Adding...' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- EDIT RESOURCE MODAL -------------------- */}
      {isEditOpen && activeResource && selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsEditOpen(false)
              setActiveResource(null)
            }}
          />
          
          <div className="relative w-full max-w-md rounded-xl border border-zinc-850 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-emerald-500" />
                EDIT RESOURCE ON DAY {selectedDayInfo.dayNumber}
              </h3>
              <button 
                onClick={() => {
                  setIsEditOpen(false)
                  setActiveResource(null)
                }}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <input type="hidden" name="id" value={activeResource.id} />
              
              <div>
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE TYPE *</label>
                <select
                  name="type"
                  required
                  defaultValue={activeResource.type || 'Article'}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE TITLE *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={activeResource.title}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500">RESOURCE URL *</label>
                <input
                  type="url"
                  name="url"
                  required
                  defaultValue={activeResource.url}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false)
                    setActiveResource(null)
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

      {/* -------------------- DELETE RESOURCE CONFIRMATION MODAL -------------------- */}
      {isDeleteOpen && activeResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteOpen(false)
              setActiveResource(null)
            }}
          />
          
          <div className="relative w-full max-w-sm rounded-xl border border-red-500/20 bg-zinc-950 p-6 shadow-2xl z-10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-white">
                  DELETE RESOURCE?
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold font-mono">{activeResource.title}</span>?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false)
                  setActiveResource(null)
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
