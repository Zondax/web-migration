'use client'

import { observer } from '@legendapp/state/react'
import { notifications$ } from 'state/notifications'
import { uiState$ } from 'state/ui'

import { muifyHtml } from '@/lib/utils/html'

import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'
import { toast } from 'sonner'

function Notifications() {
  const activeNotifications = notifications$.active?.get() ?? []

  // Get only the most recent notification
  const lastNotification = activeNotifications[activeNotifications.length - 1]

  // Effect to show toast when a new notification appears
  useEffect(() => {
    if (lastNotification) {
      const { title, description, appId } = lastNotification
      const appIcon = appId ? uiState$.icons.get()[appId] : null

      toast(title, {
        description: description,
        duration: 5000,
        dismissible: true,
        icon: appIcon ? <div className="overflow-hidden [&_svg]:max-h-6 [&_svg]:w-6">{muifyHtml(appIcon)}</div> : undefined,
        classNames: {
          icon: 'w-6 h-6 max-w-6 max-h-6 min-w-6 min-h-6 shrink-0',
        },
      })
    }
  }, [lastNotification])

  return <Toaster position="bottom-right" theme="light" />
}

export default observer(Notifications)
