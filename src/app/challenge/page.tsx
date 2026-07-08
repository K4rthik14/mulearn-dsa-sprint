import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ChallengeSubmissionForm from '@/components/ChallengeSubmissionForm'

interface SearchParams {
  sprint?: string
  day?: string
}

export default async function ChallengePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const requestedSprintSlug = searchParams.sprint
  const requestedDayNumStr = searchParams.day

  let isMock = false
  let currentSprint: any = null
  let currentChallengeDay: any = null
  let resources: any[] = []
  let problems: any[] = []
  let completedDayIds: string[] = []
  let completedDayNumbers: number[] = []
  let existingSubmission: any = null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const hasParams = requestedSprintSlug && requestedDayNumStr

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    currentSprint = { id: 'mock-sprint-1', name: '21-Day DSA Habit Builder', slug: 'dsa-habit-21' }
    const dayNum = parseInt(requestedDayNumStr || '1', 10)
    currentChallengeDay = {
      id: `mock-day-${dayNum}`,
      dayNumber: dayNum,
      topic: [
        "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
        "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
        "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
        "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale"
      ][dayNum - 1] || 'DSA Practice',
      description: `Learn the fundamentals of intermediate algorithms and solve typical interview questions.`
    }
    resources = [
      { id: 'r1', title: 'Topic Introduction Walkthrough', url: 'https://youtube.com', type: 'YouTube' },
      { id: 'r2', title: 'Practice Patterns Guide', url: 'https://leetcode.com', type: 'Article' }
    ]
    problems = [
      { id: 'p1', title: 'Curated Practice 1', difficulty: 'Easy', platform: 'LeetCode', points: 10, url: 'https://leetcode.com' },
      { id: 'p2', title: 'Curated Practice 2', difficulty: 'Medium', platform: 'LeetCode', points: 10, url: 'https://leetcode.com' }
    ]
    completedDayNumbers = [1, 2]
    if (completedDayNumbers.includes(dayNum)) {
      existingSubmission = {
        id: 'mock-sub-1',
        profileLink: 'https://github.com/example/dsa-solution',
        screenshotUrl: 'GitHub Repository',
        status: 'approved',
        submittedAt: new Date().toISOString()
      }
    }
  } else {
    try {
      const supabase = await createClient()

      // Fetch user enrollments to handle auto-redirect or validation
      const { data: enrollmentsData } = await supabase
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

      const enrollments = enrollmentsData || []

      if (enrollments.length === 0) {
        // Not enrolled in any track
        redirect('/')
      }

      // Determine target sprint
      let activeEnrollment = null
      if (requestedSprintSlug) {
        activeEnrollment = enrollments.find(e => (e.sprints as any)?.slug === requestedSprintSlug)
      }
      if (!activeEnrollment) {
        activeEnrollment = enrollments[0]
      }

      currentSprint = Array.isArray(activeEnrollment.sprints)
        ? activeEnrollment.sprints[0]
        : activeEnrollment.sprints

      // Fetch all challenge days of this sprint to compute unlock states
      const { data: sprintDays } = await supabase
        .from('challengedays')
        .select('*')
        .eq('sprintId', currentSprint.id)
        .order('dayNumber', { ascending: true })

      const daysList = sprintDays || []

      if (daysList.length === 0) {
        redirect('/')
      }

      // Fetch approved submissions
      const dayIds = daysList.map(d => d.id)
      const { data: userSubs } = await supabase
        .from('submissions')
        .select('challengeDayId, status, challengedays(dayNumber)')
        .eq('userId', user.id)
        .in('challengeDayId', dayIds)

      const approvedSubs = userSubs ? userSubs.filter((s: any) => s.status === 'approved') : []
      completedDayIds = approvedSubs.map((s: any) => s.challengeDayId)
      completedDayNumbers = approvedSubs.map((s: any) => s.challengedays?.dayNumber || 0).filter(Boolean)

      // Auto-redirect if sprint/day parameters are missing or invalid
      if (!hasParams) {
        let activeDayNum = 1
        const completedDaysSet = new Set(completedDayNumbers)
        for (const d of daysList) {
          const isDayCompleted = completedDayIds.includes(d.id)
          const isDayUnlocked = d.dayNumber === 1 || 
                                (d.unlockDay ? completedDaysSet.has(d.unlockDay) : completedDaysSet.has(d.dayNumber - 1))
          
          if (!isDayCompleted && isDayUnlocked) {
            activeDayNum = d.dayNumber
            break
          }
        }
        redirect(`/challenge?sprint=${currentSprint.slug}&day=${activeDayNum}`)
      }

      const targetDayNum = parseInt(requestedDayNumStr!, 10)
      const requestedDay = daysList.find(d => d.dayNumber === targetDayNum)
      if (!requestedDay) {
        redirect('/')
      }

      currentChallengeDay = requestedDay

      // Fetch resources
      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .eq('challengeDayId', currentChallengeDay.id)
      resources = resData || []

      // Fetch problems
      const { data: probData } = await supabase
        .from('problems')
        .select('*')
        .eq('challengeDayId', currentChallengeDay.id)
        .order('orderIndex', { ascending: true })
      problems = probData || []

      // Fetch existing submission (any status)
      const { data: existingSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('userId', user.id)
        .eq('challengeDayId', currentChallengeDay.id)
        .maybeSingle()
      existingSubmission = existingSub || null

    } catch (err) {
      console.error('Failed to load challenge day:', err)
      isMock = true
    }
  }

  const isCompleted = completedDayIds.includes(currentChallengeDay?.id) || (isMock && completedDayNumbers.includes(currentChallengeDay?.dayNumber))

  // Objectives (derived from topic as per description instructions)
  const objectives = [
    `Learn the core concepts of ${currentChallengeDay?.topic}`,
    `Understand best practices and logic patterns`,
    `Solve curated practice exercises`
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex-1 flex flex-col gap-6 font-mono text-xs">
      <div>
        <Link href="/" className="text-zinc-500 hover:text-white transition-colors">
          &larr; Back to Track Roadmap
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="font-bold text-blue-500 uppercase">
            Day {currentChallengeDay?.dayNumber < 10 ? `0${currentChallengeDay?.dayNumber}` : currentChallengeDay?.dayNumber}
          </span>
          {isCompleted ? (
            <span className="text-[10px] text-green-400 bg-green-950/20 border border-green-900/30 px-1.5 py-0.5 rounded">
              Completed
            </span>
          ) : existingSubmission && existingSubmission.status === 'pending' ? (
            <span className="text-[10px] text-yellow-400 bg-yellow-950/20 border border-yellow-900/30 px-1.5 py-0.5 rounded">
              Review Pending
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              Unsolved
            </span>
          )}
        </div>
        <h1 className="text-base font-bold text-white uppercase mt-2 tracking-tight">
          {currentChallengeDay?.topic}
        </h1>
        <p className="text-zinc-450 mt-1.5 leading-relaxed">
          {currentChallengeDay?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Objectives */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1">
              Objectives
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              {objectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1">
              Resources
            </h3>
            {resources.length === 0 ? (
              <p className="text-zinc-650 italic">No resources provided for this day.</p>
            ) : (
              <div className="space-y-1.5">
                {resources.map(res => {
                  let label = 'Notes'
                  if (res.type === 'YouTube') label = 'Video'
                  else if (res.type === 'Article') label = 'Blog'
                  return (
                    <div key={res.id} className="flex justify-between items-baseline gap-2">
                      <span className="text-zinc-500 font-bold shrink-0">[{label}]</span>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-350 hover:text-blue-500 hover:underline truncate flex-1"
                      >
                        {res.title}
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Problems */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1">
              Problems
            </h3>
            {problems.length === 0 ? (
              <p className="text-zinc-650 italic">No problems assigned for this day.</p>
            ) : (
              <div className="space-y-2">
                {problems.map(prob => (
                  <div key={prob.id} className="flex justify-between items-center border border-zinc-900 bg-zinc-950/10 p-2 rounded">
                    <div>
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded border mr-2 uppercase ${
                        prob.difficulty === 'Easy' ? 'border-green-950 bg-green-950/20 text-green-400' :
                        prob.difficulty === 'Medium' ? 'border-yellow-950 bg-yellow-950/20 text-yellow-400' :
                        'border-red-950 bg-red-950/20 text-red-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                      <span className="text-zinc-300 font-semibold">{prob.title}</span>
                      <span className="text-[10px] text-zinc-550 ml-2">({prob.platform})</span>
                    </div>
                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-zinc-800 bg-zinc-950 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      Solve
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Status */}
        <div className="border border-zinc-850 p-4 rounded bg-zinc-950/20 space-y-4">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Submission Status</div>

          {existingSubmission ? (
            <div className="space-y-3">
              {existingSubmission.status === 'approved' ? (
                <div className="border border-green-900 bg-green-950/10 p-3 text-green-400 rounded">
                  ✓ Solution approved. Points credited.
                </div>
              ) : existingSubmission.status === 'rejected' ? (
                <div className="space-y-3">
                  <div className="border border-red-900 bg-red-950/10 p-3 text-red-400 rounded">
                    ✗ Solution rejected: {existingSubmission.rejectionReason || 'No feedback provided.'}
                  </div>
                  <div className="text-[10px] text-zinc-500">You can submit a new link below to request another review.</div>
                  <ChallengeSubmissionForm challengeDayId={currentChallengeDay?.id} />
                </div>
              ) : (
                <div className="border border-yellow-900 bg-yellow-950/10 p-3 text-yellow-400 rounded">
                  ○ Pending review.
                </div>
              )}

              {existingSubmission.status !== 'rejected' && (
                <div className="pt-2 border-t border-zinc-900 space-y-1">
                  <span className="block text-[9px] text-zinc-500 uppercase font-bold">Logged Solution</span>
                  <div className="text-[10px] text-zinc-400 break-all bg-zinc-950 p-1.5 rounded border border-zinc-900">
                    {existingSubmission.screenshotUrl && (
                      <span className="text-zinc-550 font-bold mr-1">[{existingSubmission.screenshotUrl}]</span>
                    )}
                    <a href={existingSubmission.profileLink} target="_blank" rel="noreferrer" className="underline hover:text-blue-500">
                      {existingSubmission.profileLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ChallengeSubmissionForm challengeDayId={currentChallengeDay?.id} />
          )}
        </div>
      </div>
    </div>
  )
}
