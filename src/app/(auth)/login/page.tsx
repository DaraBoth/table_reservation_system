'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Suspense } from 'react'
import Image from 'next/image'

function LoginErrorBanner() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const messages: Record<string, string> = {
    account_disabled: 'Your account is disabled. Please contact your manager.',
    restaurant_suspended: 'This restaurant account is stopped. Please contact support.',
    subscription_expired: 'Your subscription has ended. Please contact support.',
  }
  if (!error || !messages[error]) return null
  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
      {messages[error]}
    </div>
  )
}

function LoginForm() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950">
      
      {/* ── LEFT PANEL: Branding Hero (Visible on md+) ── */}
      <div className="relative hidden md:flex flex-col items-center justify-center w-full md:w-1/2 p-8 lg:p-16 bg-slate-900 border-r border-white/5 overflow-hidden">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm lg:max-w-md">
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-[40px] lg:rounded-[48px] overflow-hidden shadow-[0_0_80px_-20px_rgba(139,92,246,0.6)] border border-white/10 mb-8 lg:mb-10 transition-transform duration-700 hover:scale-105 hover:rotate-3">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent z-10 pointer-events-none" />
            <Image src="/logo.png" alt="BookJM Logo" fill className="object-cover" />
          </div>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 tracking-tight mb-4">
            BookJM
          </h1>
          <p className="text-violet-200/60 font-medium text-base lg:text-lg xl:text-xl leading-relaxed">
            The premium management engine for world-class restaurants and boutique hotels.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Clean Flat Form ── */}
      <div className="relative flex flex-col items-center justify-center w-full md:w-1/2 p-6 sm:p-12 lg:p-24 bg-slate-950">
        
        {/* Mobile Branding (Only visible when flex collapses) */}
        <div className="md:hidden flex flex-col items-center gap-4 mb-10 w-full">
          <div className="relative w-24 h-24 rounded-[32px] overflow-hidden shadow-[0_0_50px_-15px_rgba(139,92,246,0.4)] border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent z-10 pointer-events-none" />
            <Image src="/logo.png" alt="BookJM Logo" fill className="object-cover" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            BookJM
          </h1>
        </div>

        {/* The Form Container */}
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:mb-10 text-center md:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 text-sm lg:text-base">Sign in to manage your spaces</p>
          </div>

          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>

          <form action={action} className="w-full space-y-6 mt-4">
            <div className="w-full space-y-2">
              <Label htmlFor="identifier" className="text-slate-400/90 text-xs font-bold uppercase tracking-widest ml-1 block">
                Account
              </Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="Username or Email"
                required
                autoComplete="username"
                className="w-full bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:bg-slate-800 focus:border-violet-500/50 hover:border-slate-700 h-14 rounded-2xl text-base px-5 transition-all shadow-inner"
              />
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-slate-400/90 text-xs font-bold uppercase tracking-widest block">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:bg-slate-800 focus:border-violet-500/50 hover:border-slate-700 h-14 rounded-2xl text-base px-5 transition-all shadow-inner"
              />
            </div>

            {state?.error && (
              <div className="w-full rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center mt-2">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.4)] border-0 rounded-2xl mt-8"
            >
              {pending ? (
                <span className="flex flex-row items-center gap-3">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </Button>
          </form>

          <footer className="mt-10 lg:mt-12 pt-6 lg:pt-8 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse flex-shrink-0" />
            Secure Connection
          </footer>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
