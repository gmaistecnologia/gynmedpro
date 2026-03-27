"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SolicitacaoDetailsModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SolicitacaoDetailsModal({ id, isOpen, onClose }: SolicitacaoDetailsModalProps) {
  const [sol, setSol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [obsList, setObsList] = useState<any[]>([]);

  useEffect(() => {
    if (!id || !isOpen) return;

    async function fetchDetails() {
      setLoading(true);
      
      const { data: solData } = await supabase
        .from("solicitacoes_cirurgia")
        .select(`
          *,
          pacientes (*),
          medico_solit:medicos!solicitacoes_cirurgia_medico_solicitante_id_fkey(*),
          cirurgiao:medicos!solicitacoes_cirurgia_cirurgiao_principal_id_fkey(*),
          hospitais (*),
          usuarios!solicitacoes_cirurgia_representante_responsavel_id_fkey(nome_completo)
        `)
        .eq("id", id)
        .single();

      if (solData) {
        setSol(solData);
        
        const { data: observacoes } = await supabase
          .from("historico_anotacoes")
          .select("*, usuarios (nome_completo)")
          .eq("solicitacao_id", id)
          .order("criado_em", { ascending: true });

        setObsList(observacoes || []);
      }
      setLoading(false);
    }

    fetchDetails();
  }, [id, isOpen]);

  if (!isOpen) return null;

  const statusGroupMap: Record<string, number> = {
    solicitado: 0,
    protocolado: 1, divergencia: 1, defesa: 1, junta_medica: 1, reiniciado: 1,
    autorizado: 2, pendencia_agendamento: 2,
    agendado: 3,
    cirurgia_realizada: 4,
  };
  
  const statusIndex = sol ? (statusGroupMap[sol.status_atual] ?? 0) : 0;
  const isFailed = sol ? ['negado', 'desistencia', 'cancelado'].includes(sol.status_atual) : false;

  const stepsDefinition = [
    { id: "solicitado", label: "Solicitado" },
    { id: "protocolado", label: "Protocolado" },
    { id: "autorizado", label: "Autorizado" },
    { id: "agendado", label: "Agendado" },
    { id: "cirurgia_realizada", label: "Realizada" },
  ];

  const steps = stepsDefinition.map((s, idx) => ({
    label: s.label,
    completed: idx < statusIndex && !isFailed,
    active: idx === statusIndex && !isFailed,
    failed: isFailed && idx === statusIndex
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-secondary/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-surface w-full max-w-[90vw] h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-slate-100 shrink-0 relative">
          <div className="flex items-center gap-4">
            <h1 className="font-headline font-bold text-2xl text-secondary tracking-tight">
              {loading ? "Carregando detalhes..." : `Solicitação ${sol?.numero_solicitacao || `#GYN-${id.split('-')[0].toUpperCase()}`}`}
            </h1>
          </div>
          
          <div className="flex items-center gap-6 pr-12">
            {!loading && sol && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">Status Atual</span>
                <div className="bg-tertiary-container/10 text-tertiary-container px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border border-tertiary-container/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container" />
                  </span>
                  {sol.status_atual.replace(/_/g, " ").toUpperCase()}
                </div>
              </div>
            )}
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-8 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors z-[110]"
              title="Fechar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold">Buscando informações no banco de dados...</p>
            </div>
          ) : !sol ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-lg font-semibold">Solicitação não encontrada.</p>
              <p className="text-sm">O ID {id} não corresponde a um registro válido.</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 max-w-[1400px] mx-auto">
              <main className="flex-1 space-y-8">
                {/* Step Progress */}
                <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-sm border border-slate-50 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0 mx-16" />
                  {steps.map((step, i) => (
                    <div key={i} className={`relative z-10 flex flex-col items-center gap-3 group ${!step.completed && !step.active ? "opacity-30" : ""}`}>
                      {step.completed ? (
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                      ) : step.active ? (
                        <div className="w-14 h-14 rounded-full bg-white border-4 border-primary text-primary flex items-center justify-center font-bold shadow-xl transition-transform group-hover:scale-110">
                          <span className="material-symbols-outlined">medical_services</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? "text-primary" : step.failed ? "text-error" : step.completed ? "text-secondary" : "text-slate-400"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Informações Gerais */}
                  <section className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                      <span className="material-symbols-outlined text-primary">info</span>
                      <h2 className="font-bold text-secondary">Geral</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID e Data</p>
                        <p className="text-sm font-bold text-secondary">{sol.numero_solicitacao || `#GYN-${sol.id.split('-')[0].toUpperCase()}`}</p>
                        <p className="text-xs text-slate-500">{new Date(sol.data_solicitacao).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Médico Responsável</p>
                        <p className="text-sm font-bold text-secondary">{sol.medico_solit?.nome || "Não Informado"}</p>
                      </div>
                    </div>
                  </section>

                  {/* Paciente */}
                  <section className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                      <span className="material-symbols-outlined text-tertiary">patient_list</span>
                      <h2 className="font-bold text-secondary">Paciente</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</p>
                        <p className="text-sm font-bold text-secondary">{sol.pacientes?.nome || "Não Informado"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CPF</p>
                          <p className="text-xs font-bold text-secondary">{sol.pacientes?.cpf || "Não Informado"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plano</p>
                          <p className="text-xs font-bold text-secondary">{sol.pacientes?.plano_saude || "Não Informado"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Procedimento */}
                  <section className="bg-white p-6 rounded-2xl border border-slate-50 shadow-sm space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                      <span className="material-symbols-outlined text-amber-500">surgical</span>
                      <h2 className="font-bold text-secondary">Procedimento</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição</p>
                        <p className="text-sm font-bold text-secondary truncate">{sol.procedimento_descricao}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Local Sugerido</p>
                        <p className="text-xs font-bold text-secondary">{sol.hospitais?.nome_hospital || "Hospital Mater Dei"}</p>
                      </div>
                    </div>
                  </section>

                  {/* Observações */}
                  <section className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-50 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-secondary flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">forum</span>
                        Histórico / Chat
                      </h3>
                      <span className="text-[9px] font-black bg-slate-50 px-2 py-1 rounded text-slate-400 uppercase tracking-widest">{obsList.length} registros</span>
                    </div>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-3 custom-scrollbar">
                      {obsList.length === 0 && <p className="text-center text-xs text-slate-300 py-8 italic font-body">Nenhum registro encontrado no histórico.</p>}
                      {obsList.map((obs) => (
                        <div key={obs.id} className="flex gap-4">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-black text-secondary uppercase">{obs.usuarios?.nome_completo || "Sistema"}</span>
                              <span className="text-[9px] text-slate-400">{new Date(obs.criado_em).toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="p-3 bg-slate-50/50 rounded-2xl rounded-tl-none text-xs text-slate-600 font-body leading-relaxed">
                              {obs.conteudo_anotacao}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Atribuição */}
                  <section className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-4">
                    <h3 className="font-bold text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined">person_check</span>
                      Equipe
                    </h3>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Cirurgião Principal</p>
                      <p className="text-sm font-bold text-secondary">{sol.cirurgiao?.nome || "Aguardando Atribuição"}</p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-2xl border border-primary/10">
                      <p className="text-[10px] text-primary/70 font-medium leading-relaxed italic">
                        Agendamento processado por {sol.usuarios?.nome_completo || "Equipe Central"}.
                      </p>
                    </div>
                  </section>
                </div>
              </main>

              {/* Sidebar do Modal */}
              <aside className="w-full md:w-[300px] space-y-6">
                <div className="bg-secondary p-6 rounded-[32px] text-white space-y-6 shadow-xl shadow-secondary/20">
                  <h3 className="font-bold text-lg leading-tight">Painel de Ações</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-primary-container text-white rounded-2xl font-bold text-xs hover:scale-[1.02] transition-transform group">
                      Autorizar Procedimento
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-white/10 text-white rounded-2xl font-bold text-xs hover:bg-white/20 transition-all">
                      Registrar Divergência
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-error/20 border border-error/20 text-error-container rounded-2xl font-bold text-xs hover:bg-error/30 transition-all">
                      Negar Solicitação
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full py-3 border border-slate-100 bg-white rounded-2xl text-[11px] font-bold text-secondary uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">attachment</span>
                    Ver Anexos (08)
                  </button>
                  <button className="w-full py-3 border border-slate-100 bg-white rounded-2xl text-[11px] font-bold text-secondary uppercase hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">print</span>
                    Imprimir Guia
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
