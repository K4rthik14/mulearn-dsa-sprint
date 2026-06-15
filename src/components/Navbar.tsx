'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Flame, Trophy, User, Shield, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface NavbarProps {
  user?: {
    email: string | null | undefined
    name?: string
    isAdmin?: boolean
  } | null
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Skip rendering navbar on login, signup, and landing page if not needed,
  // but let's render it on landing page and all dashboard pages.
  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Flame },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const isAdmin = 
    user?.isAdmin || 
    (user as any)?.isadmin || 
    (user as any)?.is_admin || 
    false

  return (
    <nav className="border-b border-border bg-black/60 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-mono font-bold text-lg tracking-tight text-white group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-white transition-all group-hover:border-zinc-700">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />
              </span>
              <span>Streak<span className="text-zinc-400">Code</span></span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin') ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Shield className="h-4 w-4 text-emerald-500" />
                Admin Panel
              </Link>
            )}
          </div>

          {/* User Section / CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
                  {user.name || user.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-white px-3.5 py-1.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-all font-mono"
                >
                  Join Challenge
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-black px-2 py-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium ${
                  isActive ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium ${
                pathname.startsWith('/admin') ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:bg-zinc-950 hover:text-white'
              }`}
            >
              <Shield className="h-5 w-5 text-emerald-500" />
              Admin Panel
            </Link>
          )}

          {user ? (
            <div className="pt-4 border-t border-zinc-900 mt-2 px-3">
              <div className="text-sm font-mono text-zinc-500 mb-2">
                Signed in as: {user.name || user.email}
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-base font-medium text-red-400 hover:bg-red-950/20 cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-zinc-900 mt-2 px-3 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-md border border-zinc-800 px-3 py-2 text-base font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-md bg-white px-3 py-2 text-base font-semibold text-black hover:bg-zinc-200"
              >
                Join Challenge
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
