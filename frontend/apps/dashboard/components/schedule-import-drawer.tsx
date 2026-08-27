'use client';

import {
  Drawer,
  DrawerDescription,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from '@feature/base-ui/components/ui/common/drawer';
import ScheduleImport from './schedule-import';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet housing the interview sheet (CSV) uploader — externally controlled so any
 * existing trigger (e.g. the sidebar's upload button) can open it without needing to compose
 * with DrawerTrigger.
 */
export function ScheduleImportDrawer({ open, onOpenChange }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} position="bottom">
      <DrawerPopup showBar>
        <DrawerHeader>
          <DrawerTitle>Interview Sheet Upload</DrawerTitle>
          <DrawerDescription>Drop a CSV to import interview schedules.</DrawerDescription>
        </DrawerHeader>
        <DrawerPanel>
          <ScheduleImport />
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
}

export default ScheduleImportDrawer;
