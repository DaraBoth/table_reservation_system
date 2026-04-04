"use client"

import { useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { changeOwnPassword, updateOwnProfile } from '@/app/actions/auth'
import { updateOwnRestaurantInfo } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { logout } from '@/app/actions/auth'
import { 
  Lock, 
  ShieldCheck, 
  Store, 
  UserCircle, 
  AlertTriangle, 
  Check, 
  UserPen,
  ChevronRight,
  Globe,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface AccountClientProps {
  user: any
  membership: any
  profile: any
}

type Tab = 'profile' | 'security' | 'business'

export function AccountClient({ user, membership, profile }: AccountClientProps) {
  const [passwordState, passwordAction, passwordPending] = useActionState(changeOwnPassword, null)
  const [profileState, profileAction, profilePending] = useActionState(updateOwnProfile, null)
  const [businessState, businessAction, businessPending] = useActionState(updateOwnRestaurantInfo, null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState(profile?.full_name || '')
  
  const activeTab = (searchParams.get('tab') as Tab) || 'profile'

  const setActiveTab = (tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const isAdmin = ['admin', 'superadmin'].includes(membership?.role || '')

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name)
  }, [profile?.full_name])

  const menu = [
    { id: 'profile', icon: UserCircle, label: 'Profile' },
    { id: 'security', icon: ShieldCheck, label: 'Security' },
    ...(isAdmin ? [{ id: 'business', icon: Store, label: 'Business' }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-12 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 md:gap-16">
        
        {/* Native Sidebar */}
        <aside className="space-y-8">
          <div className="flex flex-col gap-1 sticky top-12">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 px-2">Settings</h1>
            {menu.map((item) => {
              const Icon = item.icon
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3.5 rounded-2xl text-sm font-black italic uppercase tracking-tighter transition-all group relative",
                    active ? "bg-violet-600/10 text-violet-400" : "text-muted-foreground hover:text-foreground/70 hover:bg-card/50"
                  )}
                >
                  {active && (
                    <motion.div layoutId="nav" className="absolute inset-0 bg-violet-600/5 rounded-2xl border border-violet-500/20" />
                  )}
                  <Icon className={cn("w-4.5 h-4.5 relative z-10", active ? "text-violet-400" : "text-muted-foreground/60 group-hover:text-muted-foreground")} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              )
            })}
            
          </div>
        </aside>

        {/* Content - Flat Grid List */}
        <main>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <header className="mb-8">
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Profile</h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1 opacity-70 italic">Your info.</p>
                  </header>

                  <div className="space-y-12">
                    <div className="flex items-center gap-6 pb-6 border-b border-border">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <UserCircle className="w-8 h-8 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground italic uppercase tracking-tight">{profile?.full_name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mt-0.5">{membership?.role}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-bold tracking-tight">{user?.email}</p>
                      </div>
                    </div>

                    <form action={profileAction} className="space-y-8">
                        <div className="space-y-3 px-1">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Name</Label>
                          <Input
                            name="fullName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                            placeholder="Your Name"
                          />
                        </div>

                      {profileState?.success && (
                        <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Saved</p>
                      )}
                      
                      <Button type="submit" disabled={profilePending} className="h-10 px-8 bg-violet-600 hover:bg-violet-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all">
                        {profilePending ? 'Working...' : 'Save'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-10">
                  <header>
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Security</h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1 opacity-70 italic">Secure your account.</p>
                  </header>

                  <div className="space-y-12">
                     <form action={passwordAction} className="space-y-8">
                        <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3 px-1">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">New Pass</Label>
                          <Input
                            name="newPassword"
                            type="password"
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                          />
                        </div>
                        <div className="space-y-3 px-1">
                          <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Confirm</Label>
                          <Input
                            name="confirmPassword"
                            type="password"
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm placeholder:text-muted-foreground/20"
                          />
                        </div>
                        </div>

                        {passwordState?.success && (
                          <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Password Updated</p>
                        )}
                        {passwordState?.error && (
                          <p className="text-xs text-rose-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><AlertTriangle className="w-3.5 h-3.5" /> {passwordState.error}</p>
                        )}

                        <Button type="submit" disabled={passwordPending} className="h-10 px-8 bg-violet-600 hover:bg-violet-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl shadow-violet-500/10 active:scale-95 transition-all">
                          {passwordPending ? 'Working...' : 'Update'}
                        </Button>
                     </form>
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-10">
                  <header>
                    <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Business</h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1 opacity-70 italic">Business info.</p>
                  </header>

                  <div className="space-y-12">
                    <form action={businessAction} className="space-y-10">
                      <input type="hidden" name="restaurantId" value={membership?.restaurant_id || ''} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-3 col-span-full px-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Store className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Business Name</Label>
                          </div>
                          <Input
                            name="name"
                            defaultValue={membership?.restaurants?.name}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-3 px-1">
                           <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Email</Label>
                          </div>
                          <Input
                            name="contactEmail"
                            defaultValue={membership?.restaurants?.contact_email}
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
                            defaultValue={membership?.restaurants?.contact_phone}
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
                            defaultValue={membership?.restaurants?.address}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>

                        <div className="space-y-3 col-span-full px-1">
                           <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Logo URL</Label>
                          </div>
                          <Input
                            name="logoUrl"
                            defaultValue={membership?.restaurants?.logo_url}
                            className="h-14 bg-background border-border rounded-2xl text-lg font-bold text-foreground px-5 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      {businessState?.success && (
                        <p className="text-xs text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-left-2"><Check className="w-3.5 h-3.5" /> Profile Saved</p>
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
      <footer className="mt-24 pt-12 border-t border-border/50 flex flex-col items-center gap-2 opacity-30">
        <Globe className="w-4 h-4 text-muted-foreground/60" />
        <p className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-[0.4em]">TableBook OS · iPad Pro Edition</p>
      </footer>
    </div>
  )
}
