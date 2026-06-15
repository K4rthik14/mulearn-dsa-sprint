'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, ExternalLink, Globe } from 'lucide-react'

interface Contest {
  id: string
  name: string
  startTime: string
  endTime: string
  contestLink: string
  contestType: 'Codeforces' | 'HackerRank' | 'External'
}

interface ContestCountdownProps {
  contests: Contest[]
}

export default function ContestCountdown({ contests }: ContestCountdownProps) {
  const [activeContest, setActiveContest] = useState<Contest | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isLive, setIsLive] = useState<boolean>(false)

  useEffect(() => {
    const checkContests = () => {
      const now = new Date()
      
      // Find an active contest or the next upcoming contest starting in less than 24 hours
      const live = contests.find(c => {
        const start = new Date(c.startTime)
        const end = new Date(c.endTime)
        return now >= start && now <= end
      })

      if (live) {
        setActiveContest(live)
        setIsLive(true)
        calculateTimeLeft(new Date(live.endTime))
        return
      }

      const upcoming = contests
        .filter(c => new Date(c.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

      if (upcoming) {
        // If starting in less than 24 hours (or just show it anyway)
        setActiveContest(upcoming)
        setIsLive(false)
        calculateTimeLeft(new Date(upcoming.startTime))
      } else {
        setActiveContest(null)
      }
    }

    const calculateTimeLeft = (targetDate: Date) => {
      const difference = targetDate.getTime() - new Date().getTime()
      if (difference <= 0) {
        setTimeLeft('Ended')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      let timeString = ''
      if (days > 0) timeString += `${days}d `
      timeString += `${hours.toString().padStart(2, '0')}h `
      timeString += `${minutes.toString().padStart(2, '0')}m `
      timeString += `${seconds.toString().padStart(2, '0')}s`

      setTimeLeft(timeString)
    }

    checkContests()
    const timer = setInterval(() => {
      checkContests()
    }, 1000)

    return () => clearInterval(timer)
  }, [contests])

  if (!activeContest) return null

  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_0_20px_rgba(249,115,22,0.05)] font-mono">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {isLive ? 'LIVE CONTEST RUNNING' : 'UPCOMING MILESTONE CONTEST'}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-white">
          {activeContest.name}
        </h3>
        <p className="text-xs text-zinc-400">
          Platform: <span className="text-orange-400 font-bold">{activeContest.contestType}</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Countdown */}
        <div className="space-y-1">
          <span className="text-[9px] text-zinc-500 block uppercase">
            {isLive ? 'Time Remaining' : 'Starts In'}
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            {timeLeft}
          </span>
        </div>

        {/* Action button */}
        <a
          href={activeContest.contestLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-all cursor-pointer"
        >
          <ExternalLink className="h-4 w-4" />
          ENTER CONTEST
        </a>
      </div>
    </div>
  )
}
