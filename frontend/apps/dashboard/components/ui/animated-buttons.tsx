'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, X } from 'lucide-react';

import { Button } from '@feature/ui/components/ui/common/button';
import { cn } from '@app/dashboard/lib/ui/utils';

type AnimatedButtonStatus = 'idle' | 'loading' | 'success';

type AnimatedButtonProps = {
  label?: string;
  loadingLabel?: string;
  successLabel?: string;
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  iconOnlyOnHover?: boolean;
  successIcon?: React.ReactNode;
  tone?: 'default' | 'destructive';
  onAction?: () => void | Promise<void>;
  disabled?: boolean;
  resetDelay?: number;
  className?: string;
  variant?: 'default' | 'outline';
  minWidth?: string;
};

export function AnimatedButton({
  label = 'Confirm',
  loadingLabel = 'Working',
  successLabel = 'Done',
  icon,
  hoverIcon,
  iconOnlyOnHover = false,
  successIcon,
  tone = 'default',
  onAction,
  disabled = false,
  resetDelay = 1100,
  className,
  variant,
  minWidth = 'min-w-28',
}: AnimatedButtonProps) {
  const reduceMotion = useReducedMotion();
  const resetTimerRef = React.useRef<number | null>(null);
  const [status, setStatus] = React.useState<AnimatedButtonStatus>('idle');

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleClick() {
    if (disabled || status !== 'idle') return;

    setStatus('loading');

    if (onAction) {
      await onAction();
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, 850));
    }

    setStatus('success');
    resetTimerRef.current = window.setTimeout(
      () => {
        setStatus('idle');
      },
      reduceMotion ? 0 : resetDelay,
    );
  }

  const contentTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeOut' as const };
  const currentIcon =
    status === 'idle'
      ? icon
      : status === 'loading'
        ? 'loading'
        : (successIcon ?? <Check className="size-3.5" />);
  const showIconSlot = Boolean(currentIcon);
  const effectiveVariant =
    variant ?? (tone === 'destructive' ? 'destructive' : 'default');

  return (
    <Button
      type="button"
      variant={effectiveVariant}
      disabled={disabled || status !== 'idle'}
      onClick={handleClick}
      className={cn(
        'group/animated-button relative overflow-hidden transition-colors',
        minWidth,
        status === 'success' &&
          tone !== 'destructive' &&
          'bg-emerald-600 text-white hover:bg-emerald-600',
        className,
      )}
    >
      {status === 'idle' && hoverIcon && !icon ? (
        <>
          <span className="transition-all duration-150 group-hover/animated-button:translate-y-1 group-hover/animated-button:opacity-0 group-hover/animated-button:blur-xs">
            {label}
          </span>
          <span className="absolute inline-flex size-3.5 translate-y-2 items-center justify-center opacity-0 transition-all duration-150 group-hover/animated-button:translate-y-0 group-hover/animated-button:opacity-100">
            {hoverIcon}
          </span>
        </>
      ) : status === 'idle' && icon && iconOnlyOnHover ? (
        <>
          <span className="inline-flex items-center gap-1.5 transition-all duration-150 group-hover/animated-button:translate-y-1 group-hover/animated-button:opacity-0 group-hover/animated-button:blur-xs">
            <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
              {icon}
            </span>
            {label}
          </span>
          <span className="absolute inline-flex size-3.5 translate-y-2 items-center justify-center opacity-0 transition-all duration-150 group-hover/animated-button:translate-y-0 group-hover/animated-button:opacity-100">
            {icon}
          </span>
        </>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={contentTransition}
            className={cn(
              'inline-flex items-center',
              showIconSlot && 'gap-1.5',
            )}
          >
            {showIconSlot ? (
              <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
                {currentIcon === 'loading' ? (
                  <span
                    className={cn(
                      'inline-flex size-3.5 items-center justify-center rounded-full border-2 border-current border-r-transparent',
                      !reduceMotion && 'animate-spin',
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  currentIcon
                )}
              </span>
            ) : null}
            {status === 'idle'
              ? label
              : status === 'loading'
                ? loadingLabel
                : successLabel}
          </motion.span>
        </AnimatePresence>
      )}
    </Button>
  );
}

export function AnimatedButtons({
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loadingLabel = 'Working',
  successLabel = 'Done',
  confirmIcon,
  successIcon,
  tone = 'default',
  onAction,
  onCancel,
  disabled = false,
  resetDelay = 1100,
  className,
}: {
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  confirmIcon?: React.ReactNode;
  successIcon?: React.ReactNode;
  tone?: 'default' | 'destructive';
  onAction?: () => void | Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
  resetDelay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-md border bg-card p-1.5 shadow-sm',
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onCancel}
        className="group/cancel relative min-w-24 overflow-hidden"
      >
        <span className="transition-all duration-150 group-hover/cancel:translate-y-1 group-hover/cancel:opacity-0 group-hover/cancel:blur-xs">
          {cancelLabel}
        </span>
        <X className="absolute size-3.5 translate-y-2 opacity-0 transition-all duration-150 group-hover/cancel:translate-y-0 group-hover/cancel:opacity-100" />
      </Button>

      <AnimatedButton
        label={confirmLabel}
        loadingLabel={loadingLabel}
        successLabel={successLabel}
        icon={confirmIcon}
        hoverIcon={!confirmIcon ? <Check className="size-3.5" /> : undefined}
        successIcon={successIcon}
        tone={tone}
        onAction={onAction}
        disabled={disabled}
        resetDelay={resetDelay}
      />
    </div>
  );
}
