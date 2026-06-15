import { redirect } from 'next/navigation'
import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { Plus, Shield, Check, X, Calendar, BookOpen, Code, FileText, Terminal, Users, Flame, AlertCircle } from 'lucide-react'
import AdminFormSection from '@/components/AdminFormSection'

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

export default async function AdminPage() {
  const user = await getSessionUser()
  
  // Extra security check in Server Component
  if (!user || !user.isAdmin) {
    redirect('/dashboard')
  }

  let challengeDays: any[] = []
  let pendingSubmissions: SubmissionReview[] = []
  let isMock = false
  let stats = {
    totalUsers: 0,
    totalSubmissions: 0,
    activeParticipants: 0,
    pendingReviews: 0,
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
  }

  if (isMock) {
    challengeDays = [
      { id: '1', dayNumber: 1, topic: 'Arrays & Hashing' },
      { id: '2', dayNumber: 2, topic: 'Two Pointers' }
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
    stats = {
      totalUsers: 124,
      totalSubmissions: 412,
      activeParticipants: 86,
      pendingReviews: pendingSubmissions.length,
    }
  } else {
    try {
      const supabase = await createClient()

      // Fetch challenge days
      const { data: days } = await supabase
        .from('challengedays')
        .select('*')
        .order('dayNumber', { ascending: true })

      challengeDays = days || []

      // Fetch pending submissions
      const { data: subs } = await supabase
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
        .order('submittedAt', { ascending: false })

      pendingSubmissions = subs as unknown as SubmissionReview[] || []

      // Fetch stats
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      const { count: subsCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })

      const { data: activeSubs } = await supabase
        .from('submissions')
        .select('userId')
      
      const activeCount = activeSubs ? new Set(activeSubs.map((s: any) => s.userId)).size : 0

      const { count: pendingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      stats = {
        totalUsers: usersCount || 0,
        totalSubmissions: subsCount || 0,
        activeParticipants: activeCount || 0,
        pendingReviews: pendingCount || 0,
      }
    } catch (err) {
      console.error('Admin page error:', err)
      isMock = true
      stats = {
        totalUsers: 124,
        totalSubmissions: 412,
        activeParticipants: 86,
        pendingReviews: pendingSubmissions.length || 2,
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-10">
      {/* Alert if using mock mode */}
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
          <p className="text-sm text-zinc-400 mt-1">
            Manage challenges, upload curriculums, and review community solution uploads.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">TOTAL USERS</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">TOTAL SUBMISSIONS</span>
            <FileText className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{stats.totalSubmissions}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">ACTIVE PARTICIPANTS</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{stats.activeParticipants}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 glow-border">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono font-medium">PENDING REVIEWS</span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">{stats.pendingReviews}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Forms to manage content */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <AdminFormSection challengeDays={challengeDays} />
        </div>

        {/* Right Column: Review pending submissions */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-6">
            <h3 className="text-sm font-semibold font-mono text-white mb-6 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-zinc-400" />
              PENDING SUBMISSIONS ({pendingSubmissions.length})
            </h3>

            {pendingSubmissions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No submissions pending review.</p>
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
                        <span className="text-[10px] text-zinc-400 block font-mono">
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
                    <div className="flex justify-end gap-3 pt-2">
                      <form action={async () => {
                        'use server'
                        const { updateSubmissionStatus } = await import('@/app/actions/admin')
                        await updateSubmissionStatus(sub.id, 'rejected')
                      }}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900 hover:text-red-400 px-3 py-1.5 text-xs font-mono font-medium text-zinc-400 transition-all cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
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
                          className="inline-flex items-center gap-1 rounded bg-white border border-transparent hover:bg-zinc-200 px-3 py-1.5 text-xs font-mono font-bold text-black transition-all cursor-pointer"
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
      </div>
    </div>
  )
}
