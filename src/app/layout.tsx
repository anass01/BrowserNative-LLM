import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrivateChat — Local AI in Your Browser",
  description:
    "Chat with powerful AI models privately. Everything runs locally in your browser — no accounts, no tracking, no data collection.",
  keywords: ["local AI", "private chat", "WebLLM", "offline AI", "browser AI"],
  openGraph: {
    title: "PrivateChat — Local AI in Your Browser",
    description: "Chat with AI privately. No data leaves your device.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
