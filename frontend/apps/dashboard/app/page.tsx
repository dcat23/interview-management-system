import React from 'react';
import AppShellBlock from '../components/ui/app-shell-block';
import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Index(props: Props) {
  redirect('/dashboard');
  return <AppShellBlock />;
}
