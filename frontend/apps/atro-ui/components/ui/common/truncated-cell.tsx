'use client';

import { cn } from '@app/atro-ui/lib/ui/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@app/atro-ui/components/ui/common/tooltip';

interface Props {
  text: string | null | undefined;
  className?: string;
}

/**
 * Single-line text that truncates in its table cell and expands to the full
 * value in a tooltip. Needs a TooltipProvider ancestor (ActionTable has one).
 */
export function TruncatedCell({ text, className }: Props) {
  if (!text) return <span className="text-muted-foreground">—</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('block max-w-[300px] cursor-help truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-md whitespace-pre-wrap">{text}</TooltipContent>
    </Tooltip>
  );
}

export default TruncatedCell;
