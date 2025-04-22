import { useMemo } from 'react'
import { Observable } from '@legendapp/state'
import { observer } from '@legendapp/state/react'
import { Address, AddressStatus } from 'state/types/ledger'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddressLink } from '@/components/AddressLink'

interface DestinationAddressSelectProps {
  account: Observable<Address>
  index: number
  polkadotAddresses: string[] | undefined
  onDestinationChange: (value: string, index: number) => void
}

function DestinationAddressSelect({ account, index, polkadotAddresses, onDestinationChange }: DestinationAddressSelectProps) {
  const isDisabled = useMemo(() => {
    return (
      (account.balance.native.get() === undefined &&
        (account.balance.nfts.get() === undefined || account.balance.nfts.get()?.length === 0) &&
        (account.balance.uniques.get() === undefined || account.balance.uniques.get()?.length === 0)) ||
      account.status.get() === AddressStatus.MIGRATED ||
      !polkadotAddresses ||
      polkadotAddresses.length === 0
    )
  }, [account, polkadotAddresses])

  return (
    <Select value={account.destinationAddress.get() || ''} onValueChange={value => onDestinationChange(value, index)} disabled={isDisabled}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <AddressLink
            value={account.destinationAddress.get() || ''}
            tooltipText={account.destinationAddress.get() || ''}
            className="break-all"
            hasCopyButton={false}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {polkadotAddresses?.map((polkadotAddress, addrIndex) => (
          <SelectItem key={addrIndex} value={polkadotAddress}>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Polkadot {addrIndex + 1}:</span>
              <AddressLink value={polkadotAddress} disableTooltip className="break-all" hasCopyButton={false} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default observer(DestinationAddressSelect)
