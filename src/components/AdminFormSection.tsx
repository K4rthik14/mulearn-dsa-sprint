'use client'

import { useState } from 'react'
import { createChallengeDay, addResource, addProblem } from '@/app/actions/admin'
import { Calendar, BookOpen, Code, Terminal } from 'lucide-react'

interface AdminFormSectionProps {
  challengeDays: Array<{
    id: string
    dayNumber: number
    topic: string
  }>
}

export default function AdminFormSection({ challengeDays }: AdminFormSectionProps) {
  // States for Day Form
  const [dayError, setDayError] = useState<string | null>(null)
  const [daySuccess, setDaySuccess] = useState(false)
  const [dayLoading, setDayLoading] = useState(false)

  // States for Resource Form
  const [resError, setResError] = useState<string | null>(null)
  const [resSuccess, setResSuccess] = useState(false)
  const [resLoading, setResLoading] = useState(false)

  // States for Problem Form
  const [probError, setProbError] = useState<string | null>(null)
  const [probSuccess, setProbSuccess] = useState(false)
  const [probLoading, setProbLoading] = useState(false)

  const handleCreateDay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDayError(null)
    setDaySuccess(false)
    setDayLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createChallengeDay(formData)

    setDayLoading(false)
    if (result && result.error) {
      setDayError(result.error)
    } else {
      setDaySuccess(true)
      e.currentTarget.reset()
    }
  }

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setResError(null)
    setResSuccess(false)
    setResLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addResource(formData)

    setResLoading(false)
    if (result && result.error) {
      setResError(result.error)
    } else {
      setResSuccess(true)
      e.currentTarget.reset()
    }
  }

  const handleAddProblem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProbError(null)
    setProbSuccess(false)
    setProbLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await addProblem(formData)

    setProbLoading(false)
    if (result && result.error) {
      setProbError(result.error)
    } else {
      setProbSuccess(true)
      e.currentTarget.reset()
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Create Challenge Day Form */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5">
        <h4 className="text-xs font-bold font-mono text-white mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-400" />
          CREATE CHALLENGE DAY
        </h4>
        <form onSubmit={handleCreateDay} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">DAY NUMBER</label>
            <input
              type="number"
              name="dayNumber"
              min="1"
              max="21"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="e.g. 3"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">TOPIC</label>
            <input
              type="text"
              name="topic"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="e.g. Sliding Window"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">DESCRIPTION</label>
            <textarea
              name="description"
              required
              rows={2}
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="Describe the learning outcomes for the day..."
            />
          </div>

          {dayError && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-2 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-[10px] font-mono text-red-400">{dayError}</span>
            </div>
          )}

          {daySuccess && (
            <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-2">
              <span className="text-[10px] font-mono text-emerald-400">Day created successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={dayLoading}
            className="w-full flex justify-center rounded bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all font-mono cursor-pointer"
          >
            {dayLoading ? 'Saving...' : 'Create Day'}
          </button>
        </form>
      </div>

      {/* 2. Add Resource Form */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5">
        <h4 className="text-xs font-bold font-mono text-white mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-zinc-400" />
          ADD RESOURCE LINK
        </h4>
        <form onSubmit={handleAddResource} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">SELECT CHALLENGE DAY</label>
            <select
              name="challengeDayId"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            >
              <option value="">-- Choose Day --</option>
              {challengeDays.map((d) => (
                <option key={d.id} value={d.id}>
                  Day {d.dayNumber}: {d.topic}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">RESOURCE TITLE</label>
            <input
              type="text"
              name="title"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="e.g. Sliding Window Patterns Tutorial"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">URL</label>
            <input
              type="url"
              name="url"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="https://..."
            />
          </div>

          {resError && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-2 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-[10px] font-mono text-red-400">{resError}</span>
            </div>
          )}

          {resSuccess && (
            <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-2">
              <span className="text-[10px] font-mono text-emerald-400">Resource added successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={resLoading}
            className="w-full flex justify-center rounded bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all font-mono cursor-pointer"
          >
            {resLoading ? 'Saving...' : 'Add Resource'}
          </button>
        </form>
      </div>

      {/* 3. Add Problem Form */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5">
        <h4 className="text-xs font-bold font-mono text-white mb-4 flex items-center gap-2">
          <Code className="h-4 w-4 text-zinc-400" />
          ADD PROBLEM LINK
        </h4>
        <form onSubmit={handleAddProblem} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">SELECT CHALLENGE DAY</label>
            <select
              name="challengeDayId"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            >
              <option value="">-- Choose Day --</option>
              {challengeDays.map((d) => (
                <option key={d.id} value={d.id}>
                  Day {d.dayNumber}: {d.topic}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">PROBLEM TITLE</label>
            <input
              type="text"
              name="title"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="e.g. Longest Substring Without Repeating Characters"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">DIFFICULTY</label>
            <select
              name="difficulty"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-zinc-500">LEETCODE PROBLEM URL</label>
            <input
              type="url"
              name="url"
              required
              className="mt-1 block w-full rounded-md border border-zinc-850 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              placeholder="https://leetcode.com/problems/..."
            />
          </div>

          {probError && (
            <div className="rounded border border-red-500/20 bg-red-500/10 p-2 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-[10px] font-mono text-red-400">{probError}</span>
            </div>
          )}

          {probSuccess && (
            <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-2">
              <span className="text-[10px] font-mono text-emerald-400">Problem added successfully!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={probLoading}
            className="w-full flex justify-center rounded bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition-all font-mono cursor-pointer"
          >
            {probLoading ? 'Saving...' : 'Add Problem'}
          </button>
        </form>
      </div>
    </div>
  )
}
