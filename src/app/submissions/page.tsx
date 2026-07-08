import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function SubmissionsPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  let submissions: any[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    submissions = [
      {
        id: '1',
        profileLink: 'https://github.com/example/dsa-solution',
        screenshotUrl: 'GitHub Repository',
        status: 'approved',
        submittedAt: new Date().toISOString(),
        challengedays: {
          dayNumber: 1,
          topic: 'Arrays & Hashing',
          sprints: { name: '21-Day DSA Habit Builder' }
        }
      },
      {
        id: '2',
        profileLink: 'https://github.com/example/dsa-solution-day2',
        screenshotUrl: 'GitHub Repository',
        status: 'rejected',
        rejectionReason: 'Invalid repository structure.',
        submittedAt: new Date().toISOString(),
        challengedays: {
          dayNumber: 2,
          topic: 'Two Pointers',
          sprints: { name: '21-Day DSA Habit Builder' }
        }
      }
    ]
  } else {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          profileLink,
          screenshotUrl,
          status,
          rejectionReason,
          submittedAt,
          challengedays:challengeDayId (
            dayNumber,
            topic,
            sprints:sprintId (
              name
            )
          )
        `)
        .eq('userId', user.id)
        .order('submittedAt', { ascending: false })

      submissions = data || []
    } catch (err) {
      console.error('Failed to load submissions:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 flex-1 flex flex-col gap-6 font-mono text-xs">
      {isMock && (
        <div className="border border-blue-900 bg-blue-950/10 p-3 text-[10px] text-blue-400">
          [demo mode] Connect Supabase to start tracking real progress.
        </div>
      )}

      <div>
        <h1 className="text-sm font-bold text-white uppercase tracking-tight">Your Submissions</h1>
        <p className="text-zinc-500 mt-1">Review the status and logs of your submitted challenge solutions.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/20 rounded overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 italic">
            You haven&apos;t submitted any solutions yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Challenge</th>
                <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Submission Type</th>
                <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Details / Link</th>
                <th className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {submissions.map((sub: any) => {
                let statusColor = 'text-yellow-400'
                if (sub.status === 'approved') statusColor = 'text-green-400'
                else if (sub.status === 'rejected') statusColor = 'text-red-400'

                return (
                  <tr key={sub.id} className="hover:bg-zinc-900/20">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-zinc-350">
                        Day {sub.challengedays?.dayNumber}: {sub.challengedays?.topic}
                      </div>
                      <div className="text-[10px] text-zinc-650 mt-0.5">
                        {sub.challengedays?.sprints?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {sub.screenshotUrl || 'Link'}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <a href={sub.profileLink} target="_blank" rel="noreferrer" className="underline hover:text-blue-500">
                        {sub.profileLink}
                      </a>
                      {sub.status === 'rejected' && sub.rejectionReason && (
                        <div className="text-[10px] text-red-400 mt-1 whitespace-pre-wrap">
                          Feedback: {sub.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap uppercase font-bold ${statusColor}`}>
                      {sub.status}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
