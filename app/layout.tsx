import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadmeCheck Agent | Audit GitHub documentation",
  description:
    "Compare a public GitHub README with repository evidence and identify likely outdated sections.",
  applicationName: "ReadmeCheck Agent",
  keywords: ["GitHub", "README", "documentation audit", "AI Gateway"],
  openGraph: {
    title: "ReadmeCheck Agent",
    description:
      "Check README claims against manifests, changelogs, and repository paths.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
