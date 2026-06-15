import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { 
  Flame, Trophy, Calendar, CheckCircle2, Lock, ArrowRight, 
  Award, Terminal, Megaphone, AlertCircle, AlertTriangle, Info 
} from 'lucide-react'
import ContestCountdown from '@/components/ContestCountdown'

// Curated list of topics to display on the dashboard progression
const TOPICS = [
  "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
  "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
  "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
  "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale Sprint"
]

export default async function DashboardPage() {
  const user = await getSessionUser()
  
  if (!user) {
    redirect('/login')
  }

  let dbStats = {
    score: 0,
    streak: 0,
    longestStreak: 0,
    rank: 1,
    completedDaysCount: 0
  }

  let challengeDays: any[] = []
  let completedDayNumbers: number[] = []
  let announcements: any[] = []
  let contests: any[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    dbStats = {
      score: 20,
      streak: 2,
      longestStreak: 5,
      rank: 4,
      completedDaysCount: 2
    }
    completedDayNumbers = [1, 2]
    challengeDays = Array.from({ length: 21 }, (_, i) => ({
      id: `mock-day-${i + 1}`,
      dayNumber: i + 1,
      topic: TOPICS[i] || 'DSA Practice',
      description: `Practice problems for Day ${i + 1}`
    }))
    announcements = [
      { id: '1', title: 'Day 21 Grand Finale Sprint rules', content: 'Ensure all submissions are approved before the countdown ends. The leaderboard will finalize exactly at midnight UTC.', priority: 'Important', createdAt: new Date().toISOString() },
      { id: '2', title: 'New LeetCode Problems added', content: 'Check the problems tab for updated links.', priority: 'Info', createdAt: new Date(Date.now() - 7200000).toISOString() }
    ]
    contests = [
      { id: 'c1', name: 'Sprint Milestone 1', startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000 * 2).toISOString(), contestLink: 'https://codeforces.com', contestType: 'Codeforces' }
    ]
  } else {
    try {
      const supabase = await createClient()

      // Fetch leaderboard stats
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

      // Fetch rank
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', dbStats.score)

      dbStats.rank = (count || 0) + 1

      // Fetch challenge days
      const { data: days } = await supabase
        .from('challengedays')
        .select('*')
        .order('dayNumber', { ascending: true })

      challengeDays = days || []

      if (challengeDays.length === 0) {
        challengeDays = Array.from({ length: 21 }, (_, i) => ({
          id: `db-placeholder-day-${i + 1}`,
          dayNumber: i + 1,
          topic: TOPICS[i] || 'DSA Practice',
          description: `Curated learning resources and coding tasks for Day ${i + 1}.`
        }))
      }

      // Fetch user approved submissions
      const { data: subs } = await supabase
        .from('submissions')
        .select('challengeDayId, challengedays(dayNumber)')
        .eq('userId', user.id)
        .eq('status', 'approved')

      if (subs) {
        completedDayNumbers = subs.map((s: any) => s.challengedays?.dayNumber || 0).filter(Boolean)
        dbStats.completedDaysCount = completedDayNumbers.length
      }

      // Fetch announcements
      const { data: dbAnnouncements } = await supabase
        .from('announcements')
        .select('*')
        .order('createdAt', { ascending: false })
      announcements = dbAnnouncements || []

      // Fetch contests
      const { data: dbContests } = await supabase
        .from('contests')
        .select('*')
      contests = dbContests || []
    } catch (err) {
      console.error('Dashboard error:', err)
      isMock = true
    }
  }

  // Calculate user's current unlocked day
  // Smallest day number that is NOT completed, up to max days
  let currentDayNumber = 1
  for (let i = 1; i <= 21; i++) {
    if (!completedDayNumbers.includes(i)) {
      currentDayNumber = i
      break
    }
  }
  
  if (completedDayNumbers.length === 21) {
    currentDayNumber = 21 // Fully completed
  }

  // Find the details of today's unlocked challenge
  const todayChallenge = challengeDays.find((d) => d.dayNumber === currentDayNumber) || challengeDays[0]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-10">
      {/* Alert if using mock mode */}
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Supabase is not configured yet. Showing mock journey data. Connect Supabase in `.env` to start tracking your real progress.
          </div>
        </div>
      )}

      {/* Live / Upcoming Contest countdown */}
      <ContestCountdown contests={contests} />

      {/* Header & Main Stats Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
            Welcome back, {user.name}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Build your coding habits, day by day. Keep the fire burning.
          </p>
        </div>
        <div>
          <Link
            href={`/dashboard/challenge?day=${currentDayNumber}`}
            className="group flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono"
          >
            Continue Today&apos;s Challenge (Day {currentDayNumber < 10 ? `0${currentDayNumber}` : currentDayNumber})
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">CURRENT DAY</span>
            <Calendar className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">Day {currentDayNumber < 10 ? `0${currentDayNumber}` : currentDayNumber}</span>
            <span className="text-xs text-zinc-500">/ 21</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">CURRENT STREAK</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{dbStats.streak}</span>
            <span className="text-xs text-zinc-500">{dbStats.streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">LONGEST STREAK</span>
            <Award className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{dbStats.longestStreak}</span>
            <span className="text-xs text-zinc-500">days max</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">TOTAL SCORE & RANK</span>
            <Trophy className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{dbStats.score} pts</span>
            <span className="text-xs text-zinc-400 font-mono">#{dbStats.rank}</span>
          </div>
        </div>
      </div>

      {/* Announcements Block */}
      {announcements.length > 0 && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4 font-mono">
          <h2 className="text-sm font-semibold text-white uppercase flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-orange-500" />
            ANNOUNCEMENTS & UPDATES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 4).map((ann) => (
              <div key={ann.id} className="p-4 rounded-lg border border-zinc-900 bg-zinc-950/40 flex items-start gap-3">
                {ann.priority === 'Important' ? (
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                ) : ann.priority === 'Warning' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white leading-tight">{ann.title}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Journey Road */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-8">
        <h2 className="text-lg font-semibold text-white font-mono mb-6 flex items-center gap-2">
          Challenge Road
          <span className="text-xs font-normal text-zinc-500 font-sans">(Day 1 to Day 21 progression)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {challengeDays.map((day) => {
            const isCompleted = completedDayNumbers.includes(day.dayNumber)
            const isCurrent = day.dayNumber === currentDayNumber
            const isLocked = day.dayNumber > currentDayNumber

            let borderClass = "border-zinc-900 bg-zinc-950/20"
            let textClass = "text-zinc-500"
            let icon = <Lock className="h-4 w-4 text-zinc-700" />

            if (isCompleted) {
              borderClass = "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
              textClass = "text-white"
              icon = <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            } else if (isCurrent) {
              borderClass = "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
              textClass = "text-white"
              icon = <Flame className="h-4 w-4 text-orange-500" />
            }

            return (
              <Link
                key={day.id}
                href={isLocked ? '#' : `/dashboard/challenge?day=${day.dayNumber}`}
                className={`group rounded-xl border p-4 flex flex-col justify-between h-36 transition-all ${borderClass} ${
                  isLocked ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-500">
                    DAY {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                  </span>
                  {icon}
                </div>
                <div>
                  <h4 className={`text-xs font-semibold leading-tight line-clamp-2 ${textClass}`}>
                    {day.topic}
                  </h4>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 font-mono flex items-center gap-0.5 mt-2 transition-colors">
                    {isLocked ? 'Locked' : isCompleted ? 'Solved' : 'Solve now'}
                    {!isLocked && <ArrowRight className="h-3 w-3 inline transition-transform group-hover:translate-x-0.5" />}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
