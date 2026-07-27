'use client';

import { ReactNode } from 'react';
import { Button } from './ui/common/button';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine } from '@remixicon/react';

interface Props {
  data?: unknown;
  children?: ReactNode;
}

export function BackButton(props: Props) {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      className="w-full sm:w-auto"
      onClick={() => router.back()}
    >
      <RiArrowLeftLine data-icon="inline-start" aria-hidden="true" />
      Go Back
    </Button>
  );
}

export default BackButton;
