import { getSessionUser } from '@/utils/supabase/user'
import { createClient } from '@/utils/supabase/server'
import { Trophy, Flame, Award, Terminal } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  score: number
  streak: number
  longestStreak: number
  users: {
    name: string
    email: string
  }
}

export default async function LeaderboardPage() {
  const currentUser = await getSessionUser()

  let leaderboardData: LeaderboardEntry[] = []
  let isMock = false

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
    isMock = true
    // Seed high fidelity mock board
    leaderboardData = [
      { userId: 'u1', score: 210, streak: 21, longestStreak: 21, users: { name: 'lucid_coder', email: 'lucid@mail.com' } },
      { userId: 'u2', score: 180, streak: 18, longestStreak: 18, users: { name: 'nix_master', email: 'nix@mail.com' } },
      { userId: 'u3', score: 150, streak: 15, longestStreak: 15, users: { name: 'binary_guru', email: 'binary@mail.com' } },
      { userId: 'u4', score: 120, streak: 12, longestStreak: 12, users: { name: 'karthik_dsa', email: 'karthik@mail.com' } },
      { userId: 'u5', score: 90, streak: 9, longestStreak: 10, users: { name: 'stack_overflow', email: 'stack@mail.com' } },
      { userId: 'u6', score: 70, streak: 7, longestStreak: 7, users: { name: 'git_commit', email: 'git@mail.com' } },
      { userId: 'u7', score: 40, streak: 4, longestStreak: 5, users: { name: 'null_ptr', email: 'null@mail.com' } },
    ]
  } else {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
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

      if (data) {
        // Type coercion
        leaderboardData = data as unknown as LeaderboardEntry[]
      }

      // If db leaderboard is empty, put mock values
      if (leaderboardData.length === 0) {
        leaderboardData = [
          { userId: 'u1', score: 0, streak: 0, longestStreak: 0, users: { name: currentUser?.name || 'You', email: currentUser?.email || 'you@mail.com' } }
        ]
      }
    } catch (err) {
      console.error('Leaderboard error:', err)
      isMock = true
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col gap-8">
      {/* Alert if using mock mode */}
      {isMock && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2 max-w-xl">
          <Terminal className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs font-mono text-amber-400">
            <span className="font-bold">Demo Mode:</span> Showing global mock user rankings. Configure Supabase integration to enable live rankings.
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Rankings are calculated based on challenge completion score (+10 per day) and current daily streak.
        </p>
      </div>

      {/* Podium for Top 3 */}
      {leaderboardData.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto w-full items-end mt-4 mb-2">
          {/* Second Place */}
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-zinc-900 border border-zinc-850 flex items-center justify-center font-mono text-zinc-300 font-bold mb-2 shadow-lg">
              2
            </div>
            <div className="rounded-t-lg border-x border-t border-zinc-800 bg-zinc-950/40 w-full text-center p-4 h-32 flex flex-col justify-center">
              <span className="text-xs font-bold text-white font-mono truncate px-1">
                {leaderboardData[1].users?.name || 'Anonymous'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 font-mono">{leaderboardData[1].score} pts</span>
              <span className="text-[10px] text-orange-400 font-mono mt-1 flex items-center justify-center gap-0.5">
                <Flame className="h-3 w-3 fill-orange-500/10" />
                {leaderboardData[1].streak}d
              </span>
            </div>
          </div>

          {/* First Place */}
          <div className="flex flex-col items-center">
            <div className="rounded-full h-16 w-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-yellow-500 font-extrabold mb-2 shadow-2xl relative">
              <Award className="absolute -top-3 h-6 w-6 text-yellow-500 animate-bounce" />
              1
            </div>
            <div className="rounded-t-xl border-x border-t border-zinc-750 bg-zinc-900/40 w-full text-center p-6 h-40 flex flex-col justify-center shadow-2xl">
              <span className="text-sm font-extrabold text-white font-mono truncate px-1">
                {leaderboardData[0].users?.name || 'Anonymous'}
              </span>
              <span className="text-xs text-zinc-300 mt-1 font-mono">{leaderboardData[0].score} pts</span>
              <span className="text-xs text-orange-500 font-mono mt-1.5 flex items-center justify-center gap-0.5">
                <Flame className="h-4.5 w-4.5 fill-orange-500/10" />
                {leaderboardData[0].streak}d
              </span>
            </div>
          </div>

          {/* Third Place */}
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-zinc-900 border border-zinc-850 flex items-center justify-center font-mono text-zinc-400 font-bold mb-2 shadow-lg">
              3
            </div>
            <div className="rounded-t-lg border-x border-t border-zinc-800 bg-zinc-950/40 w-full text-center p-4 h-28 flex flex-col justify-center">
              <span className="text-xs font-bold text-white font-mono truncate px-1">
                {leaderboardData[2].users?.name || 'Anonymous'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-1 font-mono">{leaderboardData[2].score} pts</span>
              <span className="text-[10px] text-orange-400 font-mono mt-1 flex items-center justify-center gap-0.5">
                <Flame className="h-3 w-3 fill-orange-500/10" />
                {leaderboardData[2].streak}d
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-900">
          <thead className="bg-zinc-950/80">
            <tr>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-mono font-semibold text-zinc-500">
                RANK
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-mono font-semibold text-zinc-500">
                PARTICIPANT
              </th>
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-mono font-semibold text-zinc-500">
                DAILY STREAK
              </th>
              <th scope="col" className="px-6 py-3.5 text-right text-xs font-mono font-semibold text-zinc-500">
                TOTAL SCORE
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
            {leaderboardData.map((entry, idx) => {
              const rank = idx + 1
              const name = entry.users?.name || 'Anonymous User'
              const email = entry.users?.email || ''
              const isCurrentUser = currentUser?.id === entry.userId

              return (
                <tr
                  key={entry.userId}
                  className={`hover:bg-zinc-950/60 transition-colors ${
                    isCurrentUser ? 'bg-zinc-900/30' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-zinc-400">
                    {rank < 10 ? `0${rank}` : rank}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold font-mono ${isCurrentUser ? 'text-white' : 'text-zinc-300'}`}>
                        {name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-500">
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm font-mono text-orange-500">
                      <Flame className="h-4 w-4 fill-orange-500/10" />
                      <span>{entry.streak} days</span>
                      {entry.longestStreak > entry.streak && (
                        <span className="text-[10px] text-zinc-500 font-sans">
                          (max {entry.longestStreak}d)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-mono font-bold text-white">
                    {entry.score} pts
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
