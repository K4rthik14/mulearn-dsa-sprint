import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { Flame, CheckCircle2, Award, Calendar, BarChart2, Terminal } from 'lucide-react'

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  let dbStats = {
    score: 0,
    streak: 0,
    longestStreak: 0,
    completedCount: 0
  }

  let submissions: any[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    dbStats = {
      score: 50,
      streak: 5,
      longestStreak: 8,
      completedCount: 5
    }
    
    // Seed mock submissions for activity graph
    // Let's create submissions spread across the last 15 days
    const now = new Date()
    submissions = Array.from({ length: 5 }, (_, i) => {
      const date = new Date()
      date.setDate(now.getDate() - i * 2) // every other day
      return {
        submittedAt: date.toISOString(),
        status: 'approved'
      }
    })
  } else {
    try {
      const supabase = await createClient()

      // Fetch stats
      const { data: leadData } = await supabase
        .from('leaderboard')
        .select('score, streak, longestStreak')
        .eq('userId', user.id)
        .single()

      if (leadData) {
        dbStats.score = leadData.score
        dbStats.streak = leadData.streak
        dbStats.longestStreak = leadData.longestStreak
      }

      // Fetch user submissions
      const { data: subsData } = await supabase
        .from('submissions')
        .select('submittedAt, status')
        .eq('userId', user.id)
        .eq('status', 'approved')

      submissions = subsData || []
      dbStats.completedCount = submissions.length
    } catch (err) {
      console.error('Profile error:', err)
      isMock = true
    }
  }

  // Calculate completion percentage
  const completionPercentage = Math.round((dbStats.completedCount / 21) * 100)

  // Generate GitHub contribution grid: 12 weeks = 84 days
  // Grid has 7 rows (Sunday to Saturday) and 12 columns
  const totalDays = 84
  const gridCells = []
  const now = new Date()
  
  // Align start to Sunday of 12 weeks ago
  const startDay = new Date()
  startDay.setDate(now.getDate() - totalDays + 1)
  const startDayOffset = startDay.getDay()
  startDay.setDate(startDay.getDate() - startDayOffset) // Rollback to Sunday

  // Get active submission dates (YYYY-MM-DD format in local timezone)
  const submissionDates = submissions.map((s) => {
    const d = new Date(s.submittedAt)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  // Populate cell structures
  for (let i = 0; i < totalDays; i++) {
    const cellDate = new Date(startDay)
    cellDate.setDate(startDay.getDate() + i)
    
    const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`
    const hasSubmitted = submissionDates.includes(dateStr)
    
    gridCells.push({
      date: cellDate,
      dateString: dateStr,
      hasSubmitted
    })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-10">
      {/* Alert if using mock mode */}
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Showing demo profile stats and mock contribution calendar. Connect Supabase to sync your personal challenge log.
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">{user.name}</h1>
          <p className="text-sm text-zinc-400 mt-1 font-mono">{user.email}</p>
        </div>
        <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950/60 rounded-lg p-3">
          <Flame className="h-5 w-5 text-orange-500" />
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 font-mono leading-none">RANKING STATUS</span>
            <span className="text-sm font-bold text-white font-mono mt-1">Consistency Score: {dbStats.score}</span>
          </div>
        </div>
      </div>

      {/* Completion Progress Tracker */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold font-mono text-white flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-zinc-400" />
            CHALLENGE COMPLETION
          </span>
          <span className="text-sm font-bold font-mono text-orange-500">{completionPercentage}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-2.5 mb-2 overflow-hidden border border-zinc-950">
          <div
            className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[11px] font-mono text-zinc-500">
          <span>{dbStats.completedCount} Days Solved</span>
          <span>21 Days Total</span>
        </div>
      </div>

      {/* Streak Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500">CURRENT STREAK</span>
            <span className="text-xl font-bold text-white font-mono">{dbStats.streak} days</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500">LONGEST STREAK</span>
            <span className="text-xl font-bold text-white font-mono">{dbStats.longestStreak} days</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
            <Calendar className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-zinc-500">TOTAL COMPLETED</span>
            <span className="text-xl font-bold text-white font-mono">{dbStats.completedCount} challenges</span>
          </div>
        </div>
      </div>

      {/* GitHub-style Activity Contribution Graph */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h3 className="text-sm font-semibold font-mono text-white mb-6 flex items-center gap-2">
          <BarChart2 className="h-4.5 w-4.5 text-zinc-400" />
          ACTIVITY GRAPH
        </h3>

        <div className="flex flex-col gap-2 overflow-x-auto pb-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 justify-start min-w-[500px]">
            {gridCells.map((cell, index) => (
              <div
                key={cell.dateString}
                title={`${cell.date.toLocaleDateString()}: ${cell.hasSubmitted ? 'Solved' : 'No submission'}`}
                className={`h-3 w-3 rounded-[2px] transition-colors ${
                  cell.hasSubmitted
                    ? 'bg-orange-500 hover:bg-orange-400'
                    : 'bg-zinc-900 hover:bg-zinc-800'
                }`}
              />
            ))}
          </div>
          
          <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-2 max-w-lg">
            <span>{new Date(startDay).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
            <span>Today ({new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 bg-zinc-900 rounded-[1px]" />
              <div className="h-2.5 w-2.5 bg-orange-500 rounded-[1px]" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
