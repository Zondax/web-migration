import { observer } from '@legendapp/state/react'
import { useMemo } from 'react'
import type { AddressBalance } from 'state/types/ledger'

import { ExplorerLink } from '@/components/ExplorerLink'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AppId } from '@/config/apps'
import { ExplorerItemType } from '@/config/explorers'
import { SelectWithCustom } from '@/components/SelectWithCustom'
import { hasBalance } from '@/lib/utils'

interface DestinationAddressSelectProps {
  appId: AppId
  balance: AddressBalance
  index: number
  polkadotAddresses: string[] | undefined
  onDestinationChange: (value: string, index: number) => void
}

function DestinationAddressSelect({ appId, balance, index, polkadotAddresses, onDestinationChange }: DestinationAddressSelectProps) {
  const destinationAddress = balance.transaction?.destinationAddress
  const isDisabled = useMemo(() => {
    return !hasBalance([balance]) || !polkadotAddresses || polkadotAddresses.length === 0
  }, [balance, polkadotAddresses])

  const renderOption = (option: { value: string; label: string }, index: number) => {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold">Polkadot {index + 1}:</span>
        <AddressLink value={option.value} disableTooltip className="break-all" hasCopyButton={false} />
      </div>
    )
  }

  return (
    <SelectWithCustom
      options={
        polkadotAddresses?.map(address => ({
          value: address,
          label: address,
        })) ?? []
      }
      placeholder="Select a Polkadot address..."
      customPlaceholder="Enter custom Polkadot address"
      onValueChange={value => onDestinationChange(value, index)}
      renderOption={renderOption}
      selectedValue={destinationAddress}
      disabled={isDisabled}
    />
  )
}

export default observer(DestinationAddressSelect)
