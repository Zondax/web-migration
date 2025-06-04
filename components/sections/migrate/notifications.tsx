'use client'

import { observer } from '@legendapp/state/react'
import { notifications$ } from 'state/notifications'
import { uiState$ } from 'state/ui'

import { muifyHtml } from '@/lib/utils/html'

import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { useEffect } from 'react'
import { toast } from 'sonner'

// Custom toast notification component
const NotificationToast = ({
  title,
  description,
  time,
  appIcon,
}: { title: string; description: string; time: string; appIcon?: React.ReactNode }) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-white/20 shadow-lg rounded-md p-4 w-full">
      <div className="flex justify-between items-start">
        <div className="text-base font-semibold">{title}</div>
        {appIcon && <div className="ml-2 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8">{appIcon}</div>}
      </div>
      <div className="text-sm text-muted-foreground">{time}</div>
      <div className="border-t border-gray-300 my-2" />
      <div className="flex justify-between items-start">
        <div className="text-sm text-muted-foreground mb-2">{description}</div>
      </div>
      <div className="flex justify-end">
        <Button aria-haspopup="true" variant="outline" size="sm">
          Dismiss
        </Button>
      </div>
    </div>
  )
}

function Notifications() {
  const activeNotifications = notifications$.active?.get() ?? []

  // Get only the most recent notification
  const lastNotification = activeNotifications[activeNotifications.length - 1]

  // Effect to show toast when a new notification appears
  useEffect(() => {
    if (lastNotification) {
      const { title, description, appId } = lastNotification
      const appIcon = appId ? uiState$.icons.get()[appId] : null
      const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      toast(
        <NotificationToast title={title} description={description} time={currentTime} appIcon={appIcon ? muifyHtml(appIcon) : undefined} />,
        {
          duration: 5000,
          dismissible: true,
          style: {
            padding: '0',
          },
          classNames: {
            content: 'w-full',
          },
        }
      )
    }
  }, [lastNotification])

  return <Toaster position="bottom-right" theme="light" />
}

export default observer(Notifications)
