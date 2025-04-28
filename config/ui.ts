import { ConnectTabContent } from '@/components/sections/migrate/connect-tab-content'
import { MigrateTabContent } from '@/components/sections/migrate/migrate-tab-content'
import { SynchronizeTabContent } from '@/components/sections/migrate/synchronize-tab-content'
import { TabItem } from '@/components/Tabs'

export type MigrationTabValue = 'connect-device' | 'synchronize-accounts' | 'migrate'

export type MigrationTab = TabItem<MigrationTabValue>

export const migrationTabs: MigrationTab[] = [
  {
    value: 'connect-device',
    label: 'Connect Device',
    component: ConnectTabContent,
  },
  {
    value: 'synchronize-accounts',
    label: 'Synchronize Accounts',
    component: SynchronizeTabContent,
  },
  { value: 'migrate', label: 'Migrate', component: MigrateTabContent },
]
