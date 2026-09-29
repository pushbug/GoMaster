import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'GoMaster — ก้าวสู่ 1 ดั้ง ด้วยพลัง KataGo + AI Sensei',
  description: 'เว็บแอปฝึกเล่นหมากล้อม (Go / Baduk) สำหรับพัฒนาฝีมือสู่ระดับ 1 ดั้ง พร้อมกระดานวิเคราะห์ KataGo และ AI โค้ช 9 ดั้งภาษาไทย',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`dark ${prompt.variable}`}>
      <body className={`${prompt.className} text-[14px] bg-zinc-950 text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950`}>
        {children}
      </body>
    </html>
  );
}
