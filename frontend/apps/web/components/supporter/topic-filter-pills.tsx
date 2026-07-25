import { Button } from '@feature/ui/components/button';
import { bankTopics, type BankQuestionTopic } from '@app/web/lib/data/questions';

interface Props {
  active: BankQuestionTopic | 'All';
  onChange: (topic: BankQuestionTopic | 'All') => void;
}

export function TopicFilterPills(props: Props) {
  const { active, onChange } = props;
  const options: (BankQuestionTopic | 'All')[] = ['All', ...bankTopics];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
      {options.map((option) => (
        <Button
          key={option}
          variant={active === option ? 'default' : 'outline'}
          size="sm"
          className="rounded-full"
          onClick={() => onChange(option)}
          aria-pressed={active === option}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
