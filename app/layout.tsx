import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthSessionProvider } from "@/components/session-provider";
import { ContactNoticeButton } from "@/components/contact-notice-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creative Content IP Protection & AI Monitoring | ErgoVeritas",
  description:
    "Protect creative content IP with creation proof, Common Crawl exposure monitoring, and evidence-ready reports for creators, teams, and counsel.",
  keywords: [
    "creative content IP protection",
    "AI training data exposure",
    "Common Crawl monitoring",
    "C4 derivative dataset monitoring",
    "transcript protection",
    "cryptographic timestamp for creators",
    "evidence-ready IP reports",
    "content rights monitoring",
    "URL exposure monitoring",
    "creator legal evidence pack"
  ],
  alternates: {
    canonical: "https://ergoveritas.com"
  },
  openGraph: {
    title: "Creative Content IP Protection & AI Monitoring | ErgoVeritas",
    description:
      "Protect creative content IP with proof of creation, Common Crawl pathway monitoring, and evidence-ready reporting.",
    url: "https://ergoveritas.com",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
            <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
              <Link
                href="/"
                className="flex items-center gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
              >
                <Image
                  src="/ergoveritas-logo-dark.svg"
                  alt="ErgoVeritas"
                  width={36}
                  height={36}
                  priority
                />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-slate-900">ErgoVeritas</div>
                  <div className="text-xs tracking-wide text-slate-500">
                    Content proof of existence
                  </div>
                </div>
              </Link>

              <div className="hidden items-center gap-8 md:flex">
                <Link
                  href="/#how"
                  className="text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  How It Works
                </Link>
                <Link
                  href="/#use-cases"
                  className="text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Use Cases
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <ContactNoticeButton />
                <button
                  type="button"
                  aria-label="Open menu"
                  className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 md:hidden"
                >
                  Menu
                </button>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
          <footer className="border-t border-slate-200/70">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6">
              <nav
                className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500"
                aria-label="Legal and footer links"
              >
                <Link
                  href="/terms"
                  className="no-underline transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="no-underline transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Privacy
                </Link>
                <Link
                  href="/legal"
                  className="no-underline transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2"
                >
                  Legal &amp; Transparency
                </Link>
              </nav>
            </div>
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 text-xs text-slate-400">
              <p>© 2026 Ergoveritas.com. All rights reserved.</p>
              <p>Creare humanum est</p>
            </div>
          </footer>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
