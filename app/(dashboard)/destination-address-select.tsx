import { AddressLink } from '@/components/AddressLink';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { Address } from 'app/state/types/ledger';

interface DestinationAddressSelectProps {
  account: Observable<Address>;
  index: number;
  polkadotAddresses: string[] | undefined;
  onDestinationChange: (value: string, index: number) => void;
}

function DestinationAddressSelect({
  account,
  index,
  polkadotAddresses,
  onDestinationChange
}: DestinationAddressSelectProps) {
  return (
    <Select
      value={account.destinationAddress.get() || ''}
      onValueChange={(value) => onDestinationChange(value, index)}
      disabled={
        account.balance.get() === undefined ||
        account.status.get() === 'migrated' ||
        !polkadotAddresses ||
        polkadotAddresses.length === 0
      }
    >
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
              <span>Polkadot {addrIndex + 1}:</span>
              <AddressLink
                value={polkadotAddress}
                disableTooltip
                className="break-all"
                hasCopyButton={false}
              />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default observer(DestinationAddressSelect);
