import { X } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  onClear: () => void;
}

export function ActiveFilterChip(props: Props) {
  const { label, value, onClear } = props;

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 py-1 pl-3 pr-1 text-sm text-primary">
      <span>
        <span className="text-muted-foreground">{label}:</span> {value}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-primary/20"
        aria-label={`Clear ${label} filter`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
