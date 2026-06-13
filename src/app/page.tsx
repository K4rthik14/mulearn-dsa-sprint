import Link from 'next/link'
import { Flame, Code, Users, Calendar, Trophy, ArrowRight, CheckCircle2, ChevronRight, Terminal } from 'lucide-react'
import { getSessionUser } from '@/utils/supabase/user'

const JOURNEY_DAYS = [
  { day: 1, topic: "Arrays & Hashing", desc: "Two Sum, Contains Duplicate", difficulty: "Easy" },
  { day: 2, topic: "Two Pointers", desc: "Valid Palindrome, Two Sum II", difficulty: "Easy" },
  { day: 3, topic: "Sliding Window", desc: "Best Time to Buy & Sell Stock", difficulty: "Easy" },
  { day: 4, topic: "Stacks & Queues", desc: "Valid Parentheses, Min Stack", difficulty: "Easy" },
  { day: 5, topic: "Linked Lists", desc: "Reverse Linked List, Merge Lists", difficulty: "Easy" },
  { day: 6, topic: "Binary Search", desc: "Search in a Sorted Array", difficulty: "Easy" },
  { day: 7, topic: "Recursion & Backtracking", desc: "Fibonacci, Subsets", difficulty: "Medium" },
  { day: 8, topic: "Trees: DFS & BFS", desc: "Invert Binary Tree, Max Depth", difficulty: "Medium" },
  { day: 9, topic: "Binary Search Trees", desc: "Validate BST, Search BST", difficulty: "Medium" },
  { day: 10, topic: "Heaps / Priority Queues", desc: "Kth Largest Element in Array", difficulty: "Medium" },
  { day: 11, topic: "Hashing Advanced", desc: "Group Anagrams, Top K Frequent", difficulty: "Medium" },
  { day: 12, topic: "Graphs: DFS & BFS", desc: "Clone Graph, Course Schedule", difficulty: "Medium" },
  { day: 13, topic: "Graphs: Matrix Paths", desc: "Number of Islands, Flood Fill", difficulty: "Medium" },
  { day: 14, topic: "Dynamic Programming (1D)", desc: "Climbing Stairs, House Robber", difficulty: "Medium" },
  { day: 15, topic: "Dynamic Programming (2D)", desc: "Unique Paths, Longest Common Subsequence", difficulty: "Medium" },
  { day: 16, topic: "Greedy Algorithms", desc: "Jump Game, Gas Station", difficulty: "Medium" },
  { day: 17, topic: "Intervals", desc: "Merge Intervals, Insert Interval", difficulty: "Medium" },
  { day: 18, topic: "Tries", desc: "Implement Trie (Prefix Tree)", difficulty: "Medium" },
  { day: 19, topic: "Bit Manipulation", desc: "Single Number, Number of 1 Bits", difficulty: "Easy" },
  { day: 20, topic: "Advanced Graphs", desc: "Network Delay Time, Min Spanning Tree", difficulty: "Hard" },
  { day: 21, topic: "Grand Finale Sprint", desc: "Median of Two Sorted Arrays, DP Wrap", difficulty: "Hard" },
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
            <span>git commit -m &quot;start challenge&quot;</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl font-sans">
            Build a Daily <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">DSA Habit</span> in 21 Days.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            The hardest part of data structures and algorithms isn&apos;t the trees or the dynamic programming — it&apos;s consistency. Break the cycle, solve 1 daily curated problem, and build a lasting habit.
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
                  Join the 21-Day Challenge
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

        {/* Features Grid */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32 lg:mt-40">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 glow-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Curated Progression</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Step-by-step curriculum starting from arrays and sorting up to complex graphs and DP. One challenge unlocked every 24 hours.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 glow-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Streak System</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Visual streak trackers and contribution graphs force you to log in daily, upload your solutions, and keep the chain alive.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 glow-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
                <Trophy className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">Leaderboards</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Compete with other engineers. Earn points for speed, daily submissions, and overall streak length.
              </p>
            </div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="mx-auto mt-24 max-w-5xl sm:mt-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-mono">
              The 21-Day Syllabus
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              One locked topic per day. Rise from basics to high-frequency interview classics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {JOURNEY_DAYS.map((day) => (
              <div
                key={day.day}
                className="group relative rounded-lg border border-zinc-900 bg-zinc-950/30 p-5 hover:border-zinc-800 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-orange-500">
                    DAY {day.day < 10 ? `0${day.day}` : day.day}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    day.difficulty === "Easy" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" :
                    day.difficulty === "Medium" ? "border-amber-500/20 bg-amber-500/10 text-amber-400" :
                    "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}>
                    {day.difficulty}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
                  {day.topic}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                  {day.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/50 py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
          <div>
            &copy; 2026 StreakCode. All rights reserved.
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
