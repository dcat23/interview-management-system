'use client';

import { useState } from 'react';
import moment from 'moment';
import { InfoIcon } from 'lucide-react';
import type { Question } from '@feature/base/server';
import { Badge } from '@app/atro-ui/components/ui/common/badge';
import { Button } from '@app/atro-ui/components/ui/common/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/atro-ui/components/ui/common/dialog';

interface Props {
  question: Question;
}

export function QuestionDetailDialog({ question }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
          <InfoIcon />
          View full question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{question.topic}</DialogTitle>
          <DialogDescription>{question.round}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{question.body}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={question.active ? 'default' : 'secondary'}>
              {question.active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {moment(question.updatedAt).format('MMM D, YYYY')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuestionDetailDialog;
