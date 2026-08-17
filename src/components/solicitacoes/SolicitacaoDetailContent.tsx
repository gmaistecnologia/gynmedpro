import { Card } from '../ui/Card'
import { StatusFinalEditavel } from '../relatorios/StatusFinalEditavel'
import { ProtocoloDateInput, ObservacaoTextarea } from '../relatorios/CamposAcompanhamentoEditaveis'
import { SolicitacaoTimeline } from './SolicitacaoTimeline'
import { statusFinalDe, type StatusExtra } from '../../lib/reportMedicoStatus'
import type { SolicitacaoImportada } from '../../lib/types'

const currencyFull = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-outline uppercase tracking-wide">{label}</label>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  )
}

export function SolicitacaoDetailContent({
  solicitacao,
  statusExtra,
  onAtualizarExtra,
}: {
  solicitacao: SolicitacaoImportada
  statusExtra: StatusExtra | null
  onAtualizarExtra: (patch: Partial<StatusExtra>) => void | Promise<void>
}) {
  const dataCirurgiaCompleta = solicitacao.data_cirurgia
    ? `${formatarDataBR(solicitacao.data_cirurgia)}${
        solicitacao.hora_cirurgia ? ` às ${formatarHora(solicitacao.hora_cirurgia)}` : ''
      }`
    : 'A definir'

  const statusFinal = statusFinalDe(statusExtra)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">info</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Informações Gerais</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Hospital"
              value={
                solicitacao.hospital_nome
                  ? `${solicitacao.hospital_nome}${solicitacao.hospital_uf ? ` — ${solicitacao.hospital_uf}` : ''}`
                  : '—'
              }
            />
            <Field label="Data e hora da cirurgia" value={dataCirurgiaCompleta} />
            <Field
              label="Grupo / Tipo"
              value={[solicitacao.descricao_grupo, solicitacao.descricao_tipo].filter(Boolean).join(' — ') || '—'}
            />
            <Field label="Representante" value={solicitacao.representante_nome ?? '—'} />
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">patient_list</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Paciente & Médico</h2>
          </div>
          <div className="space-y-4">
            <Field label="Paciente" value={solicitacao.paciente_nome ?? '—'} />
            <Field label="Médico" value={solicitacao.medico_nome ?? '—'} />
            <Field label="Plano de saúde" value={solicitacao.plano_saude_nome ?? '—'} />
          </div>
        </Card>

        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary-container/30 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <h2 className="font-headline font-bold text-secondary text-base">Valores</h2>
          </div>
          <div className="space-y-4">
            <Field
              label="Valor do orçamento"
              value={solicitacao.valor_orcamento != null ? currencyFull.format(solicitacao.valor_orcamento) : '—'}
            />
            <Field
              label="Valor realizado"
              value={solicitacao.valor_realizado != null ? currencyFull.format(solicitacao.valor_realizado) : '—'}
            />
            <Field label="Nro. Orçamento" value={solicitacao.nro_orcamento ?? '—'} />
            <Field label="Nro. Agendamento" value={solicitacao.nro_agendamento} />
          </div>
        </Card>
      </div>

      <Card className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">event</span>
          </div>
          <h2 className="font-headline font-bold text-secondary text-base">Linha do Tempo</h2>
        </div>
        <SolicitacaoTimeline solicitacao={solicitacao} statusExtra={statusExtra} />
      </Card>

      <Card className="p-6 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container/10 text-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
          </div>
          <div>
            <h2 className="font-headline font-bold text-secondary text-base">Acompanhamento · Report Médico</h2>
            <p className="text-xs text-on-surface-variant">Editável aqui — reflete direto na tela Report Médico.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wide">Status Final</label>
            <div>
              <StatusFinalEditavel
                status={statusFinal}
                onChange={(novoStatus) => onAtualizarExtra({ status_final: novoStatus })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wide">Data Protocolo</label>
            <ProtocoloDateInput
              valor={statusExtra?.data_protocolo ?? null}
              onCommit={(v) => onAtualizarExtra({ data_protocolo: v || null })}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wide">Observações</label>
            <ObservacaoTextarea
              valor={statusExtra?.observacoes ?? ''}
              onCommit={(v) => onAtualizarExtra({ observacoes: v || null })}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
