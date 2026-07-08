import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { leaveSprint } from '@/app/actions/sprints'

interface DashboardSearchParams {
  sprint?: string
}

export default async function DashboardPage(props: { searchParams: Promise<DashboardSearchParams> }) {
  const searchParams = await props.searchParams
  const selectedSprintSlug = searchParams.sprint

  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  let dbStats = {
    score: 0,
    streak: 0,
    longestStreak: 0,
    rank: 1
  }

  let allSprints: any[] = []
  let userEnrollments: any[] = []
  let activeSprintDays: any[] = []
  let completedDayIds: string[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    dbStats = {
      score: 40,
      streak: 4,
      longestStreak: 8,
      rank: 2
    }
    allSprints = [
      { id: 'mock-sprint-1', name: '21-Day DSA Habit Builder', slug: 'dsa-habit-21', description: 'Build consistency with 21 days of step-by-step topics, from arrays and hash maps to graphs and DP.', durationDays: 21 },
      { id: 'mock-sprint-2', name: 'Blind 75 Interview Prep', slug: 'blind-75', description: 'Master the high-frequency LeetCode questions most commonly asked in technical interviews.', durationDays: 15 }
    ]
    userEnrollments = [
      { sprintId: 'mock-sprint-1', sprints: allSprints[0] }
    ]
    activeSprintDays = Array.from({ length: 21 }, (_, i) => ({
      id: `mock-day-${i + 1}`,
      dayNumber: i + 1,
      topic: [
        "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
        "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
        "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
        "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale"
      ][i] || 'DSA Practice',
      description: `Practice problems for Day ${i + 1}`
    }))
    completedDayIds = [`mock-day-1`, `mock-day-2`, `mock-day-3`, `mock-day-4`]
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

      // Fetch user enrollments
      const { data: enrollmentsData } = await supabase
        .from('user_sprints')
        .select(`
          sprintId,
          enrolledAt,
          completedAt,
          sprints (
            id,
            name,
            slug,
            description,
            durationDays
          )
        `)
        .eq('userId', user.id)
      userEnrollments = enrollmentsData || []

      // Determine active enrollment
      let activeEnrollment = null
      if (userEnrollments.length > 0) {
        if (selectedSprintSlug) {
          activeEnrollment = userEnrollments.find(e => e.sprints?.slug === selectedSprintSlug)
        }
        if (!activeEnrollment) {
          activeEnrollment = userEnrollments[0]
        }
      }

      // Fetch days for active sprint
      if (activeEnrollment && activeEnrollment.sprints) {
        const sprintId = activeEnrollment.sprints.id
        const { data: days } = await supabase
          .from('challengedays')
          .select('*')
          .eq('sprintId', sprintId)
          .order('dayNumber', { ascending: true })
        activeSprintDays = days || []

        if (activeSprintDays.length > 0) {
          const dayIds = activeSprintDays.map(d => d.id)
          const { data: subs } = await supabase
            .from('submissions')
            .select('challengeDayId')
            .eq('userId', user.id)
            .eq('status', 'approved')
            .in('challengeDayId', dayIds)
          completedDayIds = subs ? subs.map((s: any) => s.challengeDayId) : []
        }
      }
    } catch (err) {
      console.error('Failed to load active track roadmap:', err)
      isMock = true
    }
  }

  // Find active sprint detail
  const currentSprint = userEnrollments.find(e => {
    if (selectedSprintSlug) return e.sprints?.slug === selectedSprintSlug
    return true
  })?.sprints || userEnrollments[0]?.sprints

  // Group active days by weeks (7 days per week)
  const weeksMap: { [key: number]: any[] } = {}
  activeSprintDays.forEach(day => {
    const weekNum = Math.ceil(day.dayNumber / 7)
    if (!weeksMap[weekNum]) {
      weeksMap[weekNum] = []
    }
    weeksMap[weekNum].push(day)
  })

  // Determine current active day number
  let currentDayNumber = 1
  let nextDayToSolve: any = null

  if (activeSprintDays.length > 0) {
    const completedDaysSet = new Set(
      activeSprintDays.filter(d => completedDayIds.includes(d.id)).map(d => d.dayNumber)
    )

    let firstUnsolvedFound = false
    for (const d of activeSprintDays) {
      const isCompleted = completedDayIds.includes(d.id)
      const isUnlocked = d.dayNumber === 1 || 
                         (d.unlockDay ? completedDaysSet.has(d.unlockDay) : completedDaysSet.has(d.dayNumber - 1))

      if (!isCompleted && isUnlocked && !firstUnsolvedFound) {
        currentDayNumber = d.dayNumber
        nextDayToSolve = d
        firstUnsolvedFound = true
      }
    }

    if (!firstUnsolvedFound) {
      currentDayNumber = activeSprintDays.length
      nextDayToSolve = activeSprintDays[activeSprintDays.length - 1]
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex-1 flex flex-col gap-8 font-mono">
      {isMock && (
        <div className="border border-blue-900 bg-blue-950/10 p-3 text-xs text-blue-400">
          [demo mode] Connect Supabase to start tracking real progress.
        </div>
      )}

      {/* Header & Stats Banner */}
      <div className="border-b border-zinc-800 pb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-white uppercase tracking-tight">
            {userEnrollments.length > 0 ? currentSprint.name : 'DSA Curriculums'}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {userEnrollments.length > 0 
              ? currentSprint.description 
              : 'You are not enrolled in any coding track yet.'}
          </p>
        </div>

        {userEnrollments.length > 0 && (
          <div className="text-[11px] text-zinc-400 flex gap-4">
            <span>Streak: <strong className="text-blue-500">{dbStats.streak}d</strong></span>
            <span>Score: <strong className="text-white">{dbStats.score}pts</strong></span>
            <span>Rank: <strong className="text-white">#{dbStats.rank}</strong></span>
          </div>
        )}
      </div>

      {/* Active Track View */}
      {userEnrollments.length === 0 ? (
        <div className="border border-zinc-850 p-6 text-center text-xs">
          <p className="text-zinc-500">No active tracks. Go to the tracks page to choose one and begin.</p>
          <Link
            href="/tracks"
            className="mt-4 inline-block border border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded text-[11px] text-zinc-350 hover:text-white transition-colors"
          >
            Explore Tracks
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Column: Progress Checklist */}
          <div className="md:col-span-2 space-y-6">
            {Object.keys(weeksMap).map(weekStr => {
              const weekNum = parseInt(weekStr)
              const weekDays = weeksMap[weekNum]
              return (
                <div key={weekNum} className="space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-1">
                    Week {weekNum}
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {weekDays.map(day => {
                      const isCompleted = completedDayIds.includes(day.id)
                      const completedDaysSet = new Set(
                        activeSprintDays.filter(d => completedDayIds.includes(d.id)).map(d => d.dayNumber)
                      )
                      const isUnlocked = day.dayNumber === 1 || 
                                         (day.unlockDay ? completedDaysSet.has(day.unlockDay) : completedDaysSet.has(day.dayNumber - 1))

                      const isCurrent = day.dayNumber === currentDayNumber && !isCompleted && isUnlocked

                      let marker = "○"
                      let itemClass = "text-zinc-500"
                      let linkClass = "pointer-events-none"

                      if (isCompleted) {
                        marker = "✓"
                        itemClass = "text-zinc-300"
                        linkClass = "hover:text-blue-500 hover:underline"
                      } else if (isUnlocked) {
                        itemClass = isCurrent ? "text-blue-400 font-bold" : "text-zinc-400"
                        linkClass = "hover:text-blue-500 hover:underline"
                      }

                      return (
                        <div key={day.id} className={`flex items-baseline gap-2.5 ${itemClass}`}>
                          <span className="w-4 select-none text-[10px] font-bold text-center">
                            {marker}
                          </span>
                          {isUnlocked ? (
                            <Link
                              href={`/challenge?sprint=${currentSprint.slug}&day=${day.dayNumber}`}
                              className={`flex-1 transition-colors ${linkClass}`}
                            >
                              Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber} - {day.topic}
                            </Link>
                          ) : (
                            <span className="flex-1 opacity-40">
                              Day {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber} - {day.topic} [Locked]
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Track switching / options */}
          <div className="space-y-6">
            {userEnrollments.length > 1 && (
              <div className="border border-zinc-850 p-4 rounded bg-zinc-950/20 space-y-2.5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Switch Tracks</div>
                <div className="space-y-1.5 text-xs">
                  {userEnrollments.map(enr => {
                    const isActive = enr.sprints.slug === currentSprint.slug
                    return (
                      <Link
                        key={enr.sprintId}
                        href={`/?sprint=${enr.sprints.slug}`}
                        className={`block p-1.5 rounded transition-colors ${
                          isActive 
                            ? 'bg-blue-950/25 border border-blue-900/40 text-blue-400 font-bold'
                            : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        {enr.sprints.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="border border-zinc-850 p-4 rounded bg-zinc-950/20 space-y-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Track Actions</div>
              <form action={async () => {
                'use server'
                await leaveSprint(currentSprint.id)
                redirect('/tracks')
              }}>
                <button
                  type="submit"
                  className="w-full text-left text-xs text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                >
                  Leave this track
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
