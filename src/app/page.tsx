import Link from 'next/link'
import { Flame, Code, Users, Calendar, Trophy, ArrowRight, CheckCircle2, Terminal, Target, Zap, ChevronRight } from 'lucide-react'
import { getSessionUser } from '@/utils/supabase/user'

const FEATURED_SPRINTS = [
  {
    title: "21-Day DSA Habit Builder",
    desc: "Our flagship track designed to establish consistency. Step-by-step progression from basic arrays to complex graphs.",
    days: 21,
    difficulty: "Mixed",
    tag: "Recommended"
  },
  {
    title: "Blind 75 Interview Prep",
    desc: "Master the 75 essential LeetCode questions most frequently asked by Google, Meta, and Amazon.",
    days: 15,
    difficulty: "Medium Focus",
    tag: "High Yield"
  },
  {
    title: "7-Day DP Intensive",
    desc: "Conquer your fear of Dynamic Programming. Covers memoization, tabulations, grids, and string alignment.",
    days: 7,
    difficulty: "Hard Focus",
    tag: "Specialized"
  }
]

export default async function LandingPage() {
  const user = await getSessionUser()

  return (
    <div className="relative isolate overflow-hidden bg-black bg-dot-grid flex-1 flex flex-col justify-between">
      {/* Glow effects */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-orange-500/10 to-zinc-500/10 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-32 flex-1">
        {/* Monospace Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-mono text-zinc-400">
            <Terminal className="h-3 w-3 text-orange-500" />
            <span>git commit -m &quot;start dsa sprint&quot;</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-sans">
            Conquer DSA with <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Curated Sprints</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Establish a consistent problem-solving habit. Choose a curated coding sprint, upload your solution log, and watch your daily streak grow. Fully self-paced, frictionless, and automated.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {user ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono"
                >
                  Start a Free Sprint
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold leading-6 text-zinc-300 hover:text-white"
                >
                  Sign In <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Sprints Section */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-mono flex items-center justify-center gap-2">
              <Target className="h-6 w-6 text-orange-500" />
              Available Sprints
            </h2>
            <p className="mt-2 text-sm text-zinc-450">
              Each sprint features locked topics unlocked day-by-day. Join one to begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_SPRINTS.map((sprint) => (
              <div
                key={sprint.title}
                className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between hover:border-zinc-800 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-wider bg-orange-950/20 px-2 py-0.5 rounded border border-orange-900/30">
                      {sprint.tag}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {sprint.days} Days
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">{sprint.title}</h3>
                  <p className="mt-2.5 text-xs text-zinc-450 leading-relaxed">{sprint.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-550">
                    Difficulty: <span className="text-zinc-400">{sprint.difficulty}</span>
                  </span>
                  <Link
                    href={user ? "/dashboard" : "/signup"}
                    className="text-[11px] font-mono font-semibold text-white hover:text-orange-400 flex items-center gap-0.5 transition-colors"
                  >
                    View Sprint <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850">
                <Zap className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white font-mono">Instant Auto-Approval</h3>
              <p className="mt-2 text-xs text-zinc-450 leading-relaxed">
                No waiting for manual reviews. Log your profile or paste a solution, and the platform verifies your progress immediately.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white font-mono">Streak Mechanics</h3>
              <p className="mt-2 text-xs text-zinc-450 leading-relaxed">
                Consistency is key. Build up your daily streak, accumulate XP score points, and maintain your commitment calendar.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850">
                <Trophy className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white font-mono">Global Leaderboard</h3>
              <p className="mt-2 text-xs text-zinc-450 leading-relaxed">
                Stack up against other software engineers. Gain standings based on problems completed and consistent streak longevity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            &copy; 2026 DSASprint. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span className="hover:text-zinc-300 cursor-pointer">Syllabus</span>
            <span className="hover:text-zinc-300 cursor-pointer">Rules</span>
            <span className="hover:text-zinc-300 cursor-pointer">Supabase Stack</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
