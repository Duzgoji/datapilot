import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DataPilot",
    template: "%s | DataPilot",
  },
  description:
    "DataPilot is a multi-tenant lead collection and management platform for teams handling Meta, WhatsApp, and website-driven acquisition.",
  applicationName: "DataPilot",
  keywords: [
    "DataPilot",
    "lead management",
    "multi-tenant SaaS",
    "Meta Ads leads",
    "WhatsApp leads",
    "pipeline management",
    "Supabase",
    "Next.js",
  ],
  openGraph: {
    title: "DataPilot",
    description:
      "Multi-tenant lead collection, assignment, and pipeline management for sales teams.",
    siteName: "DataPilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataPilot",
    description:
      "Multi-tenant lead collection, assignment, and pipeline management for sales teams.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
