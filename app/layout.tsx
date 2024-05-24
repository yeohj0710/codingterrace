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
  const topBarHeight = 12;
  return (
    <html lang="en">
      <body className={inter.className}>
        <header
          className={`flex items-center justify-center fixed top-0 w-full bg-red-100 z-50 h-${topBarHeight}`}
        >
          <div>
            <span>코딩테라스</span>
          </div>
        </header>
        <main className={`pt-${topBarHeight}`}>{children}</main>
      </body>
    </html>
  );
}
