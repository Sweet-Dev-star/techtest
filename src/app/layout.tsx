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
  description: `${site.role} assessment: build a task manager, then solve three problems inside it — recurrence and hierarchy, offline editing and conflicts, shared access and permissions.`,
  openGraph: {
    title: "Task Manager Take-Home",
    description: `${site.role} assessment at ${site.company}. One project, three problems, ${site.effort}.`,
    type: "article",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edefea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1215" },
  ],
};

/** Applies a stored theme choice before first paint, so the toggle never flashes. */
const themeScript = `try{var t=localStorage.getItem("tm-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
