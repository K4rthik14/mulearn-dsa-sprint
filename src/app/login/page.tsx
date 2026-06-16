'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { Flame, Terminal } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result && result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const handleAutofillAdmin = () => {
    setEmail('codewithkarthii@gmail.com')
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-black bg-dot-grid px-6 py-12 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 font-mono font-bold text-2xl tracking-tight text-white mb-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-white">
            <Flame className="h-5 w-5 text-orange-500 fill-orange-500/20" />
          </span>
          <span>Streak<span className="text-zinc-400">Code</span></span>
        </Link>
        <h2 className="text-center text-xl font-semibold leading-9 tracking-tight text-white font-mono">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-mono font-medium leading-6 text-zinc-400">
                EMAIL ADDRESS
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-mono font-medium leading-6 text-zinc-400">
                  PASSWORD
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2">
                <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-xs font-mono text-red-400 leading-normal">{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-600 font-mono text-[10px]">OR</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleAutofillAdmin}
                className="flex w-full justify-center items-center gap-2 rounded-md border border-orange-500/20 bg-orange-950/10 px-3 py-2 text-xs font-mono font-semibold text-orange-400 hover:bg-orange-950/25 transition-all cursor-pointer"
              >
                <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500/20" />
                Autofill Admin Email
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500 font-mono">
            Not a member?{' '}
            <Link href="/signup" className="font-semibold text-zinc-300 hover:text-white transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
