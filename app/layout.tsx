import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalLoading from "@/components/global-loading";
import OfflineStatus from "@/components/offline-status";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dotar Sojat Computer",
    template: "%s | Dotar Sojat Computer",
  },
  description: "Dotar - Fix your laptop.",
  applicationName: "Dotar Sojat Computer",
  metadataBase: new URL("https://dotarsojatcomputer.in"),
  icons: {
    icon: [
      { url: "/dotar_logo.png", media: "(prefers-color-scheme: light)" },
      { url: "/dotar_logo.png", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: "/dotar_logo.png",
    apple: "/dotar_logo.png",
  },
  openGraph: {
    title: "Dotar Sojat Computer",
    description: "Laptop and computer repair services in Odisha.",
    url: "https://dotarsojatcomputer.in",
    siteName: "Dotar Sojat Computer",
    images: [
      {
        url: "/dotar_logo.png",
        width: 512,
        height: 512,
        alt: "Dotar Sojat Computer logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dotar Sojat Computer",
    description: "Laptop and computer repair services in Odisha.",
    images: ["/dotar_logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <GlobalLoading />
        <OfflineStatus />
        {children}
      </body>
    </html>
  );
}
