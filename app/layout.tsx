import type { Metadata } from 'next';
import { assetUrl, siteUrl } from './site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'N-TacVLA · Yu Sun',
  description: 'N-TacVLA — G1 遥操作、多视角视频、触觉与接近觉数据展示。Yu Sun；戴盟机器人公司、大湾区大学、哈尔滨工业大学深圳。',
  icons: { icon: assetUrl('og.png') },
  alternates: { canonical: siteUrl },
  openGraph: { title: 'N-TacVLA · Yu Sun', description: '视觉与触觉，在真实交互中相遇。', type: 'website', locale: 'zh_CN', url: siteUrl, images: [{url: new URL('og.png', siteUrl).href, width: 1730, height: 909, alt: 'N-TacVLA · Yu Sun · Vision, Touch, Interaction'}] },
  twitter: { card: 'summary_large_image', title: 'N-TacVLA · Yu Sun', description: 'G1 遥操作与多模态交互记录。', images: [new URL('og.png', siteUrl).href] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
