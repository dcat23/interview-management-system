
import React from 'react';

interface Props {
  params: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function Index(props: Props) {
  return (
    <main>HOME</main>
  );
}
