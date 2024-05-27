import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "코딩테라스",
  description: "코딩테라스",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="flex gap-[4%] items-center justify-start fixed top-0 w-full bg-white z-50 h-14 shadow-md pl-6">
          <Link href="/" className="text-lg font-bold">
            코딩테라스
          </Link>
          <Link href="" className="font-bold">
            게시판
          </Link>
          <Link href="" className="font-bold">
            실시간 채팅
          </Link>
        </header>
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
