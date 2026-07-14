import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

async function AppLayout(props: Props) {
  return <>{props.children}</>;
}

export default AppLayout;
