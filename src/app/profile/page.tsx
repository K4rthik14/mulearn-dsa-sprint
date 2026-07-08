import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface ProfileSprintProgress {
  id: string
  name: string
  slug: string
  totalDays: number
  completedDays: number
  days: {
    id: string
    dayNumber: number
    topic: string
    isCompleted: boolean
  }[]
}

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  let dbStats = {
    score: 0,
    streak: 0,
    longestStreak: 0
  }

  let sprintProgresses: ProfileSprintProgress[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    dbStats = { score: 40, streak: 4, longestStreak: 8 }
    sprintProgresses = [
      {
        id: 'mock-sprint-1',
        name: '21-Day DSA Habit Builder',
        slug: 'dsa-habit-21',
        totalDays: 21,
        completedDays: 4,
        days: Array.from({ length: 21 }, (_, i) => ({
          id: `mock-day-${i + 1}`,
          dayNumber: i + 1,
          topic: [
            "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
            "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
            "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
            "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale"
          ][i] || 'DSA Practice',
          isCompleted: i + 1 <= 4
        }))
      }
    ]
  } else {
    try {
      const supabase = await createClient()

      // Fetch user stats
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

      // Fetch enrolled sprints
      const { data: enrollments } = await supabase
        .from('user_sprints')
        .select(`
          sprintId,
          sprints (
            id,
            name,
            slug,
            durationDays
          )
        `)
        .eq('userId', user.id)

      const enrollList = enrollments || []

      // For each sprint, load days and user completion
      for (const enr of enrollList) {
        const sprint = enr.sprints
        if (!sprint) continue

        const { data: days } = await supabase
          .from('challengedays')
          .select('id, dayNumber, topic')
          .eq('sprintId', sprint.id)
          .order('dayNumber', { ascending: true })

        const daysList = days || []
        const dayIds = daysList.map(d => d.id)

        let completedDayIds: string[] = []
        if (dayIds.length > 0) {
          const { data: subs } = await supabase
            .from('submissions')
            .select('challengeDayId')
            .eq('userId', user.id)
            .eq('status', 'approved')
            .in('challengeDayId', dayIds)
          completedDayIds = subs ? subs.map((s: any) => s.challengeDayId) : []
        }

        sprintProgresses.push({
          id: sprint.id,
          name: sprint.name,
          slug: sprint.slug,
          totalDays: sprint.durationDays,
          completedDays: completedDayIds.length,
          days: daysList.map(d => ({
            id: d.id,
            dayNumber: d.dayNumber,
            topic: d.topic,
            isCompleted: completedDayIds.includes(d.id)
          }))
        })
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex-1 flex flex-col gap-8 font-mono text-xs">
      {isMock && (
        <div className="border border-blue-900 bg-blue-950/10 p-3 text-[10px] text-blue-400">
          [demo mode] Connect Supabase to start tracking real progress.
        </div>
      )}

      {/* Profile Header */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-base font-bold text-white uppercase tracking-tight">{user.name || 'Developer Profile'}</h1>
        <p className="text-zinc-500 mt-1">{user.email}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 border border-zinc-850 bg-zinc-950/10 rounded divide-x divide-zinc-850 p-4 text-center">
        <div>
          <span className="block text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Total Score</span>
          <span className="text-sm font-bold text-white mt-1 block">{dbStats.score} pts</span>
        </div>
        <div>
          <span className="block text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Current Streak</span>
          <span className="text-sm font-bold text-blue-500 mt-1 block">{dbStats.streak} days</span>
        </div>
        <div>
          <span className="block text-zinc-500 uppercase tracking-widest text-[9px] font-bold">Longest Streak</span>
          <span className="text-sm font-bold text-white mt-1 block">{dbStats.longestStreak} days</span>
        </div>
      </div>

      {/* Track Progress Checklists */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold text-white uppercase tracking-wide">Track Progress Checklists</h2>
        
        {sprintProgresses.length === 0 ? (
          <div className="border border-zinc-850 p-6 text-center text-zinc-500 italic">
            You are not enrolled in any coding tracks. Go to the <Link href="/tracks" className="text-blue-500 underline">Tracks</Link> page to join.
          </div>
        ) : (
          <div className="space-y-6">
            {sprintProgresses.map(progress => {
              const percentage = progress.totalDays > 0 ? Math.round((progress.completedDays / progress.totalDays) * 100) : 0
              return (
                <div key={progress.id} className="border border-zinc-850 p-4 rounded bg-zinc-950/20 space-y-3.5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-zinc-200">{progress.name}</span>
                    <span className="text-zinc-500">{progress.completedDays}/{progress.totalDays} Days ({percentage}%)</span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="h-1 bg-zinc-900 rounded overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${percentage}%` }}></div>
                  </div>

                  {/* Plain Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pt-2 border-t border-zinc-900">
                    {progress.days.map(day => (
                      <div key={day.id} className={`flex items-baseline gap-2 ${day.isCompleted ? 'text-zinc-300' : 'text-zinc-500 opacity-60'}`}>
                        <span className="w-4 text-center select-none font-bold">
                          {day.isCompleted ? '✓' : '○'}
                        </span>
                        <Link href={`/challenge?sprint=${progress.slug}&day=${day.dayNumber}`} className="hover:text-blue-400 truncate">
                          Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}: {day.topic}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
