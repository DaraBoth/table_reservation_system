"use client"

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { changeOwnPassword, updateOwnProfile, updateProfileAvatar, checkUsernameAvailability } from '@/app/actions/auth'
import { updateOwnRestaurantInfo, updateRestaurantLogo } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ShieldCheck, 
  Store as StoreIcon, 
  UserCircle, 
  AlertTriangle, 
  Check, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Fingerprint,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import { LogoUpload } from '@/components/account/LogoUpload'
import { toast } from 'sonner'
import type { Database } from '@/lib/types/database'

type RestaurantInfo = Pick<
  Database['public']['Tables']['restaurants']['Row'],
  'name' | 'slug' | 'logo_url' | 'contact_email' | 'contact_phone' | 'address'
>

interface MembershipInfo {
  role: string | null
  restaurant_id: string
  restaurants?: RestaurantInfo | null
}

interface ProfileInfo {
  full_name?: string | null
  avatar_url?: string | null
}

interface AccountClientProps {
  user: User | null
  membership: MembershipInfo
  profile: ProfileInfo | null
}

type Tab = 'profile' | 'security' | 'business'

export function AccountClient({ user, membership, profile }: AccountClientProps) {
  const [passwordState, passwordAction, passwordPending] = React.useActionState(changeOwnPassword, null)
  const [profileState, profileAction, profilePending] = React.useActionState(updateOwnProfile, null)
  const [businessState, businessAction, businessPending] = React.useActionState(updateOwnRestaurantInfo, null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = React.useState(profile?.full_name || '')
  
  const initialUsername = (user?.email && user.email.endsWith('@system.local'))
    ? user.email.split('@')[0]
    : user?.email || ''
  const [username, setUsername] = React.useState(initialUsername)
  const [isChecking, setIsChecking] = React.useState(false)
  const [isAvailable, setIsAvailable] = React.useState<boolean | null>(null)
  const [usernameError, setUsernameError] = React.useState<string | null>(null)
  
  const [currentLogoUrl, setCurrentLogoUrl] = React.useState(membership?.restaurants?.logo_url || '')
  
  // Sync state with props when they change (e.g. after router refresh)
  React.useEffect(() => {
    if (membership?.restaurants?.logo_url) {
      setCurrentLogoUrl(membership.restaurants.logo_url)
    }
  }, [membership?.restaurants?.logo_url])
  
  const storeName = membership?.restaurants?.name || 'Store'
  const storeSlug = membership?.restaurants?.slug || ''
  
  const checkAvailability = async () => {
    if (!username || username === initialUsername) {
       setIsAvailable(true)
       setUsernameError(null)
       return
    }
    
    // Basic validation
    if (username.length < 2) {
      setUsernameError('Min 2 characters')
      setIsAvailable(false)
      return
    }
    if (!/^[a-z0-9_.]+$/.test(username)) {
      setUsernameError('Lowercase, numbers, _ and . only')
      setIsAvailable(false)
      return
    }

    setIsChecking(true)
    setUsernameError(null)
    try {
      const res = await checkUsernameAvailability(username)
      setIsAvailable(res.available)
      if (!res.available) setUsernameError('Already taken')
    } catch (e) {
      toast.error('Check failed')
    } finally {
      setIsChecking(false)
    }
  }
  
  const activeTab = (searchParams.get('tab') as Tab) || 'profile'

  const setActiveTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const isAdmin = ['admin', 'superadmin'].includes(membership?.role || '')

  const menu = [
    { id: 'profile', icon: UserCircle, label: 'My Info' },
    { id: 'security', icon: ShieldCheck, label: 'Password' },
    ...(isAdmin ? [{ id: 'business', icon: StoreIcon, label: 'Store' }] : []),
  ]

  const getTabButtonClassName = (active: boolean) => cn(
    "flex items-center gap-3 rounded-2xl font-black italic uppercase tracking-tighter transition-all group relative",
    "px-3 py-3.5 text-sm whitespace-nowrap",
    active ? "bg-violet-600/10 text-violet-400" : "text-muted-foreground hover:text-foreground/70 hover:bg-card/50"
  )

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6 md:py-8 xl:px-8 xl:py-12">
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-14">
        
        {/* Tablet rail */}
        <aside className="xl:hidden">
          <div className="rounded-[28px] border border-border/50 bg-card/35 p-3 backdrop-blur-sm">
            <div className="mb-3 px-2">
              <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Settings</h1>
            </div>
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2 px-1">
                {menu.map((item) => {
                  const Icon = item.icon
                  const active = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={cn(getTabButtonClassName(active), "min-w-[160px] justify-center")}
                    >
                      {active && (
                        <motion.div layoutId="nav" className="absolute inset-0 rounded-2xl border border-violet-500/20 bg-violet-600/5" />
                      )}
                      <Icon className={cn("relative z-10 h-4.5 w-4.5", active ? "text-violet-400" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Desktop sidebar */}
        <aside className="hidden xl:block xl:space-y-8">
          <div className="sticky top-12 flex flex-col gap-1">
            <h1 className="mb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Settings</h1>
            {menu.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={getTabButtonClassName(active)}
                >
                  {active && (
                    <motion.div layoutId="nav" className="absolute inset-0 rounded-2xl border border-violet-500/20 bg-violet-600/5" />
                  )}
                  <Icon className={cn("relative z-10 h-4.5 w-4.5", active ? "text-violet-400" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Content - Flat Grid List */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-8 md:space-y-10">
                  <header className="mb-6 md:mb-8">
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">My Info</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70 italic">Update your name and photo.</p>
                  </header>

                  <div className="space-y-8 md:space-y-10">
                    <div className="grid gap-6 border-b border-border pb-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-8">
                      <AvatarUpload 
                        currentAvatarUrl={profile?.avatar_url}
                        userName={profile?.full_name || 'User'}
                        onUpload={async (blob) => {
                          const formData = new FormData()
                          formData.append('file', blob, 'avatar.jpg')
                          const res = await updateProfileAvatar(formData)
                          if (res.error) {
                            toast.error(res.error)
                            throw new Error(res.error)
                          }
                          toast.success('Photo saved')
                        }}
                      />
                      <div className="min-w-0 text-center md:text-left">
                        <p className="text-xl font-black text-foreground italic uppercase tracking-tight">{profile?.full_name}</p>
                        <p className="text-xs font-black uppercase tracking-widest text-violet-500 mt-0.5">{membership?.role}</p>
                        <p className="mt-1 break-all text-xs font-bold tracking-tight text-muted-foreground/60">{user?.email}</p>
                      </div>
                    </div>

                    <form action={profileAction} className="space-y-6 md:space-y-8 md:max-w-2xl">
                        <div className="grid gap-6 md:grid-cols-2">
                          <div className="space-y-3 px-1">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Name</Label>
                            <Input
                              name="fullName"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                              placeholder="Your name"
                            />
                          </div>

                          <div className="space-y-3 px-1">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Username</Label>
                            <div className="relative group">
                              <Input
                                name="username"
                                value={username}
                                onChange={(e) => {
                                  setUsername(e.target.value.toLowerCase())
                                  setIsAvailable(null)
                                  setUsernameError(null)
                                }}
                                className={cn(
                                  "h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20 pr-32",
                                  isAvailable === true && "border-emerald-500/50 focus-visible:border-emerald-500",
                                  isAvailable === false && "border-rose-500/50 focus-visible:border-rose-500"
                                )}
                                placeholder="cool.guy"
                              />
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {isAvailable === true && (
                                  <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-full">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <Button 
                                  type="button" 
                                  onClick={checkAvailability}
                                  disabled={isChecking || !username || username === initialUsername}
                                  className="h-10 px-4 bg-muted/50 hover:bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground rounded-xl border-0"
                                >
                                  {isChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}
                                </Button>
                              </div>
                            </div>
                            {usernameError && (
                              <p className="px-1 text-[10px] font-black uppercase tracking-widest text-rose-400 mt-1">{usernameError}</p>
                            )}
                            <p className="px-1 text-[10px] font-bold text-muted-foreground/40 mt-1 flex items-center gap-1.5">
                              <Fingerprint className="w-3 h-3" />
                              This is your login identifier.
                            </p>
                          </div>
                        </div>

                      {profileState?.success && (
                        <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Profile and login credentials updated</p>
                      )}
                      {profileState?.error && (
                        <p className="text-xs text-rose-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><AlertTriangle className="w-3.5 h-3.5" /> {profileState.error}</p>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <Button 
                          type="submit" 
                          disabled={profilePending || (isAvailable === false && username !== initialUsername)} 
                          className="h-10 px-8 bg-violet-600 hover:bg-violet-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all"
                        >
                          {profilePending ? 'Saving...' : 'Save'}
                        </Button>
                        {username !== initialUsername && isAvailable === null && (
                           <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 animate-pulse">Check username before saving</p>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8 md:space-y-10 md:max-w-2xl">
                  <header>
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Password</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70 italic">Change your password.</p>
                  </header>

                  <div className="space-y-12">
                     <form action={passwordAction} className="space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3 px-1">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">New Password</Label>
                          <Input
                            name="newPassword"
                            type="password"
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                          />
                        </div>
                        <div className="space-y-3 px-1">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Confirm Password</Label>
                          <Input
                            name="confirmPassword"
                            type="password"
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                          />
                        </div>
                        </div>

                        {passwordState?.success && (
                          <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Password Saved</p>
                        )}
                        {passwordState?.error && (
                          <p className="text-xs text-rose-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><AlertTriangle className="w-3.5 h-3.5" /> {passwordState.error}</p>
                        )}

                        <Button type="submit" disabled={passwordPending} className="h-10 px-8 bg-violet-600 hover:bg-violet-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all">
                          {passwordPending ? 'Saving...' : 'Save'}
                        </Button>
                     </form>
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-8 md:space-y-10">
                  <header>
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Store</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70 italic">Update your store details.</p>
                  </header>

                  <div className="space-y-8 md:space-y-10">
                    <form action={businessAction} className="space-y-10">
                      <input type="hidden" name="restaurantId" value={membership?.restaurant_id || ''} />
                      <input type="hidden" name="logoUrl" value={currentLogoUrl} />
                      <div className="grid items-center gap-8 border-b border-border/50 pb-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10 md:pb-10">
                        <LogoUpload 
                          currentLogoUrl={currentLogoUrl}
                          businessName={storeName}
                          onUpload={async (blob) => {
                            const formData = new FormData()
                            formData.append('file', blob, 'logo.jpg')
                            const res = await updateRestaurantLogo(membership.restaurant_id, formData)
                            if (res?.error) {
                              toast.error(res.error)
                              throw new Error(res.error)
                            }
                            if ((res as any).url) {
                              setCurrentLogoUrl((res as any).url)
                            }
                            router.refresh()
                            toast.success('Logo saved')
                          }}
                        />
                        <div className="min-w-0 space-y-1 text-center md:text-left">
                          <h3 className="text-xl font-black text-foreground italic uppercase tracking-tight">{storeName}</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500/60">Logo and link</p>
                          <p className="text-xs text-muted-foreground/60 font-bold max-w-md leading-relaxed mt-2">
                            This logo shows in your app and booking pages. Use a square image for the best fit.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
                        <div className="space-y-3 col-span-full px-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StoreIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Store Name</Label>
                          </div>
                          <Input
                            name="name"
                            defaultValue={storeName}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-3 col-span-full px-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Short Link</Label>
                          </div>
                          <Input
                            name="slug"
                            defaultValue={storeSlug}
                            placeholder="my-store"
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                          <p className="px-1 text-[11px] font-bold text-muted-foreground/60">
                            Use lowercase letters, numbers, and - only.
                          </p>
                        </div>

                        <div className="space-y-3 px-1">
                           <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Email</Label>
                          </div>
                          <Input
                            name="contactEmail"
                            defaultValue={membership?.restaurants?.contact_email ?? ''}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-3 px-1">
                           <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Phone</Label>
                          </div>
                          <Input
                            name="contactPhone"
                            defaultValue={membership?.restaurants?.contact_phone ?? ''}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-3 col-span-full px-1">
                           <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Address</Label>
                          </div>
                          <Input
                            name="address"
                            defaultValue={membership?.restaurants?.address ?? ''}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {businessState?.error && (
                        <p className="text-xs text-rose-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><AlertTriangle className="w-3.5 h-3.5" /> {businessState.error}</p>
                      )}
                      {businessState?.success && (
                        <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Saved</p>
                      )}
                      
                      <Button type="submit" disabled={businessPending} className="h-10 px-8 bg-violet-600 hover:bg-violet-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all">
                        {businessPending ? 'Saving...' : 'Save'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
      
      {/* Native App Footer */}
      <footer className="mt-16 flex flex-col items-center gap-2 border-t border-border/50 pt-10 opacity-30 md:mt-20 md:pt-12">
        <Globe className="w-4 h-4 text-muted-foreground/60" />
        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-[0.4em]">Made for iPad</p>
      </footer>
    </div>
  )
}
