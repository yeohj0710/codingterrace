import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/topbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "코딩테라스",
  description:
    "코딩테라스에서 NextJS를 이용해 구현한 다양한 기능들을 체험해 보세요!",
  metadataBase: new URL("https://codingterrace.com"),
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "코딩테라스",
    description: "코드로 구현된 기능들을 체험하세요!",
    url: "https://codingterrace.com/",
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "코딩테라스",
      },
    ],
    siteName: "코딩테라스",
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
        <TopBar />
        <main className="pt-14">{children}</main>
        <div className="text-7xl mt-10 mb-10 text-center">🍀</div>
      </body>
    </html>
  );
}
