import { Badge } from '@feature/ui/components/badge';
import { cn } from '@feature/ui/lib/utils';
import { getBankQuestionClientName, type BankQuestion } from '@app/web/lib/data/questions';

interface Props {
  question: BankQuestion;
}

export function QuestionRow(props: Props) {
  const { question } = props;
  const clientName = getBankQuestionClientName(question);

  return (
    <li
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors',
        !question.active && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] uppercase font-mono">
          {question.topic}
        </Badge>
        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
          {question.round}
        </Badge>
        {clientName && <span className="text-xs text-muted-foreground">{clientName}</span>}
        {!question.active && (
          <Badge variant="outline" className="ml-auto text-muted-foreground">
            Inactive
          </Badge>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed">{question.text}</p>
    </li>
  );
}
