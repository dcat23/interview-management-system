import React from 'react';

interface Props {
  children: React.ReactNode;
}

export function Layout(props: Props): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col">{props.children}</div>
  );
}

export default Layout;
