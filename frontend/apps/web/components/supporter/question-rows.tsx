import { Badge } from '@feature/ui/components/badge';
import { Button } from '@feature/ui/components/button';
import { HelpCircle, Plus, X } from 'lucide-react';
import type { Question } from '@app/web/lib/data/sessions';

export function LinkedQuestionRow({
  question,
  order,
  onUnlink,
}: {
  question: Question;
  order: number;
  onUnlink: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs text-muted-foreground">
        {order}
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Badge variant="outline" className="text-[10px]">
          {question.topic}
        </Badge>
        <p className="line-clamp-2 text-sm leading-relaxed">{question.text}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onUnlink(question.id)}
        aria-label="Unlink question"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function QuestionSearchResultRow({
  question,
  linked,
  onLink,
}: {
  question: Question;
  linked: boolean;
  onLink: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <HelpCircle className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Badge variant="outline" className="text-[10px]">
          {question.topic}
        </Badge>
        <p className="line-clamp-2 text-sm leading-relaxed">{question.text}</p>
      </div>
      <Button
        variant={linked ? 'secondary' : 'outline'}
        size="sm"
        className="shrink-0"
        disabled={linked}
        onClick={() => onLink(question.id)}
      >
        {linked ? (
          'Linked'
        ) : (
          <>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Link
          </>
        )}
      </Button>
    </div>
  );
}
