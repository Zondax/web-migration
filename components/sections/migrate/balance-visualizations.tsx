'use client'

import type { Native, Staking } from '@/state/types/ledger'
import { LockClosedIcon } from '@radix-ui/react-icons'
import { ArrowRightLeftIcon, BarChartIcon, ClockIcon, LockOpenIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Token } from '@/config/apps'
import { formatBalance } from '@/lib/utils'

interface NativeBalanceVisualizationProps {
  data: Native
  token: Token
  types?: string[]
  hidePercentage?: boolean
}

interface BalanceCardProps {
  value: number
  total: number
  label: string
  icon: ReactNode
  colorScheme: {
    gradient: string
    border: string
    iconColor: string
    badgeBg: string
    badgeText: string
    badgeBorder: string
  }
  details?: ReactNode
  hidePercentage?: boolean
}

const BalanceCard = ({ value, total, label, icon, colorScheme, details, hidePercentage }: BalanceCardProps) => {
  const percentage = Number(((value / total) * 100).toFixed(2))

  return (
    <Card className={`p-4 bg-gradient-to-br ${colorScheme.gradient} ${colorScheme.border} transition-all duration-300 hover:shadow-md`}>
      <CardContent className="p-0 flex flex-col items-center justify-between h-full">
        <div className="flex flex-col items-center justify-center">
          <div className={`${colorScheme.iconColor} mb-2`}>{icon}</div>
          <div className="text-2xl font-mono text-center font-semibold mb-1">{value}</div>
          <div className="text-sm text-gray-600 mb-2">{label}</div>
        </div>
        {details && <div className="w-full mt-1">{details}</div>}
        {!hidePercentage && (
          <Badge
            variant="outline"
            className={`${colorScheme.badgeBg} ${colorScheme.badgeText} ${colorScheme.badgeBorder} text-xs font-medium px-3 py-0.5 rounded-full mt-2`}
          >
            {percentage}%
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

const StakingDetails = ({ stakingData, token }: { stakingData: Staking; token: Token }) => {
  const renderItem = (icon: ReactNode, label: string, value?: number) => (
    <div className="flex justify-between mb-1 gap-1.5">
      <span className="flex items-center gap-1.5">
        {icon} <div className="text-sm text-gray-600">{label}</div>
      </span>
      <span className="font-mono font-medium">{formatBalance(value || 0, token, undefined, true)}</span>
    </div>
  )

  return (
    <div className="w-full text-sm border-t border-gray-100 pt-2 mb-2">
      {renderItem(<BarChartIcon className="w-4 h-4 text-polkadot-cyan" />, 'Active', stakingData.active)}

      {stakingData.unlocking && stakingData.unlocking.length > 0 && (
        <div className="space-y-3 mt-3">
          {renderItem(
            <LockOpenIcon className="w-4 h-4 text-polkadot-cyan" />,
            'Unlocking',
            (stakingData.total ?? 0) - (stakingData.active ?? 0)
          )}

          <div className="space-y-3 px-1">
            {stakingData.unlocking.map(unlock => (
              <div
                key={`${unlock.era}-${unlock.value}`}
                className="bg-polkadot-cyan/20 flex justify-between text-xxs gap-1.5 px-1 rounded-xl"
              >
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-gray-600" /> {unlock.timeRemaining}
                </span>
                <span className="font-mono font-medium">{formatBalance(unlock.value, token, undefined, true)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const NativeBalanceVisualization = ({
  data,
  token,
  types = ['transferable', 'staking', 'reserved'],
  hidePercentage = false,
}: NativeBalanceVisualizationProps) => {
  const balanceTypes = [
    {
      id: 'transferable',
      value: data.transferable,
      label: 'Transferable',
      icon: <ArrowRightLeftIcon className="w-6 h-6" />,
      colorScheme: {
        gradient: 'from-polkadot-green/5 to-polkadot-green/15',
        border: 'border border-polkadot-green/20 hover:border-polkadot-green/40',
        iconColor: 'text-polkadot-green',
        badgeBg: 'bg-polkadot-green/70',
        badgeText: 'text-black font-semibold',
        badgeBorder: 'border-polkadot-green/30',
      },
    },
    {
      id: 'staking',
      value: data.staking?.total || 0,
      label: 'Staked',
      icon: <BarChartIcon className="w-6 h-6" />,
      colorScheme: {
        gradient: 'from-polkadot-cyan/5 to-polkadot-cyan/15',
        border: 'border border-polkadot-cyan/20 hover:border-polkadot-cyan/40',
        iconColor: 'text-polkadot-cyan',
        badgeBg: 'bg-polkadot-cyan/70',
        badgeText: 'text-black font-semibold',
        badgeBorder: 'border-polkadot-cyan/30',
      },
      details: data.staking && <StakingDetails stakingData={data.staking} token={token} />,
    },
    {
      id: 'reserved',
      value: data.reserved,
      label: 'Reserved',
      icon: <LockClosedIcon className="w-6 h-6" />,
      colorScheme: {
        gradient: 'from-polkadot-lime/5 to-polkadot-lime/15',
        border: 'border border-polkadot-lime/20 hover:border-polkadot-lime/40',
        iconColor: 'text-polkadot-lime',
        badgeBg: 'bg-polkadot-lime/70',
        badgeText: 'text-black font-semibold',
        badgeBorder: 'border-polkadot-lime/30',
      },
    },
  ]

  const filteredBalanceTypes = balanceTypes.filter(type => types.includes(type.id))
  const columns = `sm:grid-cols-${filteredBalanceTypes.length}`

  return (
    <div className={`grid grid-cols-1 gap-3 p-2 ${columns}`}>
      {filteredBalanceTypes.map(type => (
        <BalanceCard
          key={type.label}
          value={Number(formatBalance(type.value || 0, token, undefined, true))}
          total={Number(formatBalance(data.total ?? 0, token, undefined, true))}
          label={type.label}
          icon={type.icon}
          colorScheme={type.colorScheme}
          details={type.details}
          hidePercentage={hidePercentage}
        />
      ))}
    </div>
  )
}
