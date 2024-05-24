import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
        <header
          className={`flex items-center justify-center fixed top-0 w-full bg-gray-200 z-50 h-14 font-bold`}
        >
          <span className="text-lg font">코딩테라스</span>
        </header>
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
