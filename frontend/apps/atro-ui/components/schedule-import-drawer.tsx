'use client';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@app/atro-ui/components/ui/common/drawer';
import ScheduleImport from './schedule-import';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet housing the interview sheet (CSV) uploader — externally controlled so any
 * existing trigger (e.g. the command menu) can open it without needing to compose with
 * DrawerTrigger.
 */
export function ScheduleImportDrawer({ open, onOpenChange }: Props) {
  return (
    <Drawer direction="bottom" onOpenChange={onOpenChange} open={open}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Interview Sheet Upload</DrawerTitle>
          <DrawerDescription>Drop a CSV to import interview schedules.</DrawerDescription>
        </DrawerHeader>
        <div className="px-5 pb-5">
          <ScheduleImport />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ScheduleImportDrawer;
