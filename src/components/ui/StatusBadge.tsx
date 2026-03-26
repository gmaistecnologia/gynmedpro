import { SolicitacaoStatus } from "@/lib/mock-data";

const statusConfig: Record<
  SolicitacaoStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  realizada: {
    label: "Realizada",
    bg: "bg-tertiary-container/10",
    text: "text-tertiary",
    border: "border-tertiary/20",
  },
  agendado: {
    label: "Agendado",
    bg: "bg-primary-container/10",
    text: "text-primary-container",
    border: "border-primary-container/20",
  },
  divergencia: {
    label: "Divergência",
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  negado: {
    label: "Negado",
    bg: "bg-error-container/20",
    text: "text-error",
    border: "border-error/20",
  },
  autorizado: {
    label: "Autorizado",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
  solicitado: {
    label: "Solicitado",
    bg: "bg-blue-50",
    text: "text-blue-500",
    border: "border-blue-200",
  },
  protocolado: {
    label: "Protocolado",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  em_junta: {
    label: "Em Junta Médica",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
};

export default function StatusBadge({
  status,
}: {
  status: SolicitacaoStatus;
}) {
  const config = statusConfig[status];
  return (
    <span
      className={`px-3 py-1 ${config.bg} ${config.text} text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.border}`}
    >
      {config.label}
    </span>
  );
}
