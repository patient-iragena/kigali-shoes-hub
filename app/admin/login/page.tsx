'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const ALLOWED_ADMIN_EMAIL = 'patientira79@gmail.com'
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes in milliseconds

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLockedOut, setIsLockedOut] = useState(false)
  const [lockoutRemaining, setLockoutRemaining] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check lockout status on component mount
  useEffect(() => {
    const checkLockout = () => {
      const lockoutTimestamp = localStorage.getItem('admin_lockout_until')
      if (lockoutTimestamp) {
        const remaining = parseInt(lockoutTimestamp, 10) - Date.now()
        if (remaining > 0) {
          setIsLockedOut(true)
          setLockoutRemaining(Math.ceil(remaining / 1000 / 60))
        } else {
          localStorage.removeItem('admin_lockout_until')
          localStorage.removeItem('admin_login_attempts')
          setIsLockedOut(false)
        }
      }
    }

    checkLockout()
    const timer = setInterval(checkLockout, 10000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (isLockedOut) {
      setErrorMessage(`Account temporarily locked. Try again in ${lockoutRemaining} minutes.`)
      return
    }

    // Verify authorized email address
    if (email.trim().toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
      setErrorMessage('Access denied. Unauthorized admin email.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      const currentAttempts = parseInt(localStorage.getItem('admin_login_attempts') || '0', 10) + 1
      localStorage.setItem('admin_login_attempts', currentAttempts.toString())

      if (currentAttempts >= 2) {
        const unlockTime = Date.now() + LOCKOUT_DURATION_MS
        localStorage.setItem('admin_lockout_until', unlockTime.toString())
        setIsLockedOut(true)
        setLockoutRemaining(15)
        setErrorMessage('Invalid credentials. Maximum attempts reached. Locked out for 15 minutes.')
      } else {
        setErrorMessage(`Invalid credentials. Attempt ${currentAttempts} of 2.`)
      }

      setLoading(false)
      return
    }

    // Clear failed attempt tracking on success
    localStorage.removeItem('admin_login_attempts')
    localStorage.removeItem('admin_lockout_until')

    // Direct page navigation for instant mobile and desktop session sync
    window.location.href = '/admin'
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-[#111827] p-6 shadow-2xl border border-gray-800 sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#10B981] sm:text-3xl">
            Kigali Shoes Hub
          </h1>
          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
            Admin Dashboard Access
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-950/80 p-3 text-center text-xs font-medium text-red-200 border border-red-800/50 sm:text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 sm:text-sm">
              Email
            </label>
            <input
              type="email"
              required
              disabled={isLockedOut || loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="patientira79@gmail.com"
              className="mt-1 w-full rounded-lg bg-[#1F2937] px-4 py-3 text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981] disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 sm:text-sm">
              Password
            </label>
            <input
              type="password"
              required
              disabled={isLockedOut || loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg bg-[#1F2937] px-4 py-3 text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLockedOut || loading}
            className="w-full rounded-lg bg-[#10B981] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:ring-offset-2 focus:ring-offset-[#111827] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? 'Authenticating...' : isLockedOut ? 'Locked Out' : 'Login to Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}