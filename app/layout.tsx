import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ErgoVeritas",
  description: "Privacy-first proof-of-existence hash registry"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm">
            <Link href="/">ErgoVeritas</Link>
            <Link href="/register">Register</Link>
            <Link href="/verify">Verify</Link>
            <Link href="/about">About</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
