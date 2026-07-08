import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser, isUserAdmin } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { createSprint } from '@/app/actions/admin'

import ChallengeDaysManager from '@/components/ChallengeDaysManager'
import ResourcesManager from '@/components/ResourcesManager'
import ProblemsManager from '@/components/ProblemsManager'
import ParticipantManager from '@/components/ParticipantManager'

interface SubmissionReview {
  id: string
  userId: string
  challengeDayId: string
  screenshotUrl: string | null // Stores subType
  profileLink: string | null // Stores link/id
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  users: {
    name: string
    email: string
  }
  challengedays: {
    dayNumber: number
    topic: string
  }
}

interface AdminSearchParams {
  tab?: string
}

export default async function AdminPage(props: { searchParams: Promise<AdminSearchParams> }) {
  const searchParams = await props.searchParams
  const activeTab = searchParams.tab || 'submissions'
  const user = await getSessionUser()

  const adminNormalized = isUserAdmin(user)
  if (!adminNormalized) {
    redirect('/')
  }

  let challengeDays: any[] = []
  let pendingSubmissions: SubmissionReview[] = []
  let resourcesList: any[] = []
  let problemsList: any[] = []
  let participantsList: any[] = []
  let sprintsList: any[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    sprintsList = [
      { id: 'mock-sprint-1', name: '21-Day DSA Habit Builder', slug: 'dsa-habit-21', durationDays: 21 },
      { id: 'mock-sprint-2', name: 'Blind 75 Interview Prep', slug: 'blind-75', durationDays: 15 }
    ]
    challengeDays = [
      { id: '1', dayNumber: 1, topic: 'Arrays & Hashing', description: 'Practice array and hashing basics', difficulty: 'Easy', unlockDay: null, sprintId: 'mock-sprint-1', sprintName: '21-Day DSA Habit Builder' }
    ]
    resourcesList = [
      { id: 'r1', challengeDayId: '1', title: 'Video: NeetCode Arrays', url: 'https://youtube.com', type: 'YouTube' }
    ]
    problemsList = [
      { id: 'p1', challengeDayId: '1', title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', points: 10, orderIndex: 0, url: 'https://leetcode.com/problems/two-sum/' }
    ]
    pendingSubmissions = [
      {
        id: 's1',
        userId: 'u1',
        challengeDayId: '1',
        screenshotUrl: 'GitHub Repository',
        profileLink: 'https://github.com/example/dsa-sum',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        users: { name: 'Alice Smith', email: 'alice@mail.com' },
        challengedays: { dayNumber: 1, topic: 'Arrays & Hashing' }
      }
    ]
    participantsList = [
      { id: 'u1', name: 'Alice Smith', email: 'alice@mail.com', isBanned: false, createdAt: new Date().toISOString(), leaderboard: { score: 10, streak: 1, longestStreak: 1 }, submissionsCount: 1 }
    ]
  } else {
    try {
      const supabase = await createClient()

      const [
        daysResult,
        resourcesResult,
        problemsResult,
        subsResult,
        usersResult,
        subCountsResult,
        sprintsResult
      ] = await Promise.all([
        supabase
          .from('challengedays')
          .select('*, sprints(name, slug)')
          .order('dayNumber', { ascending: true }),

        supabase
          .from('resources')
          .select('*'),

        supabase
          .from('problems')
          .select('*')
          .order('orderIndex', { ascending: true }),

        supabase
          .from('submissions')
          .select(`
            id,
            userId,
            challengeDayId,
            screenshotUrl,
            profileLink,
            status,
            submittedAt,
            users:userId (
              name,
              email
            ),
            challengedays:challengeDayId (
              dayNumber,
              topic
            )
          `)
          .eq('status', 'pending')
          .order('submittedAt', { ascending: false }),

        supabase
          .from('users')
          .select(`
            id,
            name,
            email,
            isBanned,
            createdAt,
            leaderboard (
              score,
              streak,
              longestStreak
            )
          `),

        supabase
          .from('submissions')
          .select('userId'),

        supabase
          .from('sprints')
          .select('*')
          .order('createdAt', { ascending: true })
      ])

      sprintsList = sprintsResult.data || []
      challengeDays = (daysResult.data || []).map((day: any) => ({
        ...day,
        sprintName: day.sprints?.name || 'Unknown Sprint'
      }))
      resourcesList = resourcesResult.data || []
      problemsList = problemsResult.data || []
      pendingSubmissions = subsResult.data as unknown as SubmissionReview[] || []

      const dbUsers = usersResult.data
      const dbSubCounts = subCountsResult.data

      const submissionCounts: Record<string, number> = {}
      if (dbSubCounts) {
        for (const s of dbSubCounts) {
          submissionCounts[s.userId] = (submissionCounts[s.userId] || 0) + 1
        }
      }

      participantsList = (dbUsers || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isBanned: !!u.isBanned,
        createdAt: u.createdAt,
        leaderboard: u.leaderboard ? {
          score: u.leaderboard.score || 0,
          streak: u.leaderboard.streak || 0,
          longestStreak: u.leaderboard.longestStreak || 0
        } : null,
        submissionsCount: submissionCounts[u.id] || 0
      }))

    } catch (err) {
      console.error('Admin page error:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 flex-1 flex flex-col gap-6 font-mono text-xs">
      {isMock && (
        <div className="border border-blue-900 bg-blue-950/10 p-3 text-blue-400">
          [demo mode] Admin operations are simulated. Configure Supabase integration for live curriculum management.
        </div>
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-base font-bold text-white uppercase tracking-tight">Admin Console</h1>
        <p className="text-zinc-500 mt-1">Manage tracks, review solution submissions, and edit curriculum details.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 overflow-x-auto gap-4 py-1 text-zinc-500">
        {[
          { tabId: 'submissions', label: `PENDING REVIEWS (${pendingSubmissions.length})` },
          { tabId: 'tracks', label: `TRACKS (${sprintsList.length})` },
          { tabId: 'days', label: `CHALLENGE DAYS (${challengeDays.length})` },
          { tabId: 'resources', label: 'RESOURCES' },
          { tabId: 'problems', label: 'PROBLEMS' },
          { tabId: 'participants', label: 'PARTICIPANTS' }
        ].map((tab) => (
          <Link
            key={tab.tabId}
            href={`/admin?tab=${tab.tabId}`}
            className={`pb-1.5 font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.tabId
                ? 'border-b border-blue-500 text-blue-500'
                : 'hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'submissions' && (
        <div className="space-y-4 max-w-3xl">
          <div className="font-bold text-white uppercase">Pending Submissions</div>
          {pendingSubmissions.length === 0 ? (
            <p className="text-zinc-650 italic">No submissions are pending review.</p>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 rounded border border-zinc-850 bg-zinc-950/20 space-y-3.5">
                  <div className="flex justify-between items-baseline border-b border-zinc-900 pb-2.5">
                    <div>
                      <span className="font-bold text-zinc-200">{sub.users?.name || 'Anonymous'}</span>
                      <span className="text-[10px] text-zinc-550 block mt-0.5">{sub.users?.email}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-400">Day {sub.challengedays?.dayNumber}</span>
                      <span className="text-[10px] text-zinc-550 block mt-0.5">{sub.challengedays?.topic}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Logged Solution</span>
                    <div className="mt-1 font-mono text-zinc-350 bg-zinc-950 p-2 border border-zinc-900 rounded break-all">
                      {sub.screenshotUrl && (
                        <span className="text-zinc-500 font-bold mr-1.5">[{sub.screenshotUrl}]</span>
                      )}
                      <a href={sub.profileLink || '#'} target="_blank" rel="noreferrer" className="underline hover:text-blue-400">
                        {sub.profileLink}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <form action={async (formData: FormData) => {
                      'use server'
                      const reason = formData.get('rejectionReason') as string
                      const { updateSubmissionStatus } = await import('@/app/actions/admin')
                      await updateSubmissionStatus(sub.id, 'rejected', reason)
                    }} className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        name="rejectionReason"
                        placeholder="Rejection feedback..."
                        required
                        className="flex-1 rounded border border-zinc-850 bg-zinc-950 px-2 py-1 text-zinc-200 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="border border-red-950 bg-red-950/10 hover:bg-red-950/20 text-red-400 px-3 py-1 rounded cursor-pointer"
                      >
                        Reject
                      </button>
                    </form>

                    <form action={async () => {
                      'use server'
                      const { updateSubmissionStatus } = await import('@/app/actions/admin')
                      await updateSubmissionStatus(sub.id, 'approved')
                    }}>
                      <button
                        type="submit"
                        className="w-full border border-blue-500/40 bg-blue-950/10 hover:bg-blue-950/25 text-blue-400 px-4 py-1.5 rounded font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tracks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* List Sprints */}
          <div className="md:col-span-2 space-y-4">
            <div className="font-bold text-white uppercase">Available Tracks</div>
            <div className="border border-zinc-850 rounded bg-zinc-950/20 divide-y divide-zinc-900">
              {sprintsList.map(sprint => (
                <div key={sprint.id} className="p-3">
                  <div className="font-bold text-zinc-300">{sprint.name}</div>
                  <div className="text-[10px] text-zinc-550 mt-0.5">{sprint.description}</div>
                  <div className="text-[10px] text-zinc-450 mt-2">
                    Slug: <strong className="text-zinc-300">{sprint.slug}</strong> | Duration: <strong className="text-zinc-300">{sprint.durationDays} Days</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Create Sprint */}
          <div className="border border-zinc-850 p-4 rounded bg-zinc-950/20 space-y-3.5">
            <div className="font-bold text-white uppercase">Create Track</div>
            <form action={createSprint} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Track Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Blind 75 Prep"
                  className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-950 px-2 py-1 text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Description</label>
                <textarea
                  name="description"
                  required
                  placeholder="Summarize course goals..."
                  rows={2}
                  className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-950 px-2 py-1 text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Slug</label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="e.g. blind-75"
                  className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-950 px-2 py-1 text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Duration (Days)</label>
                <input
                  type="number"
                  name="durationDays"
                  required
                  placeholder="15"
                  className="mt-1 block w-full rounded border border-zinc-850 bg-zinc-950 px-2 py-1 text-zinc-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full border border-blue-500/40 bg-blue-950/10 hover:bg-blue-950/25 text-blue-400 py-1.5 rounded font-bold cursor-pointer transition-colors"
              >
                Create Track
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'days' && (
        <ChallengeDaysManager challengeDays={challengeDays} sprints={sprintsList} />
      )}

      {activeTab === 'resources' && (
        <ResourcesManager challengeDays={challengeDays} initialResources={resourcesList} />
      )}

      {activeTab === 'problems' && (
        <ProblemsManager challengeDays={challengeDays} initialProblems={problemsList} />
      )}

      {activeTab === 'participants' && (
        <ParticipantManager initialUsers={participantsList} />
      )}
    </div>
  )
}
