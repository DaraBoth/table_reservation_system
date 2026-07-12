'use client'

import { useActionState } from 'react'
import { resetUserPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

export function AdminPasswordResetCard({ userId, name }: { userId: string; name: string }) {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState(resetUserPassword, null)

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="border-border text-foreground/70 hover:text-foreground hover:bg-muted text-xs">
            {t('superadmin.resetPasswordAction', { defaultValue: 'Reset Password' })}
          </Button>
        }
      />
      <DialogContent className="bg-card border-border text-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('superadmin.resetPasswordForName', { defaultValue: 'Reset Password for {{name}}', name })}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4 mt-2">
          <input type="hidden" name="userId" value={userId} />
          <Input
            name="newPassword"
            type="password"
            placeholder={t('superadmin.newPasswordPlaceholder', { defaultValue: 'New password (min 6 chars)' })}
            required
            className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-violet-500"
          />
          {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
          {state?.success && <p className="text-emerald-400 text-sm">{state.success}</p>}
          <Button type="submit" disabled={pending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 border-0">
            {pending ? t('superadmin.resetting', { defaultValue: 'Resetting...' }) : t('superadmin.setNewPassword', { defaultValue: 'Set New Password' })}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
