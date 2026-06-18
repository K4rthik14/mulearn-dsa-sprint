import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser, isUserAdmin } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { 
  Plus, Shield, Check, X, Calendar, BookOpen, Code, FileText, 
  Terminal, Users, Flame, AlertCircle, Megaphone, BarChart3, UserCheck 
} from 'lucide-react'
import ChallengeDaysManager from '@/components/ChallengeDaysManager'
import ResourcesManager from '@/components/ResourcesManager'
import ProblemsManager from '@/components/ProblemsManager'
import ParticipantManager from '@/components/ParticipantManager'
import ContestManager from '@/components/ContestManager'
import AnnouncementManager from '@/components/AnnouncementManager'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

interface SubmissionReview {
  id: string
  userId: string
  challengeDayId: string
  screenshotUrl: string | null
  profileLink: string | null
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

  console.log("ADMIN PAGE USER:", JSON.stringify(user, null, 2))
  console.log("ADMIN PAGE ADMIN:", isUserAdmin(user))
  
  console.log('[Admin Page Direct Check Log]:', {
    userId: user?.id,
    email: user?.email,
    adminNormalized,
    reason: adminNormalized ? 'Allowed to view Admin Page' : 'Redirecting to /dashboard - User not admin'
  })
  
  if (!adminNormalized) {
    redirect('/dashboard')
  }

  let challengeDays: any[] = []
  let pendingSubmissions: SubmissionReview[] = []
  let resourcesList: any[] = []
  let problemsList: any[] = []
  let participantsList: any[] = []
  let contestsList: any[] = []
  let announcementsList: any[] = []
  let sprintsList: any[] = []
  
  let isMock = false
  
  // Analytics stats structure
  let analyticsData = {
    totalUsers: 0,
    activeParticipants: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
    rejectedSubmissions: 0,
    mostCompletedDay: null as any,
    streakDistribution: {
      zero: 0,
      oneToFive: 0,
      sixToTen: 0,
      elevenToFifteen: 0,
      sixteenPlus: 0
    },
    dayCompletions: [] as any[],
    topPerformers: [] as any[]
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
  }

  if (isMock) {
    sprintsList = [
      { id: 'mock-sprint-1', name: '21-Day DSA Habit Builder', slug: 'dsa-habit-21', durationDays: 21 },
      { id: 'mock-sprint-2', name: 'Blind 75 Interview Prep', slug: 'blind-75', durationDays: 15 },
      { id: 'mock-sprint-3', name: '7-Day DP Intensive', slug: 'dp-intensive-7', durationDays: 7 }
    ]
    challengeDays = [
      { id: '1', dayNumber: 1, topic: 'Arrays & Hashing', description: 'Practice array and hashing basics', difficulty: 'Easy', unlockDay: null, sprintId: 'mock-sprint-1', sprintName: '21-Day DSA Habit Builder' },
      { id: '2', dayNumber: 2, topic: 'Two Pointers', description: 'Solve problems using two pointer techniques', difficulty: 'Medium', unlockDay: 1, sprintId: 'mock-sprint-1', sprintName: '21-Day DSA Habit Builder' }
    ]
    resourcesList = [
      { id: 'r1', challengeDayId: '1', title: 'Video: NeetCode DSA Introduction', url: 'https://youtube.com', type: 'YouTube' },
      { id: 'r2', challengeDayId: '1', title: 'Article: Array Techniques Guide', url: 'https://leetcode.com', type: 'Article' }
    ]
    problemsList = [
      { id: 'p1', challengeDayId: '1', title: 'Two Sum', platform: 'LeetCode', difficulty: 'Easy', points: 10, orderIndex: 0, url: 'https://leetcode.com/problems/two-sum/' },
      { id: 'p2', challengeDayId: '1', title: 'Contains Duplicate', platform: 'LeetCode', difficulty: 'Easy', points: 10, orderIndex: 1, url: 'https://leetcode.com/problems/contains-duplicate/' }
    ]
    pendingSubmissions = [
      {
        id: 's1',
        userId: 'u1',
        challengeDayId: '1',
        screenshotUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871',
        profileLink: 'https://leetcode.com/u/alice/',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        users: { name: 'Alice Smith', email: 'alice@mail.com' },
        challengedays: { dayNumber: 1, topic: 'Arrays & Hashing' }
      },
      {
        id: 's2',
        userId: 'u2',
        challengeDayId: '2',
        screenshotUrl: null,
        profileLink: 'https://leetcode.com/u/bob_code/',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        users: { name: 'Bob Johnson', email: 'bob@mail.com' },
        challengedays: { dayNumber: 2, topic: 'Two Pointers' }
      }
    ]
    participantsList = [
      { id: 'u1', name: 'Alice Smith', email: 'alice@mail.com', isBanned: false, createdAt: new Date().toISOString(), leaderboard: { score: 120, streak: 12, longestStreak: 12 }, submissionsCount: 12 },
      { id: 'u2', name: 'Bob Johnson', email: 'bob@mail.com', isBanned: false, createdAt: new Date().toISOString(), leaderboard: { score: 90, streak: 9, longestStreak: 10 }, submissionsCount: 9 },
      { id: 'u3', name: 'Charlie Brown', email: 'charlie@mail.com', isBanned: true, createdAt: new Date().toISOString(), leaderboard: { score: 0, streak: 0, longestStreak: 0 }, submissionsCount: 0 }
    ]
    contestsList = [
      { id: 'c1', name: 'Sprint Milestone 1', startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000 * 2).toISOString(), contestLink: 'https://codeforces.com', contestType: 'Codeforces' }
    ]
    announcementsList = [
      { id: 'a1', title: 'Welcome to StreakCode DSA Sprint!', content: 'Build consistency over the next 21 days.', priority: 'Info', createdAt: new Date().toISOString() }
    ]

    analyticsData = {
      totalUsers: 124,
      activeParticipants: 86,
      totalSubmissions: 412,
      approvedSubmissions: 390,
      pendingSubmissions: pendingSubmissions.length,
      rejectedSubmissions: 18,
      mostCompletedDay: { dayNumber: 1, topic: 'Arrays & Hashing', count: 98 },
      streakDistribution: {
        zero: 38,
        oneToFive: 45,
        sixToTen: 25,
        elevenToFifteen: 12,
        sixteenPlus: 4
      },
      dayCompletions: [
        { dayNumber: 1, count: 98 },
        { dayNumber: 2, count: 86 },
        { dayNumber: 3, count: 74 },
        { dayNumber: 4, count: 68 },
        { dayNumber: 5, count: 60 }
      ],
      topPerformers: [
        { name: 'Alice Smith', email: 'alice@mail.com', score: 120, streak: 12 },
        { name: 'Bob Johnson', email: 'bob@mail.com', score: 90, streak: 9 }
      ]
    }
  } else {
    try {
      const supabase = await createClient()

      // Fetch all database records concurrently to reduce load latency
      const [
        daysResult,
        resourcesResult,
        problemsResult,
        subsResult,
        contestsResult,
        announcementsResult,
        usersResult,
        subCountsResult,
        allDbSubsResult,
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
          .from('contests')
          .select('*')
          .order('startTime', { ascending: true }),

        supabase
          .from('announcements')
          .select('*')
          .order('createdAt', { ascending: false }),

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
          .from('submissions')
          .select('userId, challengeDayId, status, challengedays(dayNumber, topic)'),

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
      contestsList = contestsResult.data || []
      announcementsList = announcementsResult.data || []

      const dbUsers = usersResult.data
      const dbSubCounts = subCountsResult.data
      const allDbSubs = allDbSubsResult.data

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

      const approvedSubmissions = allDbSubs ? allDbSubs.filter((s: any) => s.status === 'approved') : []
      const pendingSubmissionsCount = allDbSubs ? allDbSubs.filter((s: any) => s.status === 'pending').length : 0
      const rejectedSubmissionsCount = allDbSubs ? allDbSubs.filter((s: any) => s.status === 'rejected').length : 0

      const completionsMap: Record<number, { count: number, topic: string }> = {}
      for (const s of approvedSubmissions) {
        const dayNum = (s as any).challengedays?.dayNumber
        if (dayNum) {
          if (!completionsMap[dayNum]) {
            completionsMap[dayNum] = { count: 0, topic: (s as any).challengedays?.topic || 'DSA Practice' }
          }
          completionsMap[dayNum].count++
        }
      }

      const dayCompletions = Array.from({ length: 21 }, (_, i) => {
        const dayNum = i + 1
        return {
          dayNumber: dayNum,
          count: completionsMap[dayNum]?.count || 0
        }
      })

      let mostCompletedDayObj = null
      let maxCompletions = 0
      for (const dayNumStr in completionsMap) {
        const d = completionsMap[parseInt(dayNumStr)]
        if (d.count > maxCompletions) {
          maxCompletions = d.count
          mostCompletedDayObj = {
            dayNumber: parseInt(dayNumStr),
            topic: d.topic,
            count: d.count
          }
        }
      }

      const streakDistribution = {
        zero: 0,
        oneToFive: 0,
        sixToTen: 0,
        elevenToFifteen: 0,
        sixteenPlus: 0
      }

      for (const user of participantsList) {
        const str = user.leaderboard?.streak || 0
        if (str === 0) streakDistribution.zero++
        else if (str <= 5) streakDistribution.oneToFive++
        else if (str <= 10) streakDistribution.sixToTen++
        else if (str <= 15) streakDistribution.elevenToFifteen++
        else streakDistribution.sixteenPlus++
      }

      const { data: dbLeadStats } = await supabase
        .from('leaderboard')
        .select(`
          userId,
          score,
          streak,
          longestStreak,
          users:userId (
            name,
            email
          )
        `)
        .order('score', { ascending: false })

      const leadEntries = dbLeadStats || []
      const topPerformers = leadEntries.slice(0, 5).map((le: any) => ({
        name: le.users?.name || 'Anonymous',
        email: le.users?.email || '',
        score: le.score,
        streak: le.streak
      }))

      analyticsData = {
        totalUsers: participantsList.length,
        activeParticipants: participantsList.filter(u => (u.leaderboard?.streak || 0) > 0).length,
        totalSubmissions: allDbSubs?.length || 0,
        approvedSubmissions: approvedSubmissions.length,
        pendingSubmissions: pendingSubmissionsCount,
        rejectedSubmissions: rejectedSubmissionsCount,
        mostCompletedDay: mostCompletedDayObj,
        streakDistribution,
        dayCompletions,
        topPerformers
      }
    } catch (err) {
      console.error('Admin page error:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Admin database tables are mocked. Forms will simulate actions. Configure Supabase integration to manage live content.
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-500" />
            Admin Panel
          </h1>
          <p className="text-sm text-zinc-400 mt-1 font-mono">
            Manage challenges, review solution uploads, track participants, and broadcast updates.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-semibold">TOTAL USERS</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{analyticsData.totalUsers}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-semibold">TOTAL SUBMISSIONS</span>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{analyticsData.totalSubmissions}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-semibold">ACTIVE BUILDERS</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{analyticsData.activeParticipants}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-semibold">PENDING REVIEWS</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{pendingSubmissions.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-900 font-mono text-xs overflow-x-auto scrollbar-none">
        {[
          { tabId: 'submissions', label: `PENDING REVIEWS (${pendingSubmissions.length})` },
          { tabId: 'participants', label: 'PARTICIPANTS' },
          { tabId: 'contests', label: 'CONTESTS' },
          { tabId: 'announcements', label: 'ANNOUNCEMENTS' },
          { tabId: 'analytics', label: 'ANALYTICS' },
          { tabId: 'days', label: `CHALLENGE DAYS (${challengeDays.length})` },
          { tabId: 'resources', label: `LEARNING RESOURCES (${resourcesList.length})` },
          { tabId: 'problems', label: `PRACTICE PROBLEMS (${problemsList.length})` },
        ].map((tab) => (
          <Link
            key={tab.tabId}
            href={`/admin?tab=${tab.tabId}`}
            className={`px-4 py-2.5 border-b-2 font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.tabId
                ? 'border-orange-500 text-white bg-zinc-950/20'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'submissions' && (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6">
            <h3 className="text-sm font-semibold font-mono text-white mb-6 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-zinc-400" />
              PENDING SUBMISSIONS ({pendingSubmissions.length})
            </h3>

            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic font-mono">No submissions pending review.</p>
            ) : (
              <div className="space-y-4">
                {pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-lg border border-zinc-900 bg-zinc-950/40 flex flex-col gap-4"
                  >
                    {/* User and Day Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <span className="text-xs font-semibold text-white font-mono">
                          {sub.users?.name || 'Anonymous'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          {sub.users?.email}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-orange-500 font-mono">
                          DAY {sub.challengedays?.dayNumber < 10 ? `0${sub.challengedays?.dayNumber}` : sub.challengedays?.dayNumber}
                        </span>
                        <span className="text-[10px] text-zinc-450 block font-mono">
                          {sub.challengedays?.topic}
                        </span>
                      </div>
                    </div>

                    {/* Submission content details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sub.profileLink && (
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500">LEETCODE PROFILE</span>
                          <a
                            href={sub.profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-300 hover:text-white underline font-mono break-all block mt-1"
                          >
                            {sub.profileLink}
                          </a>
                        </div>
                      )}
                      {sub.screenshotUrl && (
                        <div>
                          <span className="text-[10px] font-mono text-zinc-500 block mb-1">SCREENSHOT PROOF</span>
                          <a href={sub.screenshotUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={sub.screenshotUrl}
                              alt="Proof screenshot"
                              className="rounded border border-zinc-800 bg-black max-h-24 object-cover w-full hover:opacity-85 transition-opacity"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Review Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-900/60 mt-2">
                      <form action={async (formData: FormData) => {
                        'use server'
                        const reason = formData.get('rejectionReason') as string
                        const { updateSubmissionStatus } = await import('@/app/actions/admin')
                        await updateSubmissionStatus(sub.id, 'rejected', reason)
                      }} className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          name="rejectionReason"
                          placeholder="Reason for rejection..."
                          className="flex-1 sm:w-64 rounded border border-zinc-850 bg-black px-3 py-1 text-xs text-white placeholder-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900 hover:text-red-400 px-3 py-1 text-xs font-mono font-medium text-zinc-400 transition-all cursor-pointer shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </form>

                      <form action={async () => {
                        'use server'
                        const { updateSubmissionStatus } = await import('@/app/actions/admin')
                        await updateSubmissionStatus(sub.id, 'approved')
                      }} className="shrink-0 self-end sm:self-auto">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded bg-white border border-transparent hover:bg-zinc-200 px-4 py-1 text-xs font-mono font-bold text-black transition-all cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {activeTab === 'contests' && (
        <ContestManager initialContests={contestsList} />
      )}

      {activeTab === 'announcements' && (
        <AnnouncementManager initialAnnouncements={announcementsList} />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsDashboard stats={analyticsData} />
      )}
    </div>
  )
}
