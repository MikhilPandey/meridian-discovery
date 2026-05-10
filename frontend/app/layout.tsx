import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meridian Discovery",
  description:
    "See how your body responds to food. Same meal. Different biology. Built on GluFormer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-meridian-cream-light text-meridian-body">
        <header className="border-b border-meridian-cream bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-meridian-gold" />
              <span className="font-semibold text-meridian-green tracking-tight group-hover:opacity-80">
                Meridian
              </span>
              <span className="text-meridian-muted text-sm">Discovery</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/discover" className="text-meridian-body hover:text-meridian-green">
                Discover
              </Link>
              <Link
                href="/profile/P001"
                className="text-meridian-body hover:text-meridian-green"
              >
                Profiles
              </Link>
              <Link
                href="/upload"
                className="px-3 py-1.5 rounded-full bg-meridian-green text-white hover:bg-meridian-green-soft text-xs"
              >
                Upload your data
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-meridian-cream mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8 text-xs text-meridian-muted leading-relaxed">
            Research demonstration. Not medical advice. Glucose responses are simulated based on
            published metabolic models and GWAS literature. Built on GluFormer architecture (Segal
            Lab, Weizmann Institute, Nature 2025).
          </div>
        </footer>
      </body>
    </html>
  );
}
