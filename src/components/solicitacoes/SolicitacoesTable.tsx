"use client";

import Link from "next/link";
import StatusBadge, { SolicitacaoStatus } from "@/components/ui/StatusBadge";

interface SolicitacoesTableProps {
  solicitacoes: any[];
  onOpenDetails: (id: string) => void;
}

export default function SolicitacoesTable({ solicitacoes, onOpenDetails }: SolicitacoesTableProps) {
  return (
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
                Médico Solicitante
              </th>
              <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                Procedimento
              </th>
              <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                Solicitação
              </th>
              <th className="px-6 py-4 font-headline font-bold text-xs text-slate-600 uppercase tracking-widest border-b border-outline-variant/10">
                Status Atual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {solicitacoes.map((sol: any, idx: number) => (
              <tr key={sol.id} className={`hover:bg-slate-50/80 transition-colors group ${idx % 2 === 1 ? "bg-surface-container-low" : ""}`}>
                <td className="px-6 py-4">
                  <span className="text-xs font-mono text-slate-400">
                    {sol.numero_solicitacao || `#GYN-${sol.id.split('-')[0].toUpperCase()}`}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {(sol.pacientes?.nome || "P").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex flex-col">
                      <button 
                        onClick={() => onOpenDetails(sol.id)}
                        className="font-bold text-sm text-gynmed-dark hover:text-primary transition-colors text-left focus:outline-none"
                      >
                        {sol.pacientes?.nome || "Paciente Não Informado"}
                      </button>
                      <span className="text-xs text-slate-500 font-medium">{sol.pacientes?.plano_saude || "Não Informado"}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-[8px]">
                      {(sol.medicos?.nome || "M").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </div>
                    <span className="text-sm text-slate-600 font-medium">{sol.medicos?.nome || "Médico Não Informado"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{sol.procedimento_descricao}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(sol.data_solicitacao).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={sol.status_atual as SolicitacaoStatus} />
                </td>
              </tr>
            ))}
            {solicitacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (Keeping UI consistent) */}
      <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
        <span className="text-xs text-slate-500 font-body">
          Mostrando {solicitacoes.length} solicitações localizadas
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
  );
}
