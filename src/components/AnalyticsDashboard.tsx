'use client'

import React from 'react'
import { BarChart2, PieChart, Users, FileSpreadsheet, TrendingUp, Flame, AlertCircle, Award } from 'lucide-react'

interface AnalyticsProps {
  stats: {
    totalUsers: number
    activeParticipants: number // streak > 0
    totalSubmissions: number
    approvedSubmissions: number
    pendingSubmissions: number
    rejectedSubmissions: number
    mostCompletedDay: {
      dayNumber: number
      topic: string
      count: number
    } | null
    streakDistribution: {
      zero: number
      oneToFive: number
      sixToTen: number
      elevenToFifteen: number
      sixteenPlus: number
    }
    dayCompletions: {
      dayNumber: number
      count: number
    }[]
    topPerformers: {
      name: string
      email: string
      score: number
      streak: number
    }[]
  }
}

export default function AnalyticsDashboard({ stats }: AnalyticsProps) {
  const {
    totalUsers,
    activeParticipants,
    totalSubmissions,
    approvedSubmissions,
    pendingSubmissions,
    rejectedSubmissions,
    mostCompletedDay,
    streakDistribution,
    dayCompletions,
    topPerformers
  } = stats

  // Calculate overall drop-off rate
  // Compares Day 1 completions with subsequent day completions
  const day1Completions = dayCompletions.find(d => d.dayNumber === 1)?.count || 0
  const lastDayCompletions = dayCompletions.length > 0 
    ? Math.max(...dayCompletions.filter(d => d.dayNumber > 1).map(d => d.count), 0)
    : 0

  let dropOffRate = 0
  if (day1Completions > 0) {
    const diff = day1Completions - lastDayCompletions
    dropOffRate = Math.round((diff / day1Completions) * 100)
    if (dropOffRate < 0) dropOffRate = 0
  }

  // Find max completions for scaling the bar chart
  const maxCompletionsCount = dayCompletions.length > 0
    ? Math.max(...dayCompletions.map(d => d.count), 1)
    : 1

  // Max value in streak distribution for bar scaling
  const maxStreakCount = Math.max(
    streakDistribution.zero,
    streakDistribution.oneToFive,
    streakDistribution.sixToTen,
    streakDistribution.elevenToFifteen,
    streakDistribution.sixteenPlus,
    1
  )

  return (
    <div className="space-y-8 font-mono text-xs text-zinc-300">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Registered</span>
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white">{totalUsers}</div>
          <p className="text-[10px] text-zinc-500">Users enrolled in DSA Sprint</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Streak Builders</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-white">{activeParticipants}</div>
          <p className="text-[10px] text-zinc-500">
            {totalUsers > 0 ? Math.round((activeParticipants / totalUsers) * 100) : 0}% of total participants
          </p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Total Submissions</span>
            <FileSpreadsheet className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSubmissions}</div>
          <div className="flex gap-2 text-[9px] text-zinc-500">
            <span className="text-emerald-400">{approvedSubmissions} Appr</span>
            <span className="text-amber-500">{pendingSubmissions} Pend</span>
            <span className="text-red-400">{rejectedSubmissions} Rej</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Day 1 Drop-off Rate</span>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{dropOffRate}%</div>
          <p className="text-[10px] text-zinc-500">Attrition from Day 1 to subsequent days</p>
        </div>

      </div>

      {/* Grid: Charts and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Challenge Day Completion Rate (Bar Chart) */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-zinc-400" />
              CHALLENGE DAY COMPLETION CHART
            </h3>
            {mostCompletedDay && (
              <span className="text-[9px] text-zinc-500">
                Peak: Day {mostCompletedDay.dayNumber} ({mostCompletedDay.count} completions)
              </span>
            )}
          </div>

          <div className="h-48 flex items-end justify-between gap-1 pt-6 px-2">
            {Array.from({ length: 21 }, (_, i) => {
              const dayNum = i + 1
              const dayData = dayCompletions.find(d => d.dayNumber === dayNum)
              const count = dayData ? dayData.count : 0
              const barHeightPct = Math.max((count / maxCompletionsCount) * 100, 4) // minimum height for UI

              return (
                <div key={dayNum} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-zinc-950 border border-zinc-850 p-2 rounded text-[9px] font-bold text-white text-center w-24">
                    Day {dayNum}<br/>
                    {count} Completions
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full rounded-t transition-all ${
                      count > 0
                        ? 'bg-gradient-to-t from-orange-600 to-orange-400 group-hover:from-orange-500 group-hover:to-orange-300'
                        : 'bg-zinc-900'
                    }`}
                  />

                  {/* Label */}
                  <span className="text-[8px] text-zinc-600 group-hover:text-white mt-1">
                    D{dayNum}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Streak Distribution (Horizontal Bars) */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h3 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
              <PieChart className="h-4 w-4 text-zinc-400" />
              STREAK DISTRIBUTION
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: '0 Days (Inactive)', count: streakDistribution.zero, color: 'bg-zinc-800' },
              { label: '1 - 5 Days', count: streakDistribution.oneToFive, color: 'bg-orange-600/60' },
              { label: '6 - 10 Days', count: streakDistribution.sixToTen, color: 'bg-orange-500/80' },
              { label: '11 - 15 Days', count: streakDistribution.elevenToFifteen, color: 'bg-orange-400' },
              { label: '16+ Days', count: streakDistribution.sixteenPlus, color: 'bg-amber-400' }
            ].map((dist, idx) => {
              const widthPct = Math.max((dist.count / maxStreakCount) * 100, 3)

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-400 font-semibold">{dist.label}</span>
                    <span className="text-white font-bold">{dist.count} users</span>
                  </div>
                  <div className="w-full bg-zinc-950/60 rounded border border-zinc-900 h-2">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded ${dist.color}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* Top Performers list */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Award className="h-4 w-4 text-yellow-500" />
          LEADERBOARD TOP PERFORMERS
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="text-[10px] text-zinc-500 border-b border-zinc-900 uppercase">
                <th className="py-2">Rank</th>
                <th className="py-2">User</th>
                <th className="py-2 text-center">Current Streak</th>
                <th className="py-2 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/40">
              {topPerformers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-zinc-500 italic">
                    No stats calculated yet.
                  </td>
                </tr>
              ) : (
                topPerformers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/10">
                    <td className="py-3 font-bold text-zinc-400">#{idx + 1}</td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{user.name}</span>
                        <span className="text-[10px] text-zinc-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-orange-400">
                        <Flame className="h-3.5 w-3.5" />
                        {user.streak} days
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-white">{user.score} pts</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
