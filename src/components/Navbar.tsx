'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Menu, X } from 'lucide-react'
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

  if (pathname === '/login' || pathname === '/signup') {
    return null
  }

  const links = [
    { href: '/tracks', label: 'Tracks' },
    { href: '/challenge', label: "Today's Problem" },
    { href: '/submissions', label: 'Submissions' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  const isAdmin = 
    user?.isAdmin || 
    (user as any)?.isadmin || 
    (user as any)?.is_admin || 
    false

  return (
    <nav className="border-b border-zinc-800 bg-black sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono font-bold text-sm tracking-tight text-white hover:text-blue-500 transition-colors">
              DSA Sprint
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-5">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs font-mono transition-colors ${
                      isActive ? 'text-blue-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-xs font-mono transition-colors ${
                    pathname.startsWith('/admin') ? 'text-blue-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* User Section / CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/profile"
                  className={`text-xs font-mono transition-colors ${
                    pathname === '/profile' ? 'text-blue-500 font-semibold' : 'text-zinc-450 hover:text-zinc-300'
                  }`}
                >
                  {user.name || user.email}
                </Link>
                <button
                  onClick={() => logout()}
                  className="text-xs font-mono text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-mono text-zinc-300 hover:border-zinc-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black px-4 py-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-mono ${
                  isActive ? 'text-blue-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {link.label}
              </Link>
            )
          })}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-sm font-mono ${
                pathname.startsWith('/admin') ? 'text-blue-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Admin
            </Link>
          )}

          {user ? (
            <div className="pt-3 border-t border-zinc-900 mt-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-mono text-zinc-400 hover:text-white mb-2"
              >
                Profile ({user.name || user.email})
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  logout()
                }}
                className="w-full text-left py-2 text-sm font-mono text-red-400 hover:text-red-300 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-zinc-900 mt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-mono text-zinc-400 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-mono text-zinc-400 hover:text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
