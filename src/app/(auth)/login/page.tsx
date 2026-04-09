'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import Image from 'next/image'
import { X, Check } from 'lucide-react'

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
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [savedAccounts, setSavedAccounts] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const stored = localStorage.getItem('bookjm_saved_accounts')
    if (stored) {
      try {
        setSavedAccounts(JSON.parse(stored))
      } catch (e) {}
    }
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const identifier = formData.get('identifier') as string
    const password = formData.get('password') as string
    const rememberMe = formData.get('remember') === 'on'

    setErrorMsg(null)
    startTransition(async () => {
      const res = await login(null, formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else if (res?.success && res.url) {
        if (rememberMe && res.profile) {
          const newAccount = {
            identifier,
            password,
            name: res.profile.fullName || identifier.split('@')[0],
            avatar: res.profile.avatarUrl
          }
          const stored = JSON.parse(localStorage.getItem('bookjm_saved_accounts') || '[]')
          const filtered = stored.filter((a: any) => a.identifier !== identifier)
          const updated = [newAccount, ...filtered]
          localStorage.setItem('bookjm_saved_accounts', JSON.stringify(updated))
          setSavedAccounts(updated) // just in case
        }
        router.push(res.url)
      }
    })
  }

  const handleFastLogin = (account: any) => {
    setErrorMsg(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('identifier', account.identifier)
      formData.append('password', account.password)
      
      const res = await login(null, formData)
      if (res?.error) {
        setErrorMsg(`${res.error} (Saved password may have changed. Please log in manually.)`)
      } else if (res?.success && res.url) {
        router.push(res.url)
      }
    })
  }

  const removeSavedAccount = (e: React.MouseEvent, identifier: string) => {
    e.stopPropagation()
    const stored = JSON.parse(localStorage.getItem('bookjm_saved_accounts') || '[]')
    const updated = stored.filter((a: any) => a.identifier !== identifier)
    localStorage.setItem('bookjm_saved_accounts', JSON.stringify(updated))
    setSavedAccounts(updated)
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background hidden-scrollbar">
      
      {/* ── LEFT PANEL: Branding Hero (Visible on md+) ── */}
      <div className="relative hidden md:flex flex-col items-center justify-center w-full md:w-1/2 p-8 lg:p-16 bg-slate-900 border-r border-white/5 overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-sm lg:max-w-md">
          <div className="relative w-32 h-32 lg:w-40 lg:h-40 rounded-[40px] lg:rounded-[48px] overflow-hidden shadow-[0_0_80px_-20px_rgba(139,92,246,0.6)] border border-white/10 mb-8 lg:mb-10 transition-transform duration-700 hover:scale-105 hover:rotate-3">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent z-10 pointer-events-none" />
            <Image src="/logo.png" alt="BookJM Logo" fill priority sizes="(max-width: 1024px) 128px, 160px" className="object-cover" />
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
      <div className="relative flex flex-col items-center justify-center w-full md:w-1/2 p-6 sm:p-12 lg:p-24 bg-background">
        
        {/* Mobile Branding (Only visible when flex collapses) */}
        <div className="md:hidden flex flex-col items-center gap-4 mb-8 w-full mt-4">
          <div className="relative w-20 h-20 rounded-3xl overflow-hidden shadow-[0_0_50px_-15px_rgba(139,92,246,0.4)] border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-transparent z-10 pointer-events-none" />
            <Image src="/logo.png" alt="BookJM Logo" fill priority sizes="80px" className="object-cover" />
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            BookJM
          </h1>
        </div>

        {/* The Form Container */}
        <div className="w-full max-w-sm">

          {/* ── SAVED ACCOUNTS ── */}
          {isClient && savedAccounts.length > 0 && (
            <div className="mb-8 w-full">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">Saved Accounts</p>
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {savedAccounts.map((account) => (
                  <div 
                    key={account.identifier} 
                    onClick={() => handleFastLogin(account)}
                    className="relative flex flex-col items-center gap-2 cursor-pointer group shrink-0 snap-start w-[72px]"
                  >
                    <button 
                      onClick={(e) => removeSavedAccount(e, account.identifier)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-card border border-border text-muted-foreground hover:text-white rounded-full flex justify-center items-center opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-rose-500 shadow-md scale-75 group-hover:scale-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="relative w-14 h-14 rounded-[1.25rem] bg-muted/20 border-2 border-transparent group-hover:border-violet-500/50 shadow-sm transition-all overflow-hidden flex items-center justify-center">
                      {pending ? (
                         <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                            <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                         </div>
                      ) : null}
                      {account.avatar ? (
                        <Image src={account.avatar} alt={account.name} fill className="object-cover" />
                      ) : (
                        <span className="text-sm font-black text-foreground/50">{account.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-foreground/80 truncate w-full text-center group-hover:text-foreground transition-colors">{account.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Log In</h2>
            <p className="text-muted-foreground text-sm">Sign in manually with your account</p>
          </div>

          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>

          <form onSubmit={handleSubmit} className="w-full space-y-5 mt-4">
            <div className="w-full space-y-1.5">
              <Label htmlFor="identifier" className="text-muted-foreground/80 text-[10px] font-black uppercase tracking-widest ml-1 block">
                Username / Email
              </Label>
              <Input
                id="identifier"
                name="identifier"
                placeholder="Enter your account"
                required
                autoComplete="username"
                className="w-full bg-card/50 backdrop-blur-xl border-border text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/50 hover:border-border/80 h-12 rounded-2xl text-sm px-4 transition-all shadow-sm"
              />
            </div>

            <div className="w-full space-y-1.5">
              <Label htmlFor="password" className="text-muted-foreground/80 text-[10px] font-black uppercase tracking-widest ml-1 block">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-card/50 backdrop-blur-xl border-border text-foreground placeholder:text-muted-foreground/50 focus:border-violet-500/50 hover:border-border/80 h-12 rounded-2xl text-sm px-4 transition-all shadow-sm"
              />
            </div>

            <div className="pt-1 flex items-center space-x-3 ml-1">
              <Checkbox id="remember" name="remember" className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600" />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="remember"
                  className="text-xs font-bold text-foreground/80 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Save login info
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="w-full rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs text-red-400 text-center font-semibold mt-2">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-foreground font-black text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.2)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.3)] border-0 rounded-2xl mt-8 active:scale-[0.98]"
            >
              {pending ? (
                <span className="flex flex-row items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </Button>
          </form>

          <footer className="mt-10 lg:mt-12 pt-6 lg:pt-8 border-t border-border/40 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-black w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse flex-shrink-0" />
            Secure Encrypted Connection
          </footer>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"/></div>}>
      <LoginForm />
    </Suspense>
  )
}
