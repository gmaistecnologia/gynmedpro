"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sideLinks = [
  { label: "Painel", icon: "dashboard", href: "/painel" },
  { label: "Pacientes", icon: "group", href: "/solicitacoes" },
  { label: "Agenda", icon: "calendar_today", href: "/agenda" },
  { label: "Prontuários", icon: "clinical_notes", href: "/prontuarios" },
  { label: "Financeiro", icon: "payments", href: "/financeiro" },
];

export default function SideNavBar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full pt-20 pb-6 px-4 flex flex-col gap-2 bg-surface h-screen w-64 border-r border-slate-100 z-40">
      {/* User card */}
      <div className="px-4 py-4 mb-4 bg-white rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm">
            DC
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Dr. Clinico</p>
            <p className="text-xs text-slate-500">Ginecologia</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {sideLinks.map((link) => {
          const isActive =
            pathname.startsWith(link.href) ||
            (link.href === "/solicitacoes" &&
              pathname.startsWith("/solicitacoes"));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "flex items-center gap-3 px-4 py-3 bg-white text-primary-container shadow-sm rounded-xl font-semibold translate-x-1 font-body text-sm"
                  : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-200/50 rounded-xl transition-colors duration-150 font-body text-sm font-medium"
              }
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-around px-2">
        <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-all duration-200 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined !text-[22px]">notifications</span>
          <span className="text-[10px] font-bold uppercase">Avisos</span>
        </button>
        <button className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-primary rounded-xl transition-all duration-200 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined !text-[22px]">account_circle</span>
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
        <button className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all duration-200 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined !text-[22px]">logout</span>
          <span className="text-[10px] font-bold uppercase">Sair</span>
        </button>
      </div>
    </aside>
  );
}
