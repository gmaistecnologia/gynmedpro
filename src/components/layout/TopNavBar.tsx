"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Gerenciamento", href: "/solicitacoes" },
  { label: "Relatórios", href: "/relatorios" },
  { label: "Configurações", href: "/configuracoes" },
];

export default function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-lg z-50 border-b border-slate-100 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/solicitacoes" className="flex items-center">
          <span className="font-headline font-black text-2xl tracking-tight text-gynmed-dark">
            Gynmed
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "text-primary-container font-bold border-b-2 border-primary-container pb-1 font-body text-sm"
                    : "text-slate-500 font-medium hover:text-gynmed-dark transition-all duration-200 hover:bg-slate-50 rounded-lg px-2 py-1 font-body text-sm"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}
