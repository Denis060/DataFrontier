import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Sans, Playfair_Display } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import { SubscribePrompt } from "@/components/subscribe-prompt";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://datafrontier.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Data Frontier — AI, ML & Agentic Intelligence",
    template: "%s — The Data Frontier",
  },
  description:
    "Agentic AI, Data Science, and the future of intelligent systems — written by practitioners.",
  openGraph: {
    type: "website",
    siteName: "The Data Frontier",
    url: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#080a0e" },
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The theme script mutates <html> before React hydrates.
      suppressHydrationWarning
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SubscribePrompt />
      </body>
    </html>
  );
}
