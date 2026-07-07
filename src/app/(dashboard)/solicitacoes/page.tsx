"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SolicitacoesTable from "@/components/solicitacoes/SolicitacoesTable";
import SolicitacoesKanban from "@/components/solicitacoes/SolicitacoesKanban";
import SolicitacaoDetailsModal from "@/components/solicitacoes/SolicitacaoDetailsModal";
import NovaSolicitacaoModal from "@/components/solicitacoes/NovaSolicitacaoModal";

export default function SolicitacoesPage() {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [procedureFilter, setProcedureFilter] = useState("Todos");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile safely - handle missing role column
      const { data: profile, error: profileError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();

      let query = supabase
        .from("solicitacoes_cirurgia")
        .select(`
          id,
          numero_solicitacao,
          procedimento_descricao,
          status_atual,
          data_solicitacao,
          pacientes (
            nome,
            cpf,
            plano_saude
          ),
          medicos!solicitacoes_cirurgia_medico_solicitante_id_fkey(nome)
        `);

      // If we have a profile and specifically a 'representante' role, filter.
      // If role column is missing (profileError), we default to Admin view (no filter).
      if (profile?.role === "representante") {
        query = query.eq("representante_responsavel_id", user.id);
      }

      const { data, error } = await query.order("criado_em", { ascending: false });

      if (data) {
        setSolicitacoes(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Dynamic filter options
  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(solicitacoes.map(s => s.status_atual)));
    return ["Todos", ...statuses];
  }, [solicitacoes]);

  const procedureOptions = useMemo(() => {
    const procedures = Array.from(new Set(solicitacoes.map(s => s.procedimento_descricao)));
    return ["Todos", ...procedures];
  }, [solicitacoes]);

  // Filtering logic
  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter((sol) => {
      const matchesSearch = 
        !searchTerm || 
        (sol.numero_solicitacao?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sol.pacientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sol.medicos?.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "Todos" || sol.status_atual === statusFilter;
      const matchesProcedure = procedureFilter === "Todos" || sol.procedimento_descricao === procedureFilter;

      return matchesSearch && matchesStatus && matchesProcedure;
    });
  }, [solicitacoes, searchTerm, statusFilter, procedureFilter]);

  const handleOpenDetails = (id: string) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary-container shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              <span className="material-symbols-outlined text-sm">table_rows</span>
              Tabela
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                viewMode === "kanban"
                  ? "bg-white text-primary-container shadow-sm"
                  : "text-slate-500 hover:bg-slate-200/50"
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_kanban</span>
              Kanban
            </button>
          </div>
          <button 
            onClick={() => setIsNewRequestModalOpen(true)}
            className="flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Novo Atendimento</span>
          </button>
        </div>
      </header>

      {/* Filters Bar (Common for both views) */}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-body">
              Filtrar por:
            </span>
            <div className="flex gap-2">
              <select 
                className="bg-surface-container-low border-transparent rounded-lg text-sm font-medium py-2 px-4 focus:ring-0 capitalize"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === "Todos" ? "Status" : opt.replace(/_/g, " ")}</option>
                ))}
              </select>
              <select 
                className="bg-surface-container-low border-transparent rounded-lg text-sm font-medium py-2 px-4 focus:ring-0"
                value={procedureFilter}
                onChange={(e) => setProcedureFilter(e.target.value)}
              >
                {procedureOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === "Todos" ? "Procedimento" : opt}</option>
                ))}
              </select>
              <button className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary-fixed/30 rounded-lg font-bold text-sm transition-all border border-primary/20">
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Mais Filtros
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === "table" ? (
        <SolicitacoesTable 
          solicitacoes={filteredSolicitacoes} 
          onOpenDetails={handleOpenDetails}
        />
      ) : (
        <SolicitacoesKanban 
          initialSolicitacoes={filteredSolicitacoes} 
          onOpenDetails={handleOpenDetails}
        />
      )}

      {selectedId && (
        <SolicitacaoDetailsModal
          id={selectedId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <NovaSolicitacaoModal 
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        onSuccess={() => {
           // Refresh list
           window.location.reload(); 
        }}
      />
    </>
  );
}
