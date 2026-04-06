import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Sidebar from "@/components/workspace/Sidebar";
import Header from "@/components/workspace/Header";
import SessionProvider from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "DocFlow AI - 올인원 워크스페이스",
  description: "말 한마디로 완성되는 문서, DocFlow AI 워크스페이스 1.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-[#f9f9f9]`}
      >
        <SessionProvider>
          <div className="flex min-h-screen bg-[#f9f9f9]">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-[240px] min-w-0">
              <Header />
              <main className="flex-1 w-full relative pb-16 md:pb-0">
                {children}
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
