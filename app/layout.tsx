import type { Metadata } from 'next';
import { assetUrl, siteUrl } from './site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'N-TacVLA · Yu Sun',
  description: 'N-TacVLA — G1 teleoperation with multi-view video, tactile and proximity sensing. Yu Sun; Daimon Robotics, Great Bay University, and Harbin Institute of Technology, Shenzhen.',
  icons: { icon: assetUrl('og.png') },
  alternates: { canonical: siteUrl },
  openGraph: { title: 'N-TacVLA · Yu Sun', description: 'Vision and touch in real interaction.', type: 'website', locale: 'en_US', url: siteUrl, images: [{url: new URL('og.png', siteUrl).href, width: 1730, height: 909, alt: 'N-TacVLA · Yu Sun · Vision, Touch, Interaction'}] },
  twitter: { card: 'summary_large_image', title: 'N-TacVLA · Yu Sun', description: 'G1 teleoperation and multimodal interaction recordings.', images: [new URL('og.png', siteUrl).href] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
