'use client';

import { RiNotification3Line } from '@remixicon/react';
import { ReactNode } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/common/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/common/sheet';

interface Props {
  data?: unknown;
  children?: ReactNode;
}

export function NotificationSheet(props: Props) {
  const unreadCount = notes.filter((n) => n.unread).length;
  const markAllRead = () =>
    setNotes((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            <RiNotification3Line className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center bg-primary text-[9px] leading-none font-bold text-primary-foreground ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader className="gap-0.5 border-b border-border">
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `${unreadCount} unread updates`
              : "You're all caught up"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col overflow-y-auto">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() =>
                setNotes((prev) =>
                  prev.map((n) =>
                    n.id === note.id ? { ...n, unread: false } : n,
                  ),
                )
              }
              className={[
                'flex items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                note.unread ? 'bg-muted/30' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={[
                  'mt-0.5 flex size-8 shrink-0 items-center justify-center',
                  note.tone === 'destructive'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/10 text-primary',
                ].join(' ')}
              >
                <note.icon className="size-4" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {note.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                    {note.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{note.detail}</p>
              </div>
              {note.unread && (
                <span
                  className="mt-1.5 size-2 shrink-0 bg-primary"
                  aria-label="Unread"
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() =>
              toast('Notifications', {
                description: 'Opening all notifications.',
              })
            }
          >
            View all
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationSheet;
