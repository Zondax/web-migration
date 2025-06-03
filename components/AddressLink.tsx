import { truncateMaxCharacters } from 'config/config'

import { CustomTooltip } from '@/components/CustomTooltip'
import { truncateMiddleOfString } from '@/lib/utils'
import { CopyButton } from './CopyButton'

interface AddressLinkProps {
  value: string
  tooltipBody?: string
  disableTooltip?: boolean
  hasCopyButton?: boolean
  url?: string
  className?: string
  truncate?: boolean
}

export function AddressLink({
  value,
  tooltipBody,
  disableTooltip = false,
  hasCopyButton = true,
  url,
  className,
  truncate = true,
}: AddressLinkProps) {
  const shortAddress = truncate ? truncateMiddleOfString(value, truncateMaxCharacters) : value

  const renderContent = () => {
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
          {shortAddress}
        </a>
      )
    }
    return <span className={className}>{shortAddress}</span>
  }

  return (
    <div className="flex items-center gap-2">
      {disableTooltip ? renderContent() : <CustomTooltip tooltipBody={tooltipBody || value}>{renderContent()}</CustomTooltip>}

      {hasCopyButton && <CopyButton value={value} />}
    </div>
  )
}
