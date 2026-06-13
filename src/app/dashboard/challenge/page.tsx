import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Calendar, BookOpen, Code, UploadCloud, CheckCircle2, AlertTriangle, Terminal } from 'lucide-react'
import ChallengeSubmissionForm from '@/components/ChallengeSubmissionForm'

interface SearchParams {
  day?: string
}

export default async function ChallengePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const requestedDayNumber = parseInt(searchParams.day || '1')

  let isMock = false
  let currentChallengeDay: any = null
  let resources: any[] = []
  let problems: any[] = []
  let completedDayNumbers: number[] = []
  let existingSubmission: any = null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    completedDayNumbers = [1, 2]
    
    // Seed mock day info
    currentChallengeDay = {
      id: `mock-day-${requestedDayNumber}`,
      dayNumber: requestedDayNumber,
      topic: requestedDayNumber === 1 ? "Arrays & Hashing" : requestedDayNumber === 2 ? "Two Pointers" : "Sliding Window",
      description: `Learn the fundamentals of ${requestedDayNumber === 1 ? "Arrays & Hashing" : requestedDayNumber === 2 ? "Two Pointers" : "Sliding Window"} and practice typical interview problems.`
    }

    resources = [
      { id: 'r1', title: 'Video: NeetCode DSA Introduction', url: 'https://youtube.com' },
      { id: 'r2', title: 'Article: Array Techniques Guide', url: 'https://leetcode.com' }
    ]

    problems = [
      { id: 'p1', title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
      { id: 'p2', title: 'Contains Duplicate', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/' }
    ]

    if (completedDayNumbers.includes(requestedDayNumber)) {
      existingSubmission = {
        id: 'mock-sub-1',
        profileLink: 'https://leetcode.com/u/karthik14/',
        screenshotUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871', // generic image
        submittedAt: new Date().toISOString()
      }
    }
  } else {
    try {
      const supabase = await createClient()

      // Fetch completed day numbers to validate unlock
      const { data: subs } = await supabase
        .from('submissions')
        .select('challengeDayId, challengedays(dayNumber)')
        .eq('userId', user.id)
        .eq('status', 'approved')

      if (subs) {
        completedDayNumbers = subs.map((s: any) => s.challengedays?.dayNumber || 0).filter(Boolean)
      }

      // Check unlock: day is unlocked if dayNumber <= completedCount + 1
      const isUnlocked = requestedDayNumber <= completedDayNumbers.length + 1
      if (!isUnlocked) {
        // Redirect to their active day
        let activeDay = 1
        for (let i = 1; i <= 21; i++) {
          if (!completedDayNumbers.includes(i)) {
            activeDay = i
            break
          }
        }
        redirect(`/dashboard/challenge?day=${activeDay}`)
      }

      // Fetch day info
      const { data: dayData } = await supabase
        .from('challengedays')
        .select('*')
        .eq('dayNumber', requestedDayNumber)
        .single()

      if (dayData) {
        currentChallengeDay = dayData
      } else {
        // Fallback placeholder day if admin hasn't created it in DB yet
        currentChallengeDay = {
          id: `placeholder-day-${requestedDayNumber}`,
          dayNumber: requestedDayNumber,
          topic: `Challenge Topic ${requestedDayNumber}`,
          description: `Admin has not added details for this day yet. You can submit your DSA practice log here.`
        }
      }

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

      problems = probData || []

      // Fetch existing submission
      const { data: existingSub } = await supabase
        .from('submissions')
        .select('*')
        .eq('userId', user.id)
        .eq('challengeDayId', currentChallengeDay.id)
        .single()

      existingSubmission = existingSub || null
    } catch (err) {
      console.error('Challenge page error:', err)
      isMock = true
    }
  }

  const isCompleted = completedDayNumbers.includes(requestedDayNumber)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Alert if using mock mode */}
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Showing mock syllabus details. Configure Supabase credentials to pull actual problems and commit submissions.
          </div>
        </div>
      )}

      {/* Back to Dashboard */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO DASHBOARD
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
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-orange-500/20 bg-orange-500/10 text-orange-400 animate-pulse">
                Active
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
              <p className="text-xs text-zinc-500 italic">No resources added for this day yet.</p>
            ) : (
              <div className="space-y-3">
                {resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40 hover:border-zinc-800 transition-all group"
                  >
                    <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{res.title}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300" />
                  </a>
                ))}
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
              <p className="text-xs text-zinc-500 italic">No problems added for this day yet.</p>
            ) : (
              <div className="space-y-3">
                {problems.map((prob) => (
                  <div
                    key={prob.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        prob.difficulty === 'Easy' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                        prob.difficulty === 'Medium' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                        'border-red-500/20 bg-red-500/10 text-red-400'
                      }`}>
                        {prob.difficulty}
                      </span>
                      <span className="text-xs font-medium text-zinc-200">{prob.title}</span>
                    </div>
                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-white transition-all font-mono"
                    >
                      Solve
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
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

            {existingSubmission ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Solution Logged!
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Your challenge solution was logged on {new Date(existingSubmission.submittedAt).toLocaleDateString()}.
                  </p>
                </div>

                {existingSubmission.profileLink && (
                  <div>
                    <span className="block text-[10px] font-mono text-zinc-500">LEETCODE PROFILE</span>
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
              <ChallengeSubmissionForm challengeDayId={currentChallengeDay?.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
