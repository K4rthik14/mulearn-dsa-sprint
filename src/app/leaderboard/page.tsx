import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'

interface LeaderboardEntry {
  userId: string
  score: number
  streak: number
  longestStreak: number
  users: {
    name: string
    email: string
  }
  completedDaysCount?: number
}

export default async function LeaderboardPage() {
  const currentUser = await getSessionUser()

  let leaderboardData: LeaderboardEntry[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    leaderboardData = [
      { userId: 'u1', score: 210, streak: 21, longestStreak: 21, users: { name: 'lucid_coder', email: 'lucid@mail.com' }, completedDaysCount: 21 },
      { userId: 'u2', score: 180, streak: 18, longestStreak: 18, users: { name: 'nix_master', email: 'nix@mail.com' }, completedDaysCount: 18 },
      { userId: 'u3', score: 150, streak: 15, longestStreak: 15, users: { name: 'binary_guru', email: 'binary@mail.com' }, completedDaysCount: 15 },
      { userId: 'u4', score: 120, streak: 12, longestStreak: 12, users: { name: 'karthik_dsa', email: 'karthik@mail.com' }, completedDaysCount: 12 },
      { userId: 'u5', score: 90, streak: 9, longestStreak: 10, users: { name: 'stack_overflow', email: 'stack@mail.com' }, completedDaysCount: 9 },
      { userId: 'u6', score: 70, streak: 7, longestStreak: 7, users: { name: 'git_commit', email: 'git@mail.com' }, completedDaysCount: 7 }
    ]
  } else {
    try {
      const supabase = await createClient()

      // Fetch leaderboard
      const { data: leadData } = await supabase
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
        .order('streak', { ascending: false })

      // Fetch submission counts to get Completed Days
      const { data: subsData } = await supabase
        .from('submissions')
        .select('userId')
        .eq('status', 'approved')

      const submissionCounts: { [key: string]: number } = {}
      if (subsData) {
        subsData.forEach((s: any) => {
          submissionCounts[s.userId] = (submissionCounts[s.userId] || 0) + 1
        })
      }

      if (leadData) {
        leaderboardData = (leadData as any[]).map((entry) => ({
          ...entry,
          completedDaysCount: submissionCounts[entry.userId] || 0
        }))
      }

      if (leaderboardData.length === 0 && currentUser) {
        leaderboardData = [
          { 
            userId: currentUser.id, 
            score: 0, 
            streak: 0, 
            longestStreak: 0, 
            users: { name: currentUser.name || 'You', email: currentUser.email || 'you@mail.com' },
            completedDaysCount: 0
          }
        ]
      }
    } catch (err) {
      console.error('Leaderboard error:', err)
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
        <h1 className="text-sm font-bold text-white uppercase tracking-tight">Leaderboard</h1>
        <p className="text-zinc-500 mt-1">Rankings computed from approved challenge day submissions.</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/20 rounded overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/50">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Rank</th>
              <th scope="col" className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Name</th>
              <th scope="col" className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Completed Days</th>
              <th scope="col" className="px-4 py-2.5 text-left text-zinc-500 font-semibold uppercase">Score</th>
              <th scope="col" className="px-4 py-2.5 text-right text-zinc-500 font-semibold uppercase">Current Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {leaderboardData.map((entry, idx) => {
              const rank = idx + 1
              const name = entry.users?.name || 'Anonymous'
              const isCurrentUser = currentUser?.id === entry.userId

              return (
                <tr
                  key={entry.userId}
                  className={`hover:bg-zinc-900/20 ${isCurrentUser ? 'bg-zinc-900/10' : ''}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {rank < 10 ? `0${rank}` : rank}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={isCurrentUser ? 'text-blue-400 font-bold' : 'text-zinc-300'}>
                      {name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] border border-blue-900 bg-blue-950/20 px-1 py-0.2 rounded text-blue-400 ml-1.5 font-bold">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-450">
                    {entry.completedDaysCount ?? 0}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-450">
                    {entry.score} pts
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-zinc-300 font-bold">
                    {entry.streak} days
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
