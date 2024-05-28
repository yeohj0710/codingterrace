import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/topbar";

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
        <TopBar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
