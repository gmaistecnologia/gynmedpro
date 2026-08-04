import type { StatusExtra } from '../../lib/reportMedicoStatus'
import type { SolicitacaoImportada } from '../../lib/types'

type StepState = 'completed' | 'current' | 'pending' | 'negative'

type Step = {
  key: string
  icon: string
  label: string
  sublabel: string
  date: string | null
  state: StepState
}

// data_* são `date` puros ('YYYY-MM-DD'); formatar via new Date(...) sofre deslocamento de
// fuso (vira o dia anterior em UTC-3). Formatação direta na string evita isso.
function formatarDataBR(dataIso: string | null): string {
  if (!dataIso) return '—'
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

function formatarHora(hora: string | null): string {
  if (!hora) return ''
  return hora.slice(0, 5)
}

const NODE_CLASSES: Record<StepState, { circle: string; date: string; label: string; sub: string; line: string }> = {
  completed: {
    circle: 'bg-tertiary border-tertiary text-on-tertiary',
    date: 'text-tertiary',
    label: 'text-on-surface',
    sub: 'text-on-surface-variant',
    line: 'bg-tertiary/50',
  },
  current: {
    circle: 'bg-surface-container-lowest border-tertiary text-tertiary',
    date: 'text-tertiary',
    label: 'text-on-surface',
    sub: 'text-on-surface-variant',
    line: 'bg-outline-variant/40',
  },
  pending: {
    circle: 'bg-surface-container-high border-outline-variant/40 text-outline',
    date: 'text-outline',
    label: 'text-outline',
    sub: 'text-outline/70',
    line: 'bg-outline-variant/40',
  },
  negative: {
    circle: 'bg-error border-error text-on-error',
    date: 'text-error',
    label: 'text-error',
    sub: 'text-on-surface-variant',
    line: 'bg-error/40',
  },
}

export function SolicitacaoTimeline({
  solicitacao,
  statusExtra,
}: {
  solicitacao: SolicitacaoImportada
  statusExtra: StatusExtra | null
}) {
  const reprovado = Boolean(solicitacao.data_reprovacao)

  const raw: Array<Omit<Step, 'state'>> = [
    {
      key: 'solicitacao',
      icon: 'rocket_launch',
      label: 'Solicitação',
      sublabel: 'Início do processo',
      date: solicitacao.data_solicitacao,
    },
    {
      key: 'orcamento',
      icon: 'request_quote',
      label: 'Orçamento',
      sublabel: solicitacao.nro_orcamento ? `Nº ${solicitacao.nro_orcamento}` : 'Proposta enviada',
      date: solicitacao.data_orcamento,
    },
    {
      key: 'protocolo',
      icon: 'description',
      label: 'Protocolo',
      sublabel: 'Enviado ao convênio',
      date: statusExtra?.data_protocolo ?? null,
    },
    {
      key: 'aprovacao',
      icon: reprovado ? 'block' : 'task_alt',
      label: reprovado ? 'Reprovação' : 'Aprovação',
      sublabel: reprovado ? 'Convênio negou' : 'Convênio autorizou',
      date: reprovado ? solicitacao.data_reprovacao : solicitacao.data_aprovacao,
    },
    {
      key: 'cirurgia',
      icon: 'medical_services',
      label: 'Cirurgia',
      sublabel: solicitacao.hora_cirurgia ? `às ${formatarHora(solicitacao.hora_cirurgia)}` : 'Procedimento',
      date: solicitacao.data_cirurgia,
    },
  ]

  const firstPendingIndex = raw.findIndex((step) => !step.date)

  const steps: Step[] = raw.map((step, index) => {
    let state: StepState = 'pending'
    if (step.key === 'aprovacao' && reprovado) {
      state = 'negative'
    } else if (step.date) {
      state = 'completed'
    } else if (index === firstPendingIndex) {
      state = 'current'
    }
    return { ...step, state }
  })

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-[640px] px-2">
        {steps.map((step, index) => {
          const classes = NODE_CLASSES[step.state]
          const nextClasses = index < steps.length - 1 ? NODE_CLASSES[steps[index + 1].state] : null
          const lineDone = step.state === 'completed' || step.state === 'negative'

          return (
            <div key={step.key} className="flex items-start">
              <div className="flex flex-col items-center text-center w-28 shrink-0">
                <span className={`text-xs font-bold leading-4 mb-2 ${classes.date}`}>{formatarDataBR(step.date)}</span>
                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 ${classes.circle}`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {step.state === 'completed' ? 'check' : step.state === 'negative' ? 'close' : step.icon}
                  </span>
                </div>
                <span className={`mt-2 text-sm font-bold ${classes.label}`}>{step.label}</span>
                <span className={`text-xs ${classes.sub}`}>{step.sublabel}</span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex flex-col items-center flex-1 min-w-[3rem] px-1">
                  <div className="h-6" />
                  <div className="h-11 w-full flex items-center">
                    <div className={`h-0.5 w-full rounded-full ${lineDone ? classes.line : nextClasses?.line}`} />
                  </div>

                  {step.key === 'orcamento' && solicitacao.data_validade && (
                    <div className="flex flex-col items-center mt-2">
                      <div className="w-px h-3 bg-outline-variant/50" />
                      <span className="material-symbols-outlined text-[16px] text-secondary">flag</span>
                      <span className="mt-1 text-[11px] font-bold text-secondary whitespace-nowrap">
                        {formatarDataBR(solicitacao.data_validade)}
                      </span>
                      <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Validade orçamento</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
