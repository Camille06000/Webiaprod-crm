import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Webiaprod AI — CRM Kanban",
  description: "CRM Kanban Early Bird pour la prospection GEO/SEO de Webiaprod AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-[1600px] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <div className="font-bold text-lg leading-tight">Webiaprod AI</div>
                <div className="text-xs text-slate-500 leading-tight">CRM Kanban — Prospection GEO/SEO Early Bird</div>
              </div>
            </div>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded hover:bg-slate-100">Kanban</Link>
              <Link href="/zones" className="px-3 py-1.5 rounded hover:bg-slate-100">Zones bloquées</Link>
              <Link href="/leads/new" className="px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700">+ Nouveau lead</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-4">{children}</main>
        <footer className="mx-auto max-w-[1600px] px-4 py-6 text-xs text-slate-400">
          Offre Early Bird : 500€/12 mois + audit GEO offert (447€) · Limite 50 clients · Rareté 2-3 / ville+secteur
        </footer>
      </body>
    </html>
  );
}
