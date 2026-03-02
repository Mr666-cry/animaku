import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AnimeStream - Watch Your Favorite Anime",
  description: "Stream your favorite anime in HD quality. Browse popular, trending, and seasonal anime with a modern streaming experience.",
  keywords: ["anime", "streaming", "watch anime", "anime online", "free anime"],
  authors: [{ name: "AnimeStream Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AnimeStream - Watch Your Favorite Anime",
    description: "Stream your favorite anime in HD quality",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-white`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
