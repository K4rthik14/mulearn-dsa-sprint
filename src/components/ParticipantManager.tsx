'use client'

import React, { useState, useTransition } from 'react'
import { Search, Ban, ShieldAlert, Award, RefreshCw, ShieldCheck, Flame, UserMinus, Plus } from 'lucide-react'
import { banUser, resetStreak, giveBonusPoints } from '@/app/actions/admin'

interface Participant {
  id: string
  name: string
  email: string
  isBanned: boolean
  createdAt: string
  leaderboard: {
    score: number
    streak: number
    longestStreak: number
  } | null
  submissionsCount: number
}

interface ParticipantManagerProps {
  initialUsers: Participant[]
}

export default function ParticipantManager({ initialUsers }: ParticipantManagerProps) {
  const [users, setUsers] = useState<Participant[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'top' | 'inactive' | 'new'>('all')
  const [isPending, startTransition] = useTransition()
  
  // State for bonus points modal
  const [showBonusModal, setShowBonusModal] = useState<string | null>(null) // userId or null
  const [bonusVal, setBonusVal] = useState('10')
  const [modalError, setModalError] = useState('')

  // Handle Ban Toggle
  const handleBanToggle = async (userId: string, currentBanStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return

    startTransition(async () => {
      const res = await banUser(userId, !currentBanStatus)
      if (res.error) {
        alert(res.error)
      } else {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, isBanned: !currentBanStatus } : u))
        )
      }
    })
  }

  // Handle Reset Streak
  const handleResetStreak = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s streak to 0?')) return

    startTransition(async () => {
      const res = await resetStreak(userId)
      if (res.error) {
        alert(res.error)
      } else {
        setUsers(prev =>
          prev.map(u => {
            if (u.id === userId) {
              return {
                ...u,
                leaderboard: u.leaderboard
                  ? { ...u.leaderboard, streak: 0, longestStreak: 0 }
                  : { score: 0, streak: 0, longestStreak: 0 }
              }
            }
            return u
          })
        )
      }
    })
  }

  // Handle Give Bonus Points
  const handleGiveBonus = async () => {
    const userId = showBonusModal
    if (!userId) return

    const pts = parseInt(bonusVal)
    if (isNaN(pts) || pts === 0) {
      setModalError('Please enter a valid, non-zero number of points.')
      return
    }

    startTransition(async () => {
      const res = await giveBonusPoints(userId, pts)
      if (res.error) {
        setModalError(res.error)
      } else {
        setUsers(prev =>
          prev.map(u => {
            if (u.id === userId) {
              const currentScore = u.leaderboard?.score || 0
              return {
                ...u,
                leaderboard: u.leaderboard
                  ? { ...u.leaderboard, score: currentScore + pts }
                  : { score: pts, streak: 0, longestStreak: 0 }
              }
            }
            return u
          })
        )
        setShowBonusModal(null)
        setBonusVal('10')
        setModalError('')
      }
    })
  }

  // Search & Filter Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (filterType === 'top') {
      // Top Performers: Score >= 50
      return (user.leaderboard?.score || 0) >= 50
    }
    if (filterType === 'inactive') {
      // Inactive: 0 score or 0 streak
      return (user.leaderboard?.streak || 0) === 0
    }
    if (filterType === 'new') {
      // New users: registered in the last 7 days
      const registeredAt = new Date(user.createdAt)
      const diffDays = (Date.now() - registeredAt.getTime()) / (1000 * 3600 * 24)
      return diffDays <= 7
    }

    return true
  })

  // Sort top performers by score descending if active
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (filterType === 'top') {
      return (b.leaderboard?.score || 0) - (a.leaderboard?.score || 0)
    }
    if (filterType === 'new') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-zinc-850 bg-zinc-950 px-8 py-1.5 text-zinc-205 placeholder-zinc-550 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {(['all', 'top', 'inactive', 'new'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded border text-xs font-semibold font-mono transition-all cursor-pointer ${
                filterType === type
                  ? 'border-blue-500/40 bg-blue-950/15 text-blue-400'
                  : 'border-zinc-850 bg-zinc-950/20 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {type === 'all' && 'ALL USERS'}
              {type === 'top' && 'TOP PERFORMERS'}
              {type === 'inactive' && 'INACTIVE USERS'}
              {type === 'new' && 'NEW USERS'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded border border-zinc-850 bg-zinc-950/20 overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono">
          <thead>
            <tr className="border-b border-zinc-850 bg-zinc-950/40 text-[10px] text-zinc-500 uppercase tracking-wider">
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-4 py-2.5 font-semibold text-center">Score</th>
              <th className="px-4 py-2.5 font-semibold text-center">Current Streak</th>
              <th className="px-4 py-2.5 font-semibold text-center">Longest Streak</th>
              <th className="px-4 py-2.5 font-semibold text-center">Submissions</th>
              <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/40 text-xs">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 italic">
                  No participants matched the filters.
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-zinc-900/20 transition-colors ${user.isBanned ? 'bg-red-950/5 text-zinc-500' : 'text-zinc-300'}`}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {user.name}
                        {user.isBanned && (
                          <span className="text-[9px] border border-red-500/30 bg-red-500/10 text-red-400 px-1.5 py-0.2 rounded font-bold uppercase">
                            Banned
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-500">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-white">
                    {user.leaderboard?.score || 0} pts
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-blue-400 font-bold">
                      <Flame className="h-3.5 w-3.5" />
                      {user.leaderboard?.streak || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-400">
                    {user.leaderboard?.longestStreak || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-400">
                    {user.submissionsCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Give Bonus Points */}
                      <button
                        onClick={() => setShowBonusModal(user.id)}
                        className="p-1.5 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer"
                        title="Give Bonus Points"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                      {/* Reset Streak */}
                      <button
                        onClick={() => handleResetStreak(user.id)}
                        className="p-1.5 rounded bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-all cursor-pointer"
                        title="Reset Streak"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>

                      {/* Ban / Unban Toggle */}
                      <button
                        onClick={() => handleBanToggle(user.id, user.isBanned)}
                        className={`p-1.5 rounded border transition-all cursor-pointer ${
                          user.isBanned
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                        title={user.isBanned ? 'Unban User' : 'Ban User'}
                      >
                        {user.isBanned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bonus Points Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded border border-zinc-850 bg-zinc-950 p-6 space-y-4 font-mono">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Award className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-semibold text-white">AWARD BONUS POINTS</h3>
            </div>

            <p className="text-[11px] text-zinc-400">
              Enter the amount of points to add to (or subtract from, using negative values) this user's total score.
            </p>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500">POINTS AMOUNT</label>
              <input
                type="number"
                value={bonusVal}
                onChange={(e) => setBonusVal(e.target.value)}
                className="w-full rounded border border-zinc-850 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-zinc-700 focus:outline-none"
              />
            </div>

            {modalError && (
              <p className="text-[10px] text-red-500">{modalError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBonusModal(null)
                  setBonusVal('10')
                  setModalError('')
                }}
                className="rounded border border-zinc-850 bg-zinc-950 px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleGiveBonus}
                disabled={isPending}
                className="rounded bg-white px-3.5 py-1.5 text-xs font-bold text-black hover:bg-zinc-200"
              >
                {isPending ? 'SAVING...' : 'AWARD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
