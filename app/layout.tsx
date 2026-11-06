import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "허위정보 대응 대학생 아이디어 공모전",
  description: "허위정보 대응 아이디어를 모집하는 대학생 공모전 접수 페이지",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
        <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-500">
          AI 검토 결과는 초안이며, 최종 심사는 담당자가 합니다.
        </footer>
      </body>
    </html>
  );
}
