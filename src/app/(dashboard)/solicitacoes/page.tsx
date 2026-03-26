"use client";

import Link from "next/link";
import { mockSolicitacoes } from "@/lib/mock-data";
import StatusBadge from "@/components/ui/StatusBadge";

export default function TabelaSolicitacoesPage() {
  return (
    <>
      {/* Section Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">
            Gerenciamento de Solicitações
          </h1>
          <p className="text-slate-500 font-body mt-1">
            Acompanhamento centralizado de procedimentos e autorizações.
          </p>
        </div>
        <div className="flex items-center gap-3 p-1 bg-surface-container-low rounded-xl">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-primary-container shadow-sm rounded-lg font-semibold text-sm transition-all">
            <span className="material-symbols-outlined text-sm">table_rows</span>
            Tabela
          </button>
          <Link
            href="/solicitacoes/kanban"
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:bg-slate-200/50 rounded-lg font-medium text-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm">view_kanban</span>
            Kanban
          </Link>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm font-body"
              placeholder="Buscar paciente, médico ou ID..."
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">
              Filtrar por:
            </span>
            <div className="flex gap-2">
              <select className="bg-surface-container-low border-transparent rounded-lg text-sm font-medium py-2 px-4 focus:ring-0">
                <option>Status</option>
                <option>Realizada</option>
                <option>Agendado</option>
                <option>Divergência</option>
                <option>Negado</option>
              </select>
              <select className="bg-surface-container-low border-transparent rounded-lg text-sm font-medium py-2 px-4 focus:ring-0">
                <option>Procedimento</option>
                <option>Cesárea</option>
                <option>Histeroscopia</option>
                <option>Laparoscopia</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary-fixed/30 rounded-lg font-bold text-sm transition-all border border-primary/20">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Mais Filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Grid */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  ID
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  <button className="flex items-center gap-1 hover:text-primary transition-colors">
                    Paciente
                    <span className="material-symbols-outlined text-sm">unfold_more</span>
                  </button>
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  Status Atual
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  Médico Solicitante
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  Cirurgião Principal
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  Procedimento
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                  Solicitação
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10 text-center">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockSolicitacoes.slice(0, 5).map((sol, idx) => (
                <tr
                  key={sol.id}
                  className={`hover:bg-slate-50/80 transition-colors group ${idx % 2 === 1 ? "bg-surface-container-low" : ""}`}
                >
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{sol.codigo}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                        {sol.paciente
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-bold text-sm text-gynmed-dark">{sol.paciente}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sol.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{sol.medicoSolicitante}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{sol.cirurgiaoPrincipal}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{sol.procedimento}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{sol.dataSolicitacao}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/solicitacoes/${sol.id}`}
                        className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-all"
                        title="Ver Detalhes"
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </Link>
                      <button
                        className="p-2 hover:bg-tertiary/10 rounded-lg text-tertiary transition-all"
                        title="Aprovar"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                      <button
                        className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-all"
                        title="Agendar"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_month</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
          <span className="text-xs text-slate-500 font-body">
            Mostrando 1-5 de 24 solicitações
          </span>
          <div className="flex items-center gap-1">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 disabled:opacity-30" disabled>
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg text-xs font-bold shadow-sm">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              3
            </button>
            <span className="px-2 text-slate-400">...</span>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
              5
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
              <span className="material-symbols-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
