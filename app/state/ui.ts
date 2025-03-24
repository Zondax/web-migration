import { getAppLightIcon } from '@/lib/utils';
import { observable } from '@legendapp/state';
import { AppConfig, AppIds, appsConfigs } from 'app/config/apps';
import { AppIcons } from './ledger';
import { Step } from './types/ui';

interface UIState {
  icons: Partial<{ [key in AppIds]: any }>;
  steps: Step[];
}

const initialUIState: UIState = {
  icons: {},
  steps: [
    { value: 'connect-device', label: 'Connect Device', isComplete: false },
    {
      value: 'synchronize-accounts',
      label: 'Synchronize Accounts',
      isComplete: false
    },
    { value: 'migrate', label: 'Migrate', isComplete: false }
  ]
};

let iconsStatus: 'loading' | 'loaded' | 'unloaded' = 'unloaded';

export const uiState$ = observable({
  ...initialUIState,

  async loadInitialIcons() {
    if (iconsStatus !== 'unloaded') return;
    iconsStatus = 'loading';

    const appIcons: Partial<AppIcons> = {};

    const iconPromises = Array.from(appsConfigs.values())
      .filter((app) => app.rpcEndpoint)
      .map(async (app: AppConfig) => {
        const lightIconResponse = await getAppLightIcon(app.id);
        if (typeof lightIconResponse?.error === 'undefined') {
          appIcons[app.id] = lightIconResponse?.data;
        }
      });

    await Promise.all(iconPromises);
    uiState$.icons.set(appIcons);
    iconsStatus = 'loaded';
  }
});
