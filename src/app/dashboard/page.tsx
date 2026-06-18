import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser, isUserAdmin } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { 
  Flame, Trophy, Calendar, CheckCircle2, Lock, ArrowRight, 
  Award, Terminal, Megaphone, AlertCircle, AlertTriangle, Info,
  BookOpen, Plus, Sparkles, ExternalLink, HelpCircle
} from 'lucide-react'
import ContestCountdown from '@/components/ContestCountdown'
import { enrollInSprint, leaveSprint } from '@/app/actions/sprints'
import { seedSprintsAction } from '@/app/actions/seed'

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

  const isAdminUser = isUserAdmin(user)

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
  let announcements: any[] = []
  let contests: any[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    dbStats = {
      score: 45,
      streak: 3,
      longestStreak: 8,
      rank: 2
    }
    allSprints = [
      {
        id: 'mock-sprint-1',
        name: '21-Day DSA Habit Builder',
        slug: 'dsa-habit-21',
        description: 'Build consistency with 21 days of step-by-step topics, from arrays and hash maps to graphs and DP.',
        durationDays: 21
      },
      {
        id: 'mock-sprint-2',
        name: 'Blind 75 Interview Prep',
        slug: 'blind-75',
        description: 'Master the high-frequency LeetCode questions most commonly asked in technical interviews.',
        durationDays: 15
      },
      {
        id: 'mock-sprint-3',
        name: '7-Day DP Intensive',
        slug: 'dp-intensive-7',
        description: 'Conquer Dynamic Programming. Covers memoization, grids, knapsack, and sequence matching.',
        durationDays: 7
      }
    ]
    
    // Simulate user enrolled in the first sprint
    userEnrollments = [
      {
        sprintId: 'mock-sprint-1',
        sprints: allSprints[0]
      }
    ]

    activeSprintDays = Array.from({ length: 21 }, (_, i) => ({
      id: `mock-day-${i + 1}`,
      dayNumber: i + 1,
      topic: [
        "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
        "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
        "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
        "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale Sprint"
      ][i] || 'DSA Practice',
      description: `Practice problems for Day ${i + 1}`
    }))

    completedDayIds = [`mock-day-1`, `mock-day-2`, `mock-day-3`]
    
    announcements = [
      { id: '1', title: 'DSA Sprint Seeding Complete', content: 'Select any active track to begin your habits catalog.', priority: 'Info', createdAt: new Date().toISOString() }
    ]
  } else {
    try {
      const supabase = await createClient()

      // 1. Fetch leaderboard stats
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

      // 2. Fetch global ranking
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', dbStats.score)
      dbStats.rank = (count || 0) + 1

      // 3. Fetch all sprints
      const { data: sprintsData } = await supabase
        .from('sprints')
        .select('*')
        .order('createdAt', { ascending: true })
      allSprints = sprintsData || []

      // 4. Fetch user enrollments
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

      // 5. Determine currently selected sprint
      let activeEnrollment = null
      if (userEnrollments.length > 0) {
        if (selectedSprintSlug) {
          activeEnrollment = userEnrollments.find(e => e.sprints?.slug === selectedSprintSlug)
        }
        if (!activeEnrollment) {
          activeEnrollment = userEnrollments[0]
        }
      }

      // 6. Fetch days for currently active sprint
      if (activeEnrollment && activeEnrollment.sprints) {
        const sprintId = activeEnrollment.sprints.id
        const { data: days } = await supabase
          .from('challengedays')
          .select('*')
          .eq('sprintId', sprintId)
          .order('dayNumber', { ascending: true })
        activeSprintDays = days || []

        // Fetch user submissions for this sprint's days
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

      // 7. Fetch announcements
      const { data: dbAnnouncements } = await supabase
        .from('announcements')
        .select('*')
        .order('createdAt', { ascending: false })
      announcements = dbAnnouncements || []

      // 8. Fetch contests
      const { data: dbContests } = await supabase
        .from('contests')
        .select('*')
      contests = dbContests || []
    } catch (err) {
      console.error('Dashboard error:', err)
      isMock = true
    }
  }

  // Find active sprint detail
  const currentSprint = userEnrollments.find(e => {
    if (selectedSprintSlug) return e.sprints?.slug === selectedSprintSlug
    return true
  })?.sprints || userEnrollments[0]?.sprints

  // Determine current day number
  let currentDayNumber = 1
  let nextDayToSolve: any = null

  if (activeSprintDays.length > 0) {
    // A day is unlocked if:
    // It's Day 1, OR its previous day (dayNumber - 1) is completed
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

    // Fallback if all days are solved
    if (!firstUnsolvedFound) {
      currentDayNumber = activeSprintDays.length
      nextDayToSolve = activeSprintDays[activeSprintDays.length - 1]
    }
  }

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
      {contests.length > 0 && <ContestCountdown contests={contests} />}

      {/* Header & Main Stats Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono">
            Welcome back, {user.name || 'User'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Build your coding habits, day by day. Keep the fire burning.
          </p>
        </div>

        {userEnrollments.length > 0 && nextDayToSolve && (
          <div>
            <Link
              href={`/dashboard/challenge?sprint=${currentSprint.slug}&day=${currentDayNumber}`}
              className="group flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono"
            >
              Continue Today&apos;s Challenge (Day {currentDayNumber < 10 ? `0${currentDayNumber}` : currentDayNumber})
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">ENROLLED TRACKS</span>
            <BookOpen className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{userEnrollments.length}</span>
            <span className="text-xs text-zinc-500">active</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">CURRENT STREAK</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{dbStats.streak}</span>
            <span className="text-xs text-zinc-500">{dbStats.streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">LONGEST STREAK</span>
            <Award className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{dbStats.longestStreak}</span>
            <span className="text-xs text-zinc-500">days max</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
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

      {/* Seeding Box for Admin */}
      {!isMock && isAdminUser && allSprints.length === 0 && (
        <div className="rounded-xl border border-dashed border-orange-500/30 bg-orange-950/5 p-6 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto">
          <Sparkles className="h-10 w-10 text-orange-500" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Database Empty: Seed Default Sprints</h3>
            <p className="text-xs text-zinc-450 mt-1 max-w-md">
              No sprints or challenge days were found in your Supabase database. Click below to automatically seed the default tracks: 21-Day Habit Builder, Blind 75, and 7-Day DP Intensive.
            </p>
          </div>
          <form action={async () => {
            'use server'
            await seedSprintsAction()
          }}>
            <button
              type="submit"
              className="rounded bg-white hover:bg-zinc-200 px-5 py-2 text-xs font-mono font-bold text-black transition-all cursor-pointer"
            >
              Seed Sprints & Challenges
            </button>
          </form>
        </div>
      )}

      {/* Main Content Layout */}
      {userEnrollments.length === 0 ? (
        /* Empty Enrollment Catalog Screen */
        <div className="space-y-8">
          <div className="border-b border-zinc-900 pb-4">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Enroll in a DSA Sprint
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Select one of the curriculums below to activate your progress timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allSprints.length === 0 ? (
              <div className="col-span-full py-16 text-center rounded-xl border border-zinc-900 bg-zinc-950/20">
                <HelpCircle className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
                <p className="text-xs text-zinc-500 font-mono">No sprints available. If you are an admin, click Seed Sprints above.</p>
              </div>
            ) : (
              allSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-zinc-850 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        {sprint.durationDays} Days Track
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white font-mono">{sprint.name}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{sprint.description}</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-zinc-900/60">
                    <form action={async () => {
                      'use server'
                      await enrollInSprint(sprint.id)
                    }}>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 rounded bg-white hover:bg-zinc-200 py-2 text-xs font-mono font-bold text-black transition-all cursor-pointer"
                      >
                        Start Sprint
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Enrolled Road Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Progress Journey Road */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/30 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <span className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-wider">
                  ACTIVE SPRINT ROADMAP
                </span>
                <h2 className="text-xl font-bold text-white font-mono mt-1">
                  {currentSprint.name}
                </h2>
              </div>
              
              {/* Quit Sprint Button */}
              {!isMock && (
                <form action={async () => {
                  'use server'
                  await leaveSprint(currentSprint.id)
                }}>
                  <button
                    type="submit"
                    className="text-[10px] font-mono text-zinc-500 hover:text-red-400 transition-colors border border-zinc-900 hover:border-red-900/30 bg-zinc-950 px-2.5 py-1 rounded cursor-pointer"
                  >
                    Leave Track
                  </button>
                </form>
              )}
            </div>

            {activeSprintDays.length === 0 ? (
              <p className="text-xs text-zinc-500 italic font-mono py-6">No days configured for this sprint track.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeSprintDays.map((day) => {
                  const isCompleted = completedDayIds.includes(day.id)
                  
                  // Unlock logic:
                  // Day 1 is always unlocked
                  // Other days are unlocked if their unlockDay is completed, OR if dayNumber-1 is completed
                  const completedDaysSet = new Set(
                    activeSprintDays.filter(d => completedDayIds.includes(d.id)).map(d => d.dayNumber)
                  )
                  
                  const isUnlocked = day.dayNumber === 1 || 
                                     (day.unlockDay ? completedDaysSet.has(day.unlockDay) : completedDaysSet.has(day.dayNumber - 1))

                  const isCurrent = day.dayNumber === currentDayNumber && !isCompleted && isUnlocked

                  let borderClass = "border-zinc-900 bg-zinc-950/10 opacity-40 cursor-not-allowed"
                  let textClass = "text-zinc-600"
                  let icon = <Lock className="h-3.5 w-3.5 text-zinc-800" />
                  let linkTarget = "#"

                  if (isCompleted) {
                    borderClass = "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:scale-[1.02]"
                    textClass = "text-zinc-300"
                    icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    linkTarget = `/dashboard/challenge?sprint=${currentSprint.slug}&day=${day.dayNumber}`
                  } else if (isUnlocked) {
                    linkTarget = `/dashboard/challenge?sprint=${currentSprint.slug}&day=${day.dayNumber}`
                    if (isCurrent) {
                      borderClass = "border-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:scale-[1.02]"
                      textClass = "text-white"
                      icon = <Flame className="h-3.5 w-3.5 text-orange-500" />
                    } else {
                      borderClass = "border-zinc-800 bg-zinc-950/30 hover:border-zinc-700 hover:scale-[1.02] opacity-80"
                      textClass = "text-zinc-400"
                      icon = <Sparkles className="h-3.5 w-3.5 text-zinc-650" />
                    }
                  }

                  return (
                    <Link
                      key={day.id}
                      href={linkTarget}
                      className={`group rounded-xl border p-4 flex flex-col justify-between h-32 transition-all ${borderClass}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-zinc-500">
                          DAY {day.dayNumber < 10 ? `0${day.dayNumber}` : day.dayNumber}
                        </span>
                        {icon}
                      </div>
                      <div>
                        <h4 className={`text-xs font-semibold leading-tight line-clamp-2 ${textClass}`}>
                          {day.topic}
                        </h4>
                        <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono flex items-center gap-0.5 mt-2 transition-colors">
                          {!isUnlocked ? 'Locked' : isCompleted ? 'Completed' : isCurrent ? 'Solve Today' : 'Solve Now'}
                          {isUnlocked && <ArrowRight className="h-2.5 w-2.5 inline transition-transform group-hover:translate-x-0.5" />}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar Sprints & Announcements */}
          <div className="space-y-6">
            {/* My Tracks Selector */}
            {userEnrollments.length > 1 && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3">
                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
                  MY TRACKS
                </h3>
                <div className="space-y-2">
                  {userEnrollments.map((enr) => {
                    const isActive = enr.sprints.slug === currentSprint.slug
                    return (
                      <Link
                        key={enr.sprintId}
                        href={`/dashboard?sprint=${enr.sprints.slug}`}
                        className={`block p-2.5 rounded border text-xs font-mono transition-all ${
                          isActive 
                            ? 'border-orange-500/30 bg-orange-500/10 text-white font-bold'
                            : 'border-zinc-900 bg-zinc-950 hover:border-zinc-850 text-zinc-400'
                        }`}
                      >
                        {enr.sprints.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Catalog Browser link */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
                  EXPLORE TRACKS
                </h3>
                <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                  Looking for another track? Browse and enroll in more code challenges.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {allSprints
                  .filter(s => !userEnrollments.some(e => e.sprintId === s.id))
                  .map(sprint => (
                    <form key={sprint.id} action={async () => {
                      'use server'
                      await enrollInSprint(sprint.id)
                    }}>
                      <button
                        type="submit"
                        className="w-full text-left p-2.5 rounded border border-zinc-900 hover:border-zinc-800 bg-zinc-950 text-[11px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex justify-between items-center"
                      >
                        <span>Start {sprint.name}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </form>
                  ))}
              </div>
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-4">
                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="h-4 w-4 text-orange-500" />
                  ANNOUNCEMENTS
                </h3>
                <div className="space-y-3 divide-y divide-zinc-900/60">
                  {announcements.slice(0, 3).map((ann, idx) => (
                    <div key={ann.id} className={`space-y-1 ${idx > 0 ? 'pt-3' : ''}`}>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1 font-mono leading-tight">
                        {ann.priority === 'Important' && <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />}
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-normal whitespace-pre-wrap">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
