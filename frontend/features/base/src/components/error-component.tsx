import { toast } from 'sonner';
import type { ProblemDetail } from '@next-feature/client';

interface Props {
  error: ProblemDetail | undefined;
}

const DEFAULT_ERROR: ProblemDetail = {
  title: "Internal Server Error",
  type: '',
  status: 500,
  detail: ''
}

export function ErrorComponent({
  error = DEFAULT_ERROR
}: Props) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}
    >
      <h1>
        <strong>{error.title}</strong>
      </h1>
      <span>
        <strong>statusCode</strong>: {error.status}
      </span>
      <span>
        <strong>type</strong>: {error.type}
      </span>
      <span>
        <strong>message</strong>: {error.detail}
      </span>
    </div>
  );
}

export function withToast(error: ProblemDetail) {
  toast.error(<ErrorComponent error={error} />);
}
