'use client'

import { observer } from '@legendapp/state/react'
import * as Toast from '@radix-ui/react-toast'
import { motion } from 'framer-motion'
import { notifications$ } from 'state/notifications'
import { uiState$ } from 'state/ui'

import { muifyHtml } from '@/lib/utils/html'
import { Button } from '@/components/ui/button'

function Snackbar() {
  const activeNotifications = notifications$.active?.get() ?? []

  // Get only the most recent notification
  const lastNotification = activeNotifications[activeNotifications.length - 1]

  const onOpenChange = (open: boolean) => {
    if (!open) {
      notifications$.dismiss(lastNotification.id)
    }
  }

  // Get the icon if appId exists
  const appIcon = lastNotification?.appId ? uiState$.icons.get()[lastNotification.appId] : null

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={Boolean(lastNotification)}
        onOpenChange={onOpenChange}
        className="bg-white/90 backdrop-blur-md border border-white/20 shadow-lg rounded-md p-4"
        asChild
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between items-start">
            <Toast.Title className="font-semibold">{lastNotification?.title}</Toast.Title>
            {appIcon && <div className="ml-2 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8">{muifyHtml(appIcon)}</div>}
          </div>
          <Toast.Description className="text-sm text-muted-foreground">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Toast.Description>
          <div className="border-t border-gray-300 my-2"></div>
          <div className="flex justify-between items-start">
            <Toast.Description className="text-sm text-muted-foreground mb-2">{lastNotification?.description}</Toast.Description>
          </div>
          <Toast.Action asChild altText="Dismiss">
            <div className="flex justify-end">
              <Button aria-haspopup="true" variant="outline" size="sm">
                Dismiss
              </Button>
            </div>
          </Toast.Action>
        </motion.div>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col p-6 gap-2 w-96 m-0 list-none z-50" />
    </Toast.Provider>
  )
}

export default observer(Snackbar)
