import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Calendar, BookOpen, Code, UploadCloud, CheckCircle2, AlertTriangle, Terminal, Play, FileText, PlaySquare, File } from 'lucide-react'
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

  const requestedSprintSlug = searchParams.sprint || 'dsa-habit-21'
  const requestedDayNumber = parseInt(searchParams.day || '1')

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

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    currentSprint = {
      id: 'mock-sprint-1',
      name: '21-Day DSA Habit Builder',
      slug: 'dsa-habit-21'
    }
    currentChallengeDay = {
      id: `mock-day-${requestedDayNumber}`,
      dayNumber: requestedDayNumber,
      topic: [
        "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stacks & Queues", "Linked Lists",
        "Binary Search", "Recursion & Backtracking", "Trees: DFS & BFS", "Binary Search Trees", "Heaps / Priority Queues",
        "Hashing Advanced", "Graphs: DFS & BFS", "Graphs: Matrix Paths", "Dynamic Programming (1D)", "Dynamic Programming (2D)",
        "Greedy Algorithms", "Intervals", "Tries", "Bit Manipulation", "Advanced Graphs", "Grand Finale Sprint"
      ][requestedDayNumber - 1] || 'DSA Practice',
      description: `Learn the fundamentals of intermediate algorithms and solve typical interview questions.`
    }
    resources = [
      { id: 'r1', title: 'Video: Topic Introduction Walkthrough', url: 'https://youtube.com', type: 'YouTube' },
      { id: 'r2', title: 'Article: Practice Patterns Guide', url: 'https://leetcode.com', type: 'Article' }
    ]
    problems = [
      { id: 'p1', title: 'Curated LeetCode Practice 1', difficulty: 'Easy', platform: 'LeetCode', points: 10, url: 'https://leetcode.com' },
      { id: 'p2', title: 'Curated LeetCode Practice 2', difficulty: 'Medium', platform: 'LeetCode', points: 10, url: 'https://leetcode.com' }
    ]
    completedDayNumbers = [1, 2]
    if (completedDayNumbers.includes(requestedDayNumber)) {
      existingSubmission = {
        id: 'mock-sub-1',
        profileLink: 'https://leetcode.com/u/karthik14/',
        screenshotUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871',
        status: 'approved',
        submittedAt: new Date().toISOString()
      }
    }
  } else {
    try {
      const supabase = await createClient()

      // 1. Fetch requested sprint
      const { data: sprintData } = await supabase
        .from('sprints')
        .select('*')
        .eq('slug', requestedSprintSlug)
        .single()

      if (!sprintData) {
        redirect('/dashboard')
      }
      currentSprint = sprintData

      // 2. Fetch all challenge days of this sprint to compute unlock states
      const { data: sprintDays } = await supabase
        .from('challengedays')
        .select('*')
        .eq('sprintId', currentSprint.id)
        .order('dayNumber', { ascending: true })

      const daysList = sprintDays || []

      // 3. Fetch approved submissions for this user in this specific sprint
      if (daysList.length > 0) {
        const dayIds = daysList.map(d => d.id)
        const { data: userSubs } = await supabase
          .from('submissions')
          .select('challengeDayId, challengedays(dayNumber)')
          .eq('userId', user.id)
          .eq('status', 'approved')
          .in('challengeDayId', dayIds)

        if (userSubs) {
          completedDayIds = userSubs.map((s: any) => s.challengeDayId)
          completedDayNumbers = userSubs.map((s: any) => s.challengedays?.dayNumber || 0).filter(Boolean)
        }
      }

      // 4. Validate unlock of requestedDayNumber
      const requestedDay = daysList.find(d => d.dayNumber === requestedDayNumber)
      if (!requestedDay) {
        redirect(`/dashboard?sprint=${requestedSprintSlug}`)
      }

      const completedDaysSet = new Set(completedDayNumbers)
      const isUnlocked = requestedDayNumber === 1 || 
                         (requestedDay.unlockDay ? completedDaysSet.has(requestedDay.unlockDay) : completedDaysSet.has(requestedDayNumber - 1))

      if (!isUnlocked) {
        // Find the user's lowest unsolved unlocked day to redirect them
        let activeDayNumber = 1
        for (const d of daysList) {
          const isDayCompleted = completedDayIds.includes(d.id)
          const isDayUnlocked = d.dayNumber === 1 || 
                                (d.unlockDay ? completedDaysSet.has(d.unlockDay) : completedDaysSet.has(d.dayNumber - 1))
          
          if (!isDayCompleted && isDayUnlocked) {
            activeDayNumber = d.dayNumber
            break
          }
        }
        redirect(`/dashboard/challenge?sprint=${requestedSprintSlug}&day=${activeDayNumber}`)
      }

      currentChallengeDay = requestedDay

      // 5. Fetch resources for current challenge day
      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .eq('challengeDayId', currentChallengeDay.id)
      resources = resData || []

      // 6. Fetch problems for current challenge day
      const { data: probData } = await supabase
        .from('problems')
        .select('*')
        .eq('challengeDayId', currentChallengeDay.id)
        .order('orderIndex', { ascending: true })
      problems = probData || []

      // 7. Fetch existing submission
      const { data: existingSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('userId', user.id)
        .eq('challengeDayId', currentChallengeDay.id)
        .maybeSingle()
      existingSubmission = existingSub || null

    } catch (err) {
      console.error('Challenge details page error:', err)
      isMock = true
    }
  }

  const isCompleted = isMock 
    ? completedDayNumbers.includes(requestedDayNumber)
    : completedDayIds.includes(currentChallengeDay?.id)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Alert if using mock mode */}
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Showing mock challenge details. Configure Supabase credentials to pull actual problems and log real solution completions.
          </div>
        </div>
      )}

      {/* Back to Dashboard */}
      <div>
        <Link
          href={`/dashboard?sprint=${requestedSprintSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO {currentSprint?.name?.toUpperCase() || 'DASHBOARD'}
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-orange-500">
              DAY {currentChallengeDay?.dayNumber < 10 ? `0${currentChallengeDay?.dayNumber}` : currentChallengeDay?.dayNumber}
            </span>
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Completed / Solved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 animate-pulse">
                Active / Unsolved
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-mono">
            {currentChallengeDay?.topic}
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            {currentChallengeDay?.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Learning Resources and Problems */}
        <div className="md:col-span-2 flex flex-col gap-8">
          {/* Resources */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6">
            <h3 className="text-sm font-semibold font-mono text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              LEARNING RESOURCES
            </h3>

            {resources.length === 0 ? (
              <p className="text-xs text-zinc-500 italic font-mono">No resources configured for this day.</p>
            ) : (
              <div className="space-y-3">
                {resources.map((res) => {
                  const type = res.type || 'Article'
                  const getIcon = () => {
                    switch (type) {
                      case 'YouTube':
                        return <Play className="h-4 w-4 text-red-500 shrink-0" />
                      case 'Article':
                        return <FileText className="h-4 w-4 text-blue-400 shrink-0" />
                      case 'Documentation':
                        return <BookOpen className="h-4 w-4 text-emerald-400 shrink-0" />
                      case 'PDF':
                        return <File className="h-4 w-4 text-amber-500 shrink-0" />
                      case 'Playlist':
                        return <PlaySquare className="h-4 w-4 text-purple-400 shrink-0" />
                      default:
                        return <BookOpen className="h-4 w-4 text-zinc-400 shrink-0" />
                    }
                  }
                  return (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        {getIcon()}
                        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{res.title}</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Problems */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6">
            <h3 className="text-sm font-semibold font-mono text-white mb-4 flex items-center gap-2">
              <Code className="h-4 w-4 text-zinc-400" />
              PRACTICE PROBLEMS
            </h3>

            {problems.length === 0 ? (
              <p className="text-xs text-zinc-500 italic font-mono">No problems configured for this day.</p>
            ) : (
              <div className="space-y-3">
                {problems.map((prob) => {
                  const platform = prob.platform || 'LeetCode'
                  const platformColor = 
                    platform === 'LeetCode' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' :
                    platform === 'Codeforces' ? 'border-blue-500/20 bg-blue-500/10 text-blue-400' :
                    'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'

                  return (
                    <div
                      key={prob.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/40 gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                          prob.difficulty === 'Easy' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                          prob.difficulty === 'Medium' ? 'border-amber-500/20 bg-amber-500/10 text-amber-500' :
                          'border-red-500/20 bg-red-500/10 text-red-400'
                        }`}>
                          {prob.difficulty}
                        </span>
                        
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${platformColor}`}>
                          {platform}
                        </span>

                        <span className="text-xs font-semibold text-zinc-200 font-mono ml-1">{prob.title}</span>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 font-mono">
                        <span className="text-[10px] text-zinc-500 font-bold shrink-0">
                          +{prob.points || 10} PTS
                        </span>
                        
                        <a
                          href={prob.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-white transition-all"
                        >
                          Solve
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Submission Area */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-6">
            <h3 className="text-sm font-semibold font-mono text-white mb-4 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-zinc-400" />
              SUBMISSION LOG
            </h3>

            {existingSubmission && existingSubmission.status !== 'rejected' ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Verified & Completed!
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Your challenge solution was logged. Points and streak have been credited to your profile!
                  </p>
                </div>

                {existingSubmission.profileLink && (
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500">SUBMITTED PROFILE / CODE LINK</span>
                    <a
                      href={existingSubmission.profileLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-300 hover:text-white underline break-all font-mono flex items-center gap-1 mt-1"
                    >
                      {existingSubmission.profileLink}
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </div>
                )}

                {existingSubmission.screenshotUrl && (
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500 mb-1">SCREENSHOT PROOF</span>
                    <img
                      src={existingSubmission.screenshotUrl}
                      alt="Submission proof"
                      className="rounded border border-zinc-800 bg-black max-h-40 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {existingSubmission && existingSubmission.status === 'rejected' && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-red-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Submission Rejected
                    </div>
                    <p className="text-[11px] text-red-400/90 font-medium">
                      Feedback: {existingSubmission.rejectionReason || 'No reason specified'}
                    </p>
                  </div>
                )}
                <ChallengeSubmissionForm challengeDayId={currentChallengeDay?.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
