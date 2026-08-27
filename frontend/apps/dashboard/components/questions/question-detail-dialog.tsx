'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Badge } from '@feature/ui/components/ui/common/badge';
import { Skeleton } from '@feature/ui/components/ui/common/skeleton';
import { Button as DialogButton } from '@feature/base-ui/components/ui/common/button';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@feature/base-ui/components/ui/common/dialog';
import { Info } from 'lucide-react';
import { getClientById } from '@feature/backend/server';
import type { Question } from '@feature/base/server';

interface Props {
  question: Question;
}

export function QuestionDetailDialog({ question }: Props) {
  const [open, setOpen] = useState(false);

  const { data: clientResponse, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', question.clientId],
    queryFn: () => getClientById(question.clientId),
    enabled: open,
  });

  const client = clientResponse?.success ? clientResponse.data : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <DialogButton
            aria-label="View question details"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
          />
        }
      >
        <Info className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{question.topic}</DialogTitle>
          <DialogDescription>{question.round}</DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-5">
          <section className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Question</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.body}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant={question.active ? 'default' : 'secondary'}>
                {question.active ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-muted-foreground">v{question.version}</span>
              <span className="text-xs text-muted-foreground">
                Updated {moment(question.updatedAt).format('MMM D, YYYY')}
              </span>
            </div>
          </section>

          <section className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Client</p>
            {!open ? null : isClientLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : client ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{client.name}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{client.industry ?? 'No industry set'}</span>
                  <span>·</span>
                  <Badge variant={client.active ? 'default' : 'secondary'} className="text-[10px]">
                    {client.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Client since {moment(client.createdAt).format('MMM D, YYYY')}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Client details unavailable.</p>
            )}
          </section>
        </DialogPanel>
        <DialogFooter variant="bare">
          <DialogClose render={<DialogButton variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

export default QuestionDetailDialog;
