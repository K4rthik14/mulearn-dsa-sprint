'use client'

import { useState } from 'react'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import { Terminal } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result && result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-black px-6 py-12 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2 font-mono font-bold text-lg tracking-tight text-white mb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 border border-zinc-800">
            <Terminal className="h-4 w-4 text-blue-500" />
          </span>
          <span>DSA <span className="text-zinc-500">Sprint</span></span>
        </Link>
        <h2 className="text-center text-base font-semibold tracking-tight text-white font-mono">
          Create your account
        </h2>
        <p className="text-xs text-zinc-600 font-mono mt-1">Internal bootcamp platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-6 space-y-4 font-mono">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-[10px] font-semibold leading-6 text-zinc-500 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Karthik"
                  className="block w-full rounded border border-zinc-800 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] font-semibold leading-6 text-zinc-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@domain.com"
                  className="block w-full rounded border border-zinc-800 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-semibold leading-6 text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded border border-zinc-800 bg-black px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {error && (
              <div className="rounded border border-red-900 bg-red-950/10 p-3 flex items-start gap-2">
                <Terminal className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <span className="text-xs text-red-400 leading-normal">{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded bg-white px-3 py-2 text-xs font-bold text-black hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-zinc-600">
            Already registered?{' '}
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
