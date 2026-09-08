import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Task Manager Take-Home",
  description:
    "Take-home assessment: start from a working task-manager starter and solve three problems chosen for your role.",
  openGraph: {
    title: "Task Manager Take-Home",
    description: `Engineering take-home at ${site.company}. One starter, three problems for your role, ${site.effort}.`,
    type: "article",
  },
  robots: { index: false, follow: false },
};

/** The page is dark only, so the browser chrome matches unconditionally. */
export const viewport: Viewport = {
  themeColor: "#0e1215",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
