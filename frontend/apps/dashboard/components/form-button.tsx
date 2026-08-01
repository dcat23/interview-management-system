'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

import { Button } from '@feature/ui/components/ui/common/button';
import { cn } from '@app/dashboard/lib/ui/utils';

type FormButtonStatus = 'idle' | 'loading' | 'success';

type FormButtonProps = React.ComponentProps<'button'> & {
  label?: string;
  loadingLabel?: string;
  successLabel?: string;
  successIcon?: React.ReactNode;
  success?: boolean;
  disabled?: boolean;
  resetDelay?: number;
  className?: string;
  minWidth?: string;
};

export function FormButton({
  label = 'Submit',
  loadingLabel = 'Submitting..',
  successLabel = 'Submitted',
  successIcon = <Check className="size-3.5" />,
  success = false,
  disabled = false,
  resetDelay = 1100,
  className,
  minWidth = 'min-w-28',
  ...props
}: FormButtonProps) {
  const { pending } = useFormStatus();
  const reduceMotion = useReducedMotion();
  const resetTimerRef = React.useRef<number | null>(null);
  const wasPendingRef = React.useRef(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    const justSettled = wasPendingRef.current && !pending;
    wasPendingRef.current = pending;

    if (justSettled && success) {
      setShowSuccess(true);
      resetTimerRef.current = window.setTimeout(
        () => {
          setShowSuccess(false);
        },
        reduceMotion ? 0 : resetDelay,
      );
    }
  }, [pending, success, reduceMotion, resetDelay]);

  const status: FormButtonStatus = pending
    ? 'loading'
    : showSuccess
      ? 'success'
      : 'idle';

  const contentTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: 'easeOut' as const };
  const currentIcon = status === 'loading' ? 'loading' : successIcon;
  const showIconSlot = status !== 'idle';

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        'group/login-button relative overflow-hidden transition-colors',
        minWidth,
        status === 'success' &&
          'bg-emerald-600 text-white hover:bg-emerald-600',
        className,
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={contentTransition}
          className={cn('inline-flex items-center', showIconSlot && 'gap-1.5')}
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
    </Button>
  );
}
