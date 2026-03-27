import { supabase } from "@/lib/supabase";
import { SolicitacaoStatus } from "@/components/ui/StatusBadge";

export default async function DetalheSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch solicitation with relationships
  const { data: sol } = await supabase
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

  if (!sol) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="text-lg font-semibold">Solicitação não encontrada.</p>
        <p className="text-sm">O ID {id} não corresponde a um registro válido.</p>
      </div>
    );
  }

  // Fetch observations
  const { data: observacoes } = await supabase
    .from("historico_anotacoes")
    .select("*, usuarios (nome_completo)")
    .eq("solicitacao_id", id)
    .order("criado_em", { ascending: true });

  const obsList = observacoes || [];

  // Determine active step for simplified linear path:
  // 1: Solicitado -> 2: Protocolado -> 3: Autorizado -> 4: Agendado -> 5: Realizada
  const statusGroupMap: Record<string, number> = {
    solicitado: 0,
    protocolado: 1, divergencia: 1, defesa: 1, junta_medica: 1, reiniciado: 1,
    autorizado: 2, pendencia_agendamento: 2,
    agendado: 3,
    cirurgia_realizada: 4,
  };
  
  const statusIndex = statusGroupMap[sol.status_atual] ?? 0;
  const isFailed = ['negado', 'desistencia', 'cancelado'].includes(sol.status_atual);

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
    <div className="pt-4 pb-12 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto">
      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <nav className="flex items-center gap-2 text-xs text-secondary mb-2 uppercase tracking-widest font-semibold">
                <span>Solicitações</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span>Detalhes</span>
              </nav>
              <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">
                Solicitação {sol.numero_solicitacao || `#GYN-${sol.id.split('-')[0].toUpperCase()}`} - Detalhes
              </h1>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">Status Atual</span>
              <div className="bg-tertiary-container/10 text-tertiary-container px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 border border-tertiary-container/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container" />
                </span>
                {sol.status_atual.replace(/_/g, " ").toUpperCase()}
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -translate-y-1/2 z-0 mx-12" />
            {steps.map((step, i) => (
              <div key={i} className={`relative z-10 flex flex-col items-center gap-2 group ${!step.completed && !step.active ? "opacity-40" : ""}`}>
                {step.completed ? (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </div>
                ) : step.active ? (
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-primary text-primary flex items-center justify-center font-bold shadow-xl">
                    <span className="material-symbols-outlined">medical_services</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold">
                    {i + 1}
                  </div>
                )}
                <span className={`text-[11px] font-bold uppercase tracking-tight ${step.active ? "text-primary font-black" : step.failed ? "text-error" : step.completed ? "text-secondary" : "text-outline"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Informações Gerais */}
          <section className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-5 border border-transparent hover:border-primary-fixed-dim/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">info</span>
              </div>
              <h2 className="font-headline font-bold text-secondary text-base">Informações Gerais</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">ID da Solicitação</label>
                <span className="text-sm font-semibold text-on-surface">{sol.numero_solicitacao || `#GYN-${sol.id.split('-')[0].toUpperCase()}`}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Data de Entrada</label>
                <span className="text-sm font-semibold text-on-surface">{new Date(sol.data_solicitacao).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Médico Solicitante</label>
                <span className="text-sm font-semibold text-on-surface">{sol.medico_solit?.nome || "Não Informado"}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Responsável Atual</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                    {(sol.usuarios?.nome_completo || "S").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-on-surface">
                    {sol.usuarios?.nome_completo || "Equipe de Auditoria"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dados da Paciente */}
          <section className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">patient_list</span>
              </div>
              <h2 className="font-headline font-bold text-secondary text-base">Dados da Paciente</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Nome Completo</label>
                <span className="text-sm font-bold text-on-surface">{sol.pacientes?.nome || "Não Informado"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-outline uppercase">CPF</label>
                  <span className="text-sm font-semibold text-on-surface">{sol.pacientes?.cpf || "Não Informado"}</span>
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-outline uppercase">Nascimento</label>
                  <span className="text-sm font-semibold text-on-surface">{sol.pacientes?.data_nascimento ? new Date(sol.pacientes.data_nascimento).toLocaleDateString("pt-BR") : "Não Informado"}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Plano de Saúde</label>
                <span className="text-sm font-semibold text-on-surface">{sol.pacientes?.plano_saude || "Não Informado"}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Telefone</label>
                <span className="text-sm font-semibold text-on-surface">{sol.pacientes?.telefone || "Não Informado"}</span>
              </div>
            </div>
          </section>

          {/* Procedimento */}
          <section className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/20 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">surgical</span>
              </div>
              <h2 className="font-headline font-bold text-secondary text-base">Procedimento</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Tipo de Cirurgia</label>
                <span className="text-sm font-bold text-on-surface">{sol.procedimento_descricao}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">CID-10</label>
                <span className="text-sm font-semibold text-on-surface">{sol.cid_10 || "N80.0 (Endometriose do útero)"}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Hospital de Preferência</label>
                <span className="text-sm font-semibold text-on-surface">{sol.hospitais?.nome_hospital || "Hospital Mater Dei"}</span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase">Descrição Sumária</label>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                  {sol.descricao_sumaria || "Paciente com diagnóstico de miomatose uterina sintomática, apresentando menorragia e dor pélvica crônica. Indicada ressecção por via histeroscópica."}
                </p>
              </div>
            </div>
          </section>

          {/* Observações (wide) */}
          <section className="lg:col-span-2 bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                </div>
                <h2 className="font-headline font-bold text-secondary text-base">Observações e Anotações</h2>
              </div>
              <span className="text-[10px] font-bold text-outline uppercase">Histórico: {obsList.length.toString().padStart(2, "0")} registros</span>
            </div>
            <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2">
              {obsList.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                  Nenhuma observação registrada.
                </div>
              )}
              {obsList.map((obs: any, i: number) => (
                <div key={obs.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full mt-2 bg-primary`} />
                    {i < obsList.length - 1 && <div className="w-[1px] h-full bg-outline-variant/30" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-secondary">{obs.usuarios?.nome_completo || "Sistema"}</span>
                      <span className="text-[10px] text-outline">{new Date(obs.criado_em).toLocaleString("pt-BR")}</span>
                    </div>
                    <div className={`p-3 rounded-lg text-xs leading-relaxed bg-surface text-on-surface-variant`}>
                      {obs.conteudo_anotacao}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-surface-container">
              <label className="text-[10px] font-bold text-outline uppercase mb-2 block">Nova Anotação</label>
              <div className="relative">
                <textarea className="w-full h-24 bg-surface-container-low border-transparent rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-outline/50 resize-none transition-all" placeholder="Escreva aqui sua observação técnica ou administrativa..." />
                <button className="absolute bottom-3 right-3 bg-secondary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-on-secondary-fixed-variant transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">send</span>
                  Salvar
                </button>
              </div>
            </div>
          </section>

          {/* Atribuição Final */}
          <section className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-5 border-2 border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">person_check</span>
              </div>
              <h2 className="font-headline font-bold text-secondary text-base">Atribuição Final</h2>
            </div>
            <div className="space-y-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-outline uppercase mb-2">Cirurgião Principal</label>
                <div className="relative">
                  <span className="text-sm font-semibold text-on-surface">{sol.cirurgiao?.nome || "Pendente"}</span>
                </div>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[10px] text-primary-container font-medium leading-tight">
                  A atribuição do cirurgião principal é necessária para a finalização do protocolo de agendamento cirúrgico.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Right Side Panel */}
      <aside className="w-full md:w-[320px] space-y-6">
        {/* Actions Card */}
        <div className="bg-gynmed-dark text-white p-6 rounded-xl elevation-ambient flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
          <div className="relative z-10">
            <h3 className="font-headline font-bold text-lg mb-1">Ações do Processo</h3>
            <p className="text-white/60 text-xs">
              Mudar status a partir de <span className="text-secondary-container font-bold uppercase">{sol.status_atual.replace(/_/g, " ")}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 relative z-10">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-primary-container hover:bg-primary transition-all rounded-lg font-bold text-sm group">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">rule</span>
                Marcar Divergência
              </span>
              <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-tertiary-container hover:bg-tertiary transition-all rounded-lg font-bold text-sm group">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">groups</span>
                Enviar para Junta
              </span>
              <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
            </button>
            <button className="w-full flex items-center justify-between px-4 py-3 bg-error/20 border border-error/30 hover:bg-error/40 transition-all rounded-lg font-bold text-sm text-error-container group">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined">block</span>
                Negar Solicitação
              </span>
              <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">close</span>
            </button>
          </div>
          <div className="pt-4 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase font-bold tracking-widest">
              <span className="material-symbols-outlined text-xs">history</span>
              Última atividade: há 42 min
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="bg-surface-container-lowest p-6 rounded-xl elevation-ambient flex flex-col gap-3">
          <button className="w-full py-3 px-4 flex items-center gap-3 text-secondary font-semibold text-sm hover:bg-surface-container-low rounded-lg transition-colors">
            <span className="material-symbols-outlined text-primary">attachment</span>
            Anexos da Solicitação
            <span className="ml-auto bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">08</span>
          </button>
          <button className="w-full py-3 px-4 flex items-center gap-3 text-secondary font-semibold text-sm hover:bg-surface-container-low rounded-lg transition-colors">
            <span className="material-symbols-outlined text-primary">print</span>
            Imprimir Guia
          </button>
          <div className="h-[1px] bg-surface-container-high my-1" />
          <button className="w-full py-3 px-4 flex items-center gap-3 text-error font-semibold text-sm hover:bg-error-container/20 rounded-lg transition-colors">
            <span className="material-symbols-outlined">cancel</span>
            Cancelar Solicitação
          </button>
        </div>

        {/* Compliance */}
        <div className="bg-tertiary/5 p-5 rounded-xl border border-tertiary/10">
          <div className="flex items-center gap-2 text-tertiary font-bold text-xs mb-2">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Compliance Gynmed
          </div>
          <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed">
            Esta solicitação segue os protocolos da RN 465/2021 da ANS. A análise deve ser concluída em até 48 horas úteis devido à classificação de urgência moderada.
          </p>
        </div>
      </aside>
    </div>
  );
}
