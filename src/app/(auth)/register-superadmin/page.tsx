'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { tempRegisterSuperadmin } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function RegisterSuperadminPage() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState(tempRegisterSuperadmin, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 rounded-[28px] overflow-hidden shadow-[0_0_40px_-5px_rgba(139,92,246,0.3)] border border-white/10 mb-5 animate-in fade-in zoom-in duration-700">
            <Image 
              src="/logo.png" 
              alt="TableBook Logo" 
              fill 
              priority
              sizes="80px"
              className="object-cover" 
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('auth.registerTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Manual Alert Replacement */}
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-red-400 text-sm leading-none mb-1">{t('auth.securityWarningTitle')}</h5>
            <p className="text-red-400/80 text-xs leading-relaxed">
              {t('auth.securityWarningBodyPrefix')} <strong>{t('auth.securityWarningBodyStrong')}</strong> {t('auth.securityWarningBodySuffix')}
            </p>
          </div>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {t('auth.createAccountSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground/70">{t('auth.fullName')}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder={t('auth.systemAdministrator')}
                  required
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground/70">{t('auth.username')}</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder={t('auth.superadminPlaceholder')}
                  required
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/70">{t('auth.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground/60 focus:border-violet-500 transition-colors h-11"
                />
              </div>

              {state?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                  {state.error}
                </div>
              )}

              {state?.success && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1">
                  {state.success}
                </div>
              )}

              <Button
                type="submit"
                disabled={pending}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-foreground font-semibold h-11 shadow-lg shadow-violet-500/20 border-0 transition-all active:scale-[0.98]"
              >
                {pending ? t('auth.initializing') : t('auth.createSuperadminAccount')}
              </Button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-violet-400 transition-colors">
                  {t('auth.alreadyHaveAccount')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground/60 text-[10px] mt-8 uppercase tracking-widest font-bold">
          &copy; 2026 TableBook Platform &bull; {t('auth.securityCritical')}
        </p>
      </div>
    </div>
  )
}
