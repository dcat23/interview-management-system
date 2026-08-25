import { NEXT_PUBLIC_ROOT_DOMAIN } from '@app/dashboard/lib/config/env';
import {
  PROJECT_DESCRIPTION,
  PROJECT_NAME,
} from '@app/dashboard/lib/constants/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import './global.css';
import Providers from './providers';
import { Layout } from '../components/layout';
import { Geist, JetBrains_Mono, Oxanium } from 'next/font/google';
import { cn } from '@feature/ui/lib/ui/utils';

const oxaniumHeading = Oxanium({subsets:['latin'],variable:'--font-heading'});

const oxanium = Oxanium({ subsets: ['latin'], variable: '--font-sans' });

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

export const metadata: Metadata = {
  metadataBase: new URL(NEXT_PUBLIC_ROOT_DOMAIN),
  title: {
    default: PROJECT_NAME,
    template: `%s | ${PROJECT_NAME}`,
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
              'font-sans',
              oxanium.variable,
              "font-mono", jetbrainsMono.variable, oxaniumHeading.variable)}
    >
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
