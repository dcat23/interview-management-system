import { Button } from '@feature/ui/components/button';

interface Props {
  topics: string[];
  active: string | 'All';
  onChange: (topic: string | 'All') => void;
}

export function TopicFilterPills(props: Props) {
  const { topics, active, onChange } = props;
  const options: (string | 'All')[] = ['All', ...topics];

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
