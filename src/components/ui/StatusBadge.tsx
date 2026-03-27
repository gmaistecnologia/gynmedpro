export type SolicitacaoStatus = 
  | 'solicitado'
  | 'protocolado'
  | 'divergencia'
  | 'defesa'
  | 'junta_medica'
  | 'reiniciado'
  | 'negado'
  | 'autorizado'
  | 'pendencia_agendamento'
  | 'desistencia'
  | 'agendado'
  | 'cancelado'
  | 'cirurgia_realizada';

const statusConfig: Record<
  SolicitacaoStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  solicitado: { label: "Solicitado", bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200" },
  protocolado: { label: "Protocolado", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  divergencia: { label: "Divergência", bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  defesa: { label: "Defesa", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  junta_medica: { label: "Junta Médica", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  reiniciado: { label: "Reiniciado", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200" },
  negado: { label: "Negado", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  autorizado: { label: "Autorizado", bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
  pendencia_agendamento: { label: "Pendência de Agendamento", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  desistencia: { label: "Desistência", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  agendado: { label: "Agendado", bg: "bg-primary-container/20", text: "text-primary-container", border: "border-primary-container/20" },
  cancelado: { label: "Cancelado", bg: "bg-slate-200", text: "text-slate-500", border: "border-slate-300" },
  cirurgia_realizada: { label: "Cirurgia Realizada", bg: "bg-tertiary-container/10", text: "text-tertiary", border: "border-tertiary/20" }
};

export default function StatusBadge({ status }: { status: SolicitacaoStatus }) {
  const config = statusConfig[status] || {
    label: status.replace("_", " "),
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200"
  };
  
  return (
    <span
      className={`px-3 py-1 ${config.bg} ${config.text} text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.border}`}
    >
      {config.label}
    </span>
  );
}
