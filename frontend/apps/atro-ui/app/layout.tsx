import {
  PROJECT_DESCRIPTION,
  PROJECT_NAME,
  PROJECT_TITLE,
} from '@app/atro-ui/lib/constants/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './global.css';
import Providers from './providers';
import { Layout } from '../components/layout';
import { Geist } from "next/font/google";
import { cn } from "@app/atro-ui/lib/ui/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: PROJECT_TITLE,
    template: `%s | ${PROJECT_TITLE}`,
  },
  description: PROJECT_DESCRIPTION,
  keywords: [],
  authors: [{ name: '' }],
  creator: '',
  publisher: '',
  generator: 'next-feature',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: PROJECT_NAME,
    description: PROJECT_DESCRIPTION,
    siteName: PROJECT_NAME,
    images: [],
  },
  twitter: {},
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  )
}
