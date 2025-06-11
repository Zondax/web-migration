import { observer } from '@legendapp/state/react'
import { useMemo } from 'react'
import type { AddressBalance } from 'state/types/ledger'

import { ExplorerLink } from '@/components/ExplorerLink'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AppId } from '@/config/apps'
import { ExplorerItemType } from '@/config/explorers'
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

  return (
    <Select value={destinationAddress || ''} onValueChange={value => onDestinationChange(value, index)} disabled={isDisabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <ExplorerLink
            value={destinationAddress || ''}
            tooltipBody={destinationAddress || ''}
            className="break-all"
            hasCopyButton={false}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {polkadotAddresses?.map((polkadotAddress, addrIndex) => (
          <SelectItem key={polkadotAddress} value={polkadotAddress}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Polkadot {addrIndex + 1}:</span>
              <ExplorerLink
                value={polkadotAddress}
                appId={appId}
                explorerLinkType={ExplorerItemType.Address}
                disableTooltip
                className="break-all"
                hasCopyButton={false}
              />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default observer(DestinationAddressSelect)
