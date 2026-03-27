"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Gerenciamento", href: "/solicitacoes" },
  { label: "Relatórios", href: "/relatorios" },
  { label: "Configurações", href: "/configuracoes" },
];

export default function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-lg z-50 border-b border-slate-100 shadow-sm">
      {/* Left: Logo Area */}
      <div className="flex-1 flex items-center">
        <Link href="/solicitacoes" className="flex items-center gap-3">
          <div className="relative w-12 h-12 overflow-hidden rounded-lg border border-slate-100">
            <Image
              src="/logo.png"
              alt="Gynmed Pro Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-headline font-black text-2xl tracking-tight text-gynmed-dark">
            Gynmed Pro
          </span>
        </Link>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex items-center justify-center gap-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 font-body
                ${isActive
                  ? "bg-primary-container text-white shadow-md shadow-primary/20 scale-105"
                  : "text-slate-600 hover:bg-slate-100 hover:text-primary transition-all"
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Space for layout balance */}
      <div className="flex-1" />
    </header>
  );
}
