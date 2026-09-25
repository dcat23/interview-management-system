'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from 'lucide-react';
import { Button } from '@app/atro-ui/components/ui/common/button';
import { NewProcessDrawer } from './new-process-drawer';

interface Props {
  marketerId: string;
}

/** "New process" button for list pages — opens the drawer, then goes to the new process. */
export function NewProcessButton({ marketerId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        New process
      </Button>
      <NewProcessDrawer
        open={open}
        onOpenChange={setOpen}
        marketerId={marketerId}
        onCreated={(process) => router.push(`/marketer/processes/${process.id}`)}
      />
    </>
  );
}

export default NewProcessButton;
