'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createRestaurant } from '@/app/actions/restaurants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  AlertCircle, 
  ArrowLeft, 
  Store, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon,
  Plus,
  Link as LinkIcon
} from 'lucide-react'
import { RestaurantPreview } from '@/components/restaurant/restaurant-preview'
import { cn } from '@/lib/utils'

export default function NewRestaurantPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<{ error?: string; success?: string } | null>(null)
  
  // Real-time state for preview
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    isActive: true
  })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState(null)
    const form = new FormData(event.currentTarget)
    
    startTransition(async () => {
      const result = await createRestaurant(null, form)
      if (result?.error) {
        setState({ error: result.error })
      } else if (result?.success) {
        setState({ success: result.success })
        setTimeout(() => router.push('/superadmin/restaurants'), 2000)
      }
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Plus className="h-5 w-5 text-violet-400" />
            <h1 className="text-3xl font-black text-white tracking-tight underline decoration-violet-500/50 underline-offset-8 decoration-4">Setup Studio</h1>
          </div>
          <p className="text-slate-400 font-medium">Provision a new restaurant instance and admin credentials</p>
        </div>
        <Link 
          href="/superadmin/restaurants" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors group px-4 py-2 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-700/50"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Restaurants
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
        {/* Configurator Pane (Left) */}
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          
          {/* Identity & Branding */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg font-bold">Identity & Branding</CardTitle>
                  <CardDescription>Core details for the new tenant</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Restaurant Name *</Label>
                  <Input 
                    name="name" 
                    required 
                    onChange={handleInputChange}
                    placeholder="The Golden Fork" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subdomain / Slug *</Label>
                  <Input 
                    name="slug" 
                    required 
                    onChange={handleInputChange}
                    placeholder="the-golden-fork" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Contact Email</Label>
                  <Input 
                    name="contactEmail" 
                    type="email" 
                    onChange={handleInputChange}
                    placeholder="info@restaurant.com" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Contact Phone</Label>
                  <Input 
                    name="contactPhone" 
                    placeholder="+1 555 0100" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Physical Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    name="address" 
                    placeholder="123 Luxury Ave, Gastronomy City" 
                    className="h-14 pl-12 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subscription Expiry</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    name="subscriptionExpiresAt" 
                    type="datetime-local" 
                    className="h-14 pl-12 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl [color-scheme:dark]" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Account Security */}
          <Card className="bg-slate-900/40 backdrop-blur-md border-slate-800 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-800/50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg font-bold">Admin Security</CardTitle>
                  <CardDescription>Initial credentials for the restaurant owner</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Full Name *</Label>
                  <Input 
                    name="adminFullName" 
                    required 
                    placeholder="Owner Name" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Username / Email *</Label>
                  <Input 
                    name="adminUsername" 
                    required 
                    placeholder="admin_login" 
                    className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Initial Password *</Label>
                <Input 
                  name="adminPassword" 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="h-14 bg-slate-950/50 border-slate-800 text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all rounded-2xl" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Status Feedback */}
          {state?.error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in shake duration-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="font-bold">{state.error}</span>
            </div>
          )}
          {state?.success && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-in zoom-in-95 duration-500">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="font-bold">{state.success}</span>
            </div>
          )}

          {/* Submit Action */}
          <Button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest h-16 rounded-2xl border-0 shadow-2xl shadow-violet-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Launching Instance...
              </div>
            ) : (
              'Deploy Restaurant & Admin Account'
            )}
          </Button>
        </form>

        {/* Live Studio Pane (Right) */}
        <div className="hidden xl:block py-2 sticky top-12">
          <RestaurantPreview 
            name={formData.name} 
            slug={formData.slug} 
            email={formData.contactEmail} 
            isActive={formData.isActive}
          />
        </div>
      </div>
    </div>
  )
}
