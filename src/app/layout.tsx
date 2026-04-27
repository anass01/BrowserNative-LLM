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
  metadataBase: new URL("https://chat.vynox.tech"),
  title: "Vynox AI — Complete Offline Private Local AI Chat",
  description:
    "Chat with the world's most powerful AI models completely offline. Vynox AI runs 100% locally in your browser. Zero tracking, zero data collection, maximum privacy.",
  keywords: [
    "local AI", 
    "Vynox AI",
    "private chat", 
    "WebLLM AI", 
    "offline LLM", 
    "uncensored local AI",
    "browser based AI"
  ],
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://chat.vynox.tech",
  },
  openGraph: {
    title: "Vynox AI — #1 Private Local AI Chat",
    description: "Run advanced AI completely locally in your browser. No data leaves your machine.",
    url: "https://chat.vynox.tech",
    siteName: "Vynox AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynox AI — Complete Offline Private Local AI Chat",
    description: "Run advanced AI completely locally in your browser. No data leaves your machine.",
    creator: "@vynox",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD Structured Data Schema for Google
const combinedSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vynox AI",
  url: "https://chat.vynox.tech",
  description: "A completely offline, privacy-first local AI chat application running in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  }
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
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
        />
      </head>
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
