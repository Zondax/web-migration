import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { copyContent, truncateMiddleOfString } from '@/lib/utils';
import { truncateMaxCharacters } from 'app/config/config';
import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

interface AddressLinkProps {
  value: string;
  tooltipText?: string;
  disableTooltip?: boolean;
  hasCopyButton?: boolean;
  url?: string;
  className?: string;
}

export function AddressLink({
  value,
  tooltipText,
  disableTooltip = false,
  hasCopyButton = true,
  url,
  className
}: AddressLinkProps) {
  const [copied, setCopied] = useState(false);
  const shortAddress = truncateMiddleOfString(value, truncateMaxCharacters);

  const handleCopy = useCallback(() => {
    copyContent(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  const renderContent = () => {
    if (url) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
          {shortAddress}
        </a>
      );
    }
    return <span className={className}>{shortAddress}</span>;
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild disabled={disableTooltip}>
            {renderContent()}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText || value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {hasCopyButton && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
