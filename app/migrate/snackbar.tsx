'use client';

import { Button } from '@/components/ui/button';
import { muifyHtml } from '@/lib/muifyHtml';
import { observer } from '@legendapp/state/react';
import * as Toast from '@radix-ui/react-toast';
import { notifications$ } from 'state/notifications';
import { uiState$ } from 'state/ui';

function Snackbar() {
  const activeNotifications = notifications$.active?.get() ?? [];

  // Get only the most recent notification
  const lastNotification = activeNotifications[activeNotifications.length - 1];

  const onOpenChange = (open: boolean) => {
    if (!open) {
      notifications$.dismiss(lastNotification.id);
    }
  };

  // Get the icon if appId exists
  const appIcon = lastNotification?.appId
    ? uiState$.icons.get()[lastNotification.appId]
    : null;

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={Boolean(lastNotification)}
        onOpenChange={onOpenChange}
        className="bg-white rounded-md shadow-lg p-4 border border-gray-200"
      >
        <div className="flex justify-between items-start">
          <Toast.Title className="font-semibold">
            {lastNotification?.title}
          </Toast.Title>
          {appIcon && (
            <div className="ml-2 overflow-hidden [&_svg]:max-h-8 [&_svg]:w-8">
              {muifyHtml(appIcon)}
            </div>
          )}
        </div>
        <Toast.Description className="text-sm text-muted-foreground">
          {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Toast.Description>
        <div className="border-t border-gray-300 my-2"></div>
        <div className="flex justify-between items-start">
          <Toast.Description className="text-sm text-muted-foreground mb-2">
            {lastNotification?.description}
          </Toast.Description>
        </div>
        <Toast.Action asChild altText="Dismiss">
          <div className="flex justify-end">
            <Button aria-haspopup="true" variant="secondary" size="sm">
              Dismiss
            </Button>
          </div>
        </Toast.Action>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-6 gap-2 w-96 m-0 list-none z-50" />
    </Toast.Provider>
  );
}

export default observer(Snackbar);
