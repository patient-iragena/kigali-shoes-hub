import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kigalishoeshub.com'),
  title: 'Kigali Shoes Hub',
  description: 'Shop top quality footwear, sneakers, and formal shoes in Kigali with fast delivery across Rwanda.',
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Kigali Shoes Hub',
    description: 'Shop top quality footwear, sneakers, and formal shoes in Kigali with fast delivery across Rwanda.',
    url: 'https://www.kigalishoeshub.com',
    siteName: 'Kigali Shoes Hub',
    images: [
      {
        url: '/icon.png',
        width: 1200,
        height: 630,
        alt: 'Kigali Shoes Hub Logo',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'Kigali Shoes Hub',
    url: 'https://www.kigalishoeshub.com',
    logo: 'https://www.kigalishoeshub.com/icon.png',
    image: 'https://www.kigalishoeshub.com/icon.png',
    description: 'Shop top quality footwear, sneakers, and formal shoes in Kigali with fast delivery across Rwanda.',
    telephone: '+250781827386',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kigali',
      addressCountry: 'RW',
    },
    sameAs: [
      'https://www.instagram.com/kigalishoeshub', // Replace with your exact Instagram URL if different
    ],
  }

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}