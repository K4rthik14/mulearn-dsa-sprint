'use client'

import React, { useState, useTransition } from 'react'
import { Megaphone, Trash2, Plus, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { createAnnouncement, deleteAnnouncement } from '@/app/actions/admin'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'Info' | 'Warning' | 'Important'
  createdAt: string
}

interface AnnouncementManagerProps {
  initialAnnouncements: Announcement[]
}

export default function AnnouncementManager({ initialAnnouncements }: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [isPending, startTransition] = useTransition()
  const [showAddModal, setShowAddModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'Info' | 'Warning' | 'Important'>('Info')

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    startTransition(async () => {
      const res = await deleteAnnouncement(id)
      if (res.error) {
        alert(res.error)
      } else {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      }
    })
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!title || !content) {
      setErrorMsg('All fields are required.')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('priority', priority)

    startTransition(async () => {
      const res = await createAnnouncement(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        window.location.reload()
      }
    })
  }

  const getPriorityBadge = (p: 'Info' | 'Warning' | 'Important') => {
    if (p === 'Important') {
      return (
        <span className="inline-flex items-center gap-1 border border-red-500/20 bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
          <AlertCircle className="h-3 w-3" />
          Important
        </span>
      )
    }
    if (p === 'Warning') {
      return (
        <span className="inline-flex items-center gap-1 border border-amber-500/20 bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
          <AlertTriangle className="h-3 w-3" />
          Warning
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 border border-blue-500/20 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
        <Info className="h-3 w-3" />
        Info
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
            ANNOUNCEMENTS MANAGEMENT
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Broadcast updates, guidelines, or critical warnings directly to the user dashboard.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded bg-white px-3.5 py-2 text-xs font-mono font-bold text-black hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          NEW ANNOUNCEMENT
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-8 text-center text-zinc-500 italic font-mono text-xs">
            No announcements broadcasted yet. Click "New Announcement" to create one.
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getPriorityBadge(ann.priority)}
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {ann.title}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed max-w-3xl whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>

              <div className="shrink-0 self-end sm:self-start">
                <button
                  onClick={() => handleDelete(ann.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 hover:border-red-900 hover:text-red-400 p-2 text-xs text-zinc-500 transition-all cursor-pointer"
                  title="Delete Announcement"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Announcement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md rounded-xl border border-zinc-900 bg-zinc-950 p-6 shadow-2xl space-y-4 font-mono text-xs"
          >
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Megaphone className="h-5 w-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-white uppercase">NEW ANNOUNCEMENT</h3>
            </div>

            {errorMsg && (
              <div className="rounded border border-red-500/20 bg-red-500/10 p-2.5 text-red-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Announcement Title</label>
              <input
                type="text"
                placeholder="Day 21 Contest Starts Today!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Priority / Type</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none"
              >
                <option value="Info">Info</option>
                <option value="Warning">Warning</option>
                <option value="Important">Important</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase">Content / Message</label>
              <textarea
                placeholder="Enter details here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 rounded border border-zinc-900 bg-zinc-950 px-3 py-2 text-white focus:border-zinc-700 focus:outline-none resize-none"
                required
              />
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
                {isPending ? 'CREATING...' : 'BROADCAST'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
