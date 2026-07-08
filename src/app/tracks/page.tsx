import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { enrollInSprint } from '@/app/actions/sprints'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TracksPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  let sprints: any[] = []
  let enrolledSprintIds: string[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    sprints = [
      { id: 'mock-sprint-1', name: '21-Day DSA Habit Builder', description: 'Build consistency with 21 days of topics: arrays, hashing, graphs, and DP.', durationDays: 21, slug: 'dsa-habit-21' },
      { id: 'mock-sprint-2', name: 'Blind 75 Interview Prep', description: 'Master the high-frequency LeetCode questions asked in technical interviews.', durationDays: 15, slug: 'blind-75' },
      { id: 'mock-sprint-3', name: '7-Day DP Intensive', description: 'Conquer Dynamic Programming. Covers memoization, grids, knapsack, and sequence matching.', durationDays: 7, slug: 'dp-intensive-7' }
    ]
    enrolledSprintIds = ['mock-sprint-1']
  } else {
    try {
      const supabase = await createClient()

      // Fetch all sprints
      const { data: sprintsData } = await supabase
        .from('sprints')
        .select('*')
        .order('createdAt', { ascending: true })
      sprints = sprintsData || []

      // Fetch user enrollments
      const { data: enrollmentsData } = await supabase
        .from('user_sprints')
        .select('sprintId')
        .eq('userId', user.id)
      enrolledSprintIds = enrollmentsData ? enrollmentsData.map((e: any) => e.sprintId) : []
    } catch (err) {
      console.error('Failed to load tracks:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex-1 flex flex-col gap-6 font-mono">
      {isMock && (
        <div className="border border-blue-900 bg-blue-950/10 p-3 text-xs text-blue-400">
          [demo mode] Connect Supabase to start tracking real progress.
        </div>
      )}

      <div>
        <h1 className="text-lg font-bold text-white uppercase tracking-tight">Available Tracks</h1>
        <p className="text-xs text-zinc-500 mt-1">Select a coding track to begin or switch active curriculums.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/20 rounded overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800 text-xs">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Track Name</th>
              <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Duration</th>
              <th className="px-4 py-2.5 text-right text-zinc-500 font-semibold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {sprints.map((sprint) => {
              const isEnrolled = enrolledSprintIds.includes(sprint.id)
              return (
                <tr key={sprint.id} className="hover:bg-zinc-900/20">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-200">{sprint.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{sprint.description}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{sprint.durationDays} Days</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isEnrolled ? (
                      <Link
                        href={`/?sprint=${sprint.slug}`}
                        className="inline-block border border-blue-500/30 text-blue-400 hover:bg-blue-950/20 px-2 py-1 rounded text-[10px] transition-colors"
                      >
                        View Roadmap
                      </Link>
                    ) : (
                      <form action={async () => {
                        'use server'
                        await enrollInSprint(sprint.id)
                        redirect(`/?sprint=${sprint.slug}`)
                      }} className="inline-block">
                        <button
                          type="submit"
                          className="border border-zinc-850 hover:border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                        >
                          Enroll
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
