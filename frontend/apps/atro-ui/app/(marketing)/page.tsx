import React from 'react';
import { Hero } from '@app/atro-ui/components/blocks/hero';

interface Props {
  params: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Index(props: Props) {
  return (
    <Hero />
  );
}
