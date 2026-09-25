'use client';

import { SessionsTable } from '@app/atro-ui/components/supporter/sessions-table';
import { SessionDetailDrawer } from './session-detail-drawer';

/**
 * The shared sessions table with marketer links, a Supporter column, and the
 * marketer drawer (status control, supporter reassignment). Client wrapper
 * because the page is a server component and can't pass the render prop.
 */
export function MarketerSessionsTable() {
  return (
    <SessionsTable
      basePath="/marketer"
      showSupporter
      renderSessionDrawer={({ session, onOpenChange, onSessionChanged }) => (
        <SessionDetailDrawer session={session} onOpenChange={onOpenChange} onSessionChanged={onSessionChanged} />
      )}
    />
  );
}

export default MarketerSessionsTable;
