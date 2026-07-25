import { Search } from 'lucide-react';
import { Input } from '@feature/ui/components/input';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ClientSearchInput(props: Props) {
  const { value, onChange, placeholder = 'Search clients by name' } = props;

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}
