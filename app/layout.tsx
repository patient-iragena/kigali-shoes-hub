import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kigali Shoes Hub',
  description: 'Shop top quality footwear, sneakers, and formal shoes in Kigali with fast delivery across Rwanda.',
  openGraph: {
    title: 'Kigali Shoes Hub',
    description: 'Shop top quality footwear, sneakers, and formal shoes in Kigali with fast delivery across Rwanda.',
    url: 'https://www.kigalishoeshub.com',
    siteName: 'Kigali Shoes Hub',
    images: [
      {
        url: 'https://www.kigalishoeshub.com/logo.png', // Ensure logo.png exists in your /public folder
        width: 1200,
        height: 630,
        alt: 'Kigali Shoes Hub Logo',
      },
    ],
    type: 'website',
  },
}