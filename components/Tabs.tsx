'use client'

export interface TabItem<T = string> {
  label: string
  value: T
  component: React.ComponentType<any>
  disabled?: boolean
  icon?: React.ReactNode
}

interface TabsProps<T = string> {
  activeTab: number
  tabs: TabItem<T>[]
  onTabChange: (tab: TabItem<T>) => void
}

export function Tabs<T = string>({ activeTab, tabs, onTabChange }: TabsProps<T>) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab, index) => {
        const isActive = activeTab === index
        const isDisabled = tab.disabled

        return (
          <button
            key={index}
            onClick={() => !isDisabled && onTabChange(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              isActive ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={isDisabled}
          >
            {tab.icon && <span className="text-gray-500">{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
