import { createClient } from "@/lib/supabase/server";
import DashboardFiltros, { FiltroOpcao } from "@/components/relatorios/DashboardFiltros";
import EvolucaoChart, { EvolucaoPonto } from "@/components/relatorios/EvolucaoChart";
import ReportMedicoTable, { MedicoLinha } from "@/components/relatorios/ReportMedicoTable";
import PerformanceRepresentanteTable from "@/components/relatorios/PerformanceRepresentanteTable";

export const revalidate = 0; // sempre recalcula com dados frescos

const MESES_ABBR = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// ── Helpers de formatação ────────────────────────────────────────────
function fmtFull(v: number) {
  if (!v) return "—";
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}
function fmtCompact(v: number) {
  if (!v) return "—";
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000)} mil`;
  return `R$ ${Math.round(v)}`;
}
function monthKey(dateStr?: string | null) {
  return dateStr ? dateStr.slice(0, 7) : null; // "2026-07"
}
function mesLabel(key: string) {
  const [ano, mes] = key.split("-");
  return `${MESES_ABBR[Number(mes) - 1]} ${ano.slice(2)}`;
}
function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

type Cotacao = {
  representante_id: string | null;
  medico_nome: string | null;
  paciente_nome: string | null;
  procedimento: string | null;
  grupo_procedimento: string | null;
  convenio: string | null;
  hospital: string | null;
  uf_hospital: string | null;
  valor: number | string | null;
  valor_orcamento: number | string | null;
  valor_final: number | string | null;
  etapa: string;
  em_aberto: boolean | null;
  mes_referencia: string | null;
  data_vencimento_cotacao: string | null;
  status_pedido_cirurgico: string | null;
  status_pedido_cirurgico2: string | null;
  status_final: string | null;
};

type StatusPedido =
  | "solicitado"
  | "protocolado"
  | "autorizado"
  | "pendencia_agendamento"
  | "cirurgia_realizada"
  | "perdido"
  | "outros";

function bucketStatusPedido(c: Cotacao): StatusPedido | null {
  const raw = c.status_final || c.status_pedido_cirurgico2 || c.status_pedido_cirurgico;
  if (!raw) return null;
  switch (raw) {
    case "SOLICITADO":
      return "solicitado";
    case "PROTOCOLADO":
      return "protocolado";
    case "AUTORIZADO":
      return "autorizado";
    case "PENDÊNCIA AGENDAMENTO":
      return "pendencia_agendamento";
    case "CIRURGIA REALIZADA":
      return "cirurgia_realizada";
    case "CANCELADO":
    case "NEGADO":
    case "DESISTÊNCIA":
      return "perdido";
    default:
      return "outros";
  }
}

function valorEfetivo(c: Cotacao) {
  return Number(c.valor_final ?? c.valor_orcamento ?? c.valor) || 0;
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const getParam = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) || "";
  const aba = getParam("aba") === "medico" ? "medico" : "comercial";
  const abaHref = (target: string) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      const val = Array.isArray(v) ? v[0] : v;
      if (val) params.set(k, val);
    });
    params.set("aba", target);
    return `?${params.toString()}`;
  };

  const supabase = await createClient();

  const [{ data: repsRaw }, { data: cotsRaw }] = await Promise.all([
    supabase.from("representantes_comerciais").select("id, nome, meta_sugerida").order("nome"),
    supabase
      .from("cotacoes_comerciais")
      .select(
        "representante_id, medico_nome, paciente_nome, procedimento, grupo_procedimento, convenio, hospital, uf_hospital, valor, valor_orcamento, valor_final, etapa, em_aberto, mes_referencia, data_vencimento_cotacao, status_pedido_cirurgico, status_pedido_cirurgico2, status_final"
      ),
  ]);

  const representantes = (repsRaw || []) as { id: string; nome: string; meta_sugerida: number | string }[];
  const cotacoes = ((cotsRaw || []) as Cotacao[]).map((c) => ({ ...c, valor: valorEfetivo(c) }));

  // ── Meses disponíveis + mês de referência selecionado ──────────────
  const monthKeys = Array.from(
    new Set(cotacoes.map((c) => monthKey(c.mes_referencia)).filter((k): k is string => !!k))
  ).sort();
  if (!monthKeys.length) {
    const now = new Date();
    monthKeys.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  }
  const mesParam = getParam("mes");
  const mesRef = monthKeys.includes(mesParam) ? mesParam : monthKeys[monthKeys.length - 1];

  // ── Filtros de entidade (não incluem o mês) ────────────────────────
  const fRep = getParam("representante");
  const fProc = getParam("procedimento");
  const fMed = getParam("medico");
  const fConv = getParam("convenio");
  const fHosp = getParam("hospital");
  const fUf = getParam("uf");

  const entityMatch = (c: Cotacao) =>
    (!fRep || c.representante_id === fRep) &&
    (!fProc || c.procedimento === fProc) &&
    (!fMed || c.medico_nome === fMed) &&
    (!fConv || c.convenio === fConv) &&
    (!fHosp || c.hospital === fHosp) &&
    (!fUf || c.uf_hospital === fUf);

  const cotsFiltradas = cotacoes.filter(entityMatch);

  // ── Opções dos filtros ─────────────────────────────────────────────
  const distinct = (arr: (string | null)[]): FiltroOpcao[] =>
    Array.from(new Set(arr.filter((v): v is string => !!v)))
      .sort()
      .map((v) => ({ value: v, label: v }));

  const opcoes = {
    meses: monthKeys.map((k) => ({ value: k, label: mesLabel(k) })),
    representantes: representantes.map((r) => ({ value: r.id, label: r.nome })),
    procedimentos: distinct(cotacoes.map((c) => c.procedimento)),
    medicos: distinct(cotacoes.map((c) => c.medico_nome)),
    convenios: distinct(cotacoes.map((c) => c.convenio)),
    hospitais: distinct(cotacoes.map((c) => c.hospital)),
    ufs: distinct(cotacoes.map((c) => c.uf_hospital)),
  };

  // ── Agregação por representante ─────────────────────────────────────
  const isRealizadaNoMes = (c: Cotacao) => c.etapa === "cirurgia_realizada" && monthKey(c.mes_referencia) === mesRef;
  const isAgendadaNoMes = (c: Cotacao) => c.etapa === "agendamento" && monthKey(c.mes_referencia) === mesRef;
  const isCotacaoAberta = (c: Cotacao) => c.etapa === "cotacao" && c.em_aberto !== false;
  const isAutorizacaoAberta = (c: Cotacao) => c.etapa === "autorizacao" && c.em_aberto !== false;

  const repsExibidos = fRep ? representantes.filter((r) => r.id === fRep) : representantes;

  const linhas = repsExibidos.map((rep) => {
    const rows = cotsFiltradas.filter((c) => c.representante_id === rep.id);
    const realizadas = rows.filter(isRealizadaNoMes);
    const agendadas = rows.filter(isAgendadaNoMes);
    const cotacoesAbertas = rows.filter(isCotacaoAberta);
    const autorizacoesAbertas = rows.filter(isAutorizacaoAberta);

    const meta = Number(rep.meta_sugerida) || 0;
    const parcial = realizadas.reduce((s, c) => s + Number(c.valor), 0);
    const agend = agendadas.reduce((s, c) => s + Number(c.valor), 0);
    const fechParcial = parcial + agend;

    const medicosNomesRep = Array.from(new Set(rows.map((c) => c.medico_nome).filter((v): v is string => !!v)));
    const medicos = medicosNomesRep
      .map((nome) => {
        const medRows = rows.filter((c) => c.medico_nome === nome);
        const medParcial = medRows.filter(isRealizadaNoMes).reduce((s, c) => s + Number(c.valor), 0);
        const medAgend = medRows.filter(isAgendadaNoMes).reduce((s, c) => s + Number(c.valor), 0);
        return { nome, parcial: medParcial, agend: medAgend, fechParcial: medParcial + medAgend };
      })
      .filter((m) => m.fechParcial > 0)
      .sort((a, b) => b.fechParcial - a.fechParcial);

    return {
      id: rep.id,
      nome: rep.nome,
      meta,
      parcial,
      agend,
      fechParcial,
      pctMeta: pct(fechParcial, meta),
      cirurgias: realizadas.length,
      positivados: new Set(realizadas.map((c) => c.medico_nome).filter(Boolean)).size,
      carteira: new Set(rows.map((c) => c.medico_nome).filter(Boolean)).size,
      cotAVencer: cotacoesAbertas.filter((c) => c.data_vencimento_cotacao).length,
      medicos,
      pipe: {
        cotacoesN: cotacoesAbertas.length,
        cotacoesV: cotacoesAbertas.reduce((s, c) => s + Number(c.valor), 0),
        autorizacoesN: autorizacoesAbertas.length,
        autorizacoesV: autorizacoesAbertas.reduce((s, c) => s + Number(c.valor), 0),
        agendamentosN: agendadas.length,
        agendamentosV: agend,
        cirurgiasN: realizadas.length,
        cirurgiasV: parcial,
      },
    };
  });

  const perf = [...linhas].sort((a, b) => b.fechParcial - a.fechParcial);
  const pipeline = [...linhas].sort((a, b) => b.pipe.cotacoesV - a.pipe.cotacoesV);

  // ── Totais / KPIs ───────────────────────────────────────────────────
  const totalMeta = linhas.reduce((s, l) => s + l.meta, 0);
  const totalParcial = linhas.reduce((s, l) => s + l.parcial, 0);
  const totalFech = linhas.reduce((s, l) => s + l.fechParcial, 0);
  const totalCirurgias = linhas.reduce((s, l) => s + l.cirurgias, 0);
  const totalCotAVencer = linhas.reduce((s, l) => s + l.cotAVencer, 0);
  const totalCotAVencerV = cotsFiltradas
    .filter((c) => isCotacaoAberta(c) && c.data_vencimento_cotacao)
    .reduce((s, c) => s + Number(c.valor), 0);
  const totalPositivados = new Set(
    cotsFiltradas.filter(isRealizadaNoMes).map((c) => c.medico_nome).filter(Boolean)
  ).size;
  const ticketMedio = totalCirurgias > 0 ? totalParcial / totalCirurgias : 0;

  const totPipe = {
    cotacoesN: linhas.reduce((s, l) => s + l.pipe.cotacoesN, 0),
    cotacoesV: linhas.reduce((s, l) => s + l.pipe.cotacoesV, 0),
    autorizacoesN: linhas.reduce((s, l) => s + l.pipe.autorizacoesN, 0),
    autorizacoesV: linhas.reduce((s, l) => s + l.pipe.autorizacoesV, 0),
    agendamentosN: linhas.reduce((s, l) => s + l.pipe.agendamentosN, 0),
    agendamentosV: linhas.reduce((s, l) => s + l.pipe.agendamentosV, 0),
    cirurgiasN: linhas.reduce((s, l) => s + l.pipe.cirurgiasN, 0),
    cirurgiasV: linhas.reduce((s, l) => s + l.pipe.cirurgiasV, 0),
  };

  // ── Report Médico: funil operacional agrupado por médico ───────────
  const medicosNomes = Array.from(new Set(cotsFiltradas.map((c) => c.medico_nome).filter((v): v is string => !!v)));
  const linhasMedico: MedicoLinha[] = medicosNomes
    .map((nome) => {
      const rows = cotsFiltradas.filter((c) => c.medico_nome === nome);
      const contagem: Record<StatusPedido, number> = {
        solicitado: 0,
        protocolado: 0,
        autorizado: 0,
        pendencia_agendamento: 0,
        cirurgia_realizada: 0,
        perdido: 0,
        outros: 0,
      };
      rows.forEach((c) => {
        const bucket = bucketStatusPedido(c);
        if (bucket) contagem[bucket]++;
      });
      return {
        nome,
        ...contagem,
        total: rows.length,
        valorCirurgiasRealizadas: rows
          .filter((c) => bucketStatusPedido(c) === "cirurgia_realizada")
          .reduce((s, c) => s + Number(c.valor), 0),
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── Série do gráfico (histórico de cirurgias realizadas) ────────────
  const serie: EvolucaoPonto[] = monthKeys.map((k) => {
    const doMes = cotsFiltradas.filter((c) => c.etapa === "cirurgia_realizada" && monthKey(c.mes_referencia) === k);
    return { mes: mesLabel(k), valor: doMes.reduce((s, c) => s + Number(c.valor), 0), qtde: doMes.length };
  });

  const mesRefLabel = mesLabel(mesRef);
  const topRep = perf.find((l) => l.fechParcial > 0);
  const atualDate = new Date().toLocaleDateString("pt-BR");

  const kpis = [
    {
      dot: "bg-primary-container",
      label: "META SUGERIDA",
      value: fmtCompact(totalMeta),
      sub: `${representantes.length} representantes`,
    },
    {
      dot: "bg-emerald-500",
      label: `PARCIAL · ${mesRefLabel}`,
      value: fmtCompact(totalParcial),
      sub: `${pct(totalParcial, totalMeta)}% da meta`,
      accent: "border-l-4 border-emerald-500",
    },
    {
      dot: "bg-gynmed-dark",
      label: "FECH. PARCIAL",
      value: fmtCompact(totalFech),
      sub: `${pct(totalFech, totalMeta)}% da meta · Cir.totais + Agend.`,
      accent: "border-l-4 border-gynmed-dark",
    },
    {
      dot: "bg-amber-500",
      label: `CIRURGIAS · ${mesRefLabel}`,
      value: totalCirurgias.toString(),
      sub: `${totalPositivados} médicos positivados`,
    },
  ];

  return (
    <div className="space-y-8 pb-4">
      {/* ── Cabeçalho ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-gynmed-dark">Relatórios</h1>
          <p className="text-sm text-slate-500">Acompanhe metas, pipeline e evolução comercial em um só lugar.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] font-medium text-slate-400">Última atualização</p>
            <p className="text-sm font-bold text-gynmed-dark">{atualDate}</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-gynmed-dark px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90">
            <span className="material-symbols-outlined text-lg">sync</span>
            Atualizar dados
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-tertiary-container px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90">
            <span className="material-symbols-outlined text-lg">save</span>
            Salvar dashboard
          </button>
        </div>
      </header>

      {/* ── Abas ──────────────────────────────────────────────────── */}
      <div className="flex gap-8 border-b border-outline-variant/20">
        <a
          href={abaHref("comercial")}
          className={
            aba === "comercial"
              ? "border-b-2 border-primary px-1 pb-3 text-sm font-bold text-primary"
              : "px-1 pb-3 text-sm font-semibold text-slate-400 hover:text-slate-600"
          }
        >
          Dashboard Comercial
        </a>
        <a
          href={abaHref("medico")}
          className={
            aba === "medico"
              ? "border-b-2 border-primary px-1 pb-3 text-sm font-bold text-primary"
              : "px-1 pb-3 text-sm font-semibold text-slate-400 hover:text-slate-600"
          }
        >
          Report Médico
        </a>
      </div>

      {/* ── Filtros ───────────────────────────────────────────────── */}
      <DashboardFiltros
        meses={opcoes.meses}
        representantes={opcoes.representantes}
        procedimentos={opcoes.procedimentos}
        medicos={opcoes.medicos}
        convenios={opcoes.convenios}
        hospitais={opcoes.hospitais}
        ufs={opcoes.ufs}
        atual={{
          mes: mesRef,
          representante: fRep,
          procedimento: fProc,
          medico: fMed,
          convenio: fConv,
          hospital: fHosp,
          uf: fUf,
        }}
      />

      {aba === "medico" && <ReportMedicoTable linhas={linhasMedico} mesRefLabel={mesRefLabel} />}

      {aba === "comercial" && (
      <>
      {/* ── KPIs ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border border-outline-variant/5 bg-surface-container-lowest p-6 shadow-sm ${k.accent || ""}`}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${k.dot}`} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k.label}</span>
            </div>
            <h3 className="font-headline text-3xl font-black text-gynmed-dark">{k.value}</h3>
            <p className="mt-1 text-xs font-medium text-slate-500">{k.sub}</p>
          </div>
        ))}
      </section>

      {/* ── Gráfico Evolução ──────────────────────────────────────── */}
      <section className="rounded-xl border border-outline-variant/5 bg-surface-container-lowest p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="font-headline text-lg font-bold text-gynmed-dark">Evolução mês a mês · Cirurgias realizadas</h3>
            <p className="text-sm text-slate-500">Valor de cirurgias totais (barras) e quantidade de cirurgias (linha)</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-gynmed-dark">
              <span className="h-2 w-2 rounded-sm bg-gynmed-dark" /> Valor R$
            </span>
            <span className="flex items-center gap-1.5 text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Qtde cirurgias
            </span>
          </div>
        </div>
        <EvolucaoChart data={serie} />
      </section>

      {/* ── Performance por Representante ──────────────────────────── */}
      <PerformanceRepresentanteTable linhas={linhas} mesRefLabel={mesRefLabel} />

      {/* ── Pipeline Comercial por Representante ───────────────────── */}
      <section className="overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
        <div className="p-6">
          <h3 className="font-headline text-lg font-bold text-gynmed-dark">Pipeline Comercial por Representante</h3>
          <p className="text-sm text-slate-500">
            Cotações/Autorizações = snapshot atual · Agend./Cirurgias = mês {mesRefLabel}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-y border-outline-variant/10 bg-slate-50">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Representante</th>
                <th className="px-6 py-3 text-right">Cotações em aberto</th>
                <th className="px-6 py-3 text-right">Autorizações em aberto</th>
                <th className="px-6 py-3 text-right">Agendamentos · {mesRefLabel}</th>
                <th className="px-6 py-3 text-right">Cirurgias realizadas · {mesRefLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pipeline.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Nenhum dado de pipeline disponível.
                  </td>
                </tr>
              )}
              {pipeline.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-semibold text-slate-700">{l.nome}</td>
                  <PipeCell valor={l.pipe.cotacoesV} qtde={l.pipe.cotacoesN} />
                  <PipeCell valor={l.pipe.autorizacoesV} qtde={l.pipe.autorizacoesN} />
                  <PipeCell valor={l.pipe.agendamentosV} qtde={l.pipe.agendamentosN} />
                  <PipeCell valor={l.pipe.cirurgiasV} qtde={l.pipe.cirurgiasN} />
                </tr>
              ))}
            </tbody>
            {pipeline.length > 0 && (
              <tfoot className="border-t-2 border-outline-variant/20 bg-slate-50 text-sm font-bold text-gynmed-dark">
                <tr>
                  <td className="px-6 py-3">Total (seleção)</td>
                  <PipeCell valor={totPipe.cotacoesV} qtde={totPipe.cotacoesN} bold />
                  <PipeCell valor={totPipe.autorizacoesV} qtde={totPipe.autorizacoesN} bold />
                  <PipeCell valor={totPipe.agendamentosV} qtde={totPipe.agendamentosN} bold />
                  <PipeCell valor={totPipe.cirurgiasV} qtde={totPipe.cirurgiasN} bold />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* ── Insights Automáticos ──────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Insights Automáticos</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <InsightCard
            accent="border-emerald-500"
            title="Atingimento"
            titleColor="text-emerald-600"
            text={`Parcial de ${fmtFull(totalParcial)} sobre meta de ${fmtFull(totalMeta)} (${pct(totalParcial, totalMeta)}%). Fechamento parcial em ${fmtFull(totalFech)} (${pct(totalFech, totalMeta)}%). Faltam ${fmtFull(Math.max(0, totalMeta - totalFech))}.`}
          />
          <InsightCard
            accent="border-tertiary"
            title="Positivação Médica"
            titleColor="text-tertiary"
            text={`${totalPositivados} médico(s) positivado(s) no mês (realizaram cirurgia)${topRep ? `, com ${topRep.nome} liderando o fechamento (${fmtFull(topRep.fechParcial)})` : ""}. Recuperar médicos sem cirurgia no mês amplia o share.`}
          />
          <InsightCard
            accent="border-amber-400"
            title="Ticket Médio"
            titleColor="text-amber-500"
            text={`Cada cirurgia do recorte vale em média ${fmtFull(ticketMedio)} (${totalCirurgias} cirurgia(s)). Procedimentos de maior complexidade costumam puxar o ticket para cima.`}
          />
          <InsightCard
            accent="border-primary-container"
            title="Geração de Demanda"
            titleColor="text-primary"
            text={`Funil com ${totalCotAVencer} cotação(ões) a vencer (${fmtFull(totalCotAVencerV)}). Manter entrada constante de cotações garante volume recorrente nos próximos meses.`}
          />
        </div>
      </section>

      <p className="pt-2 text-center text-[10px] leading-relaxed text-slate-400">
        GYNMED Distribuidora · Parcial = cirurgias realizadas do mês · Fech. Parcial = Parcial + Agendamentos do mês ·
        Positivados = médicos distintos com cirurgia no mês · Meta = coluna &quot;Meta sugerida&quot;.
      </p>
      </>
      )}
    </div>
  );
}

// ── Subcomponentes de célula ──────────────────────────────────────────
function PipeCell({ valor, qtde, bold }: { valor: number; qtde: number; bold?: boolean }) {
  if (!qtde && !valor) {
    return (
      <td className="px-6 py-3 text-right text-slate-300">—</td>
    );
  }
  return (
    <td className="px-6 py-3 text-right">
      <p className={bold ? "font-bold text-gynmed-dark" : "font-semibold text-slate-700"}>{fmtCompact(valor)}</p>
      <p className="text-[10px] font-medium text-slate-400">{qtde}</p>
    </td>
  );
}

function InsightCard({
  accent,
  title,
  titleColor,
  text,
}: {
  accent: string;
  title: string;
  titleColor: string;
  text: string;
}) {
  return (
    <div className={`rounded-xl border-l-4 ${accent} border-y border-r border-outline-variant/5 bg-surface-container-lowest p-5 shadow-sm`}>
      <p className={`mb-2 text-[11px] font-bold uppercase tracking-wider ${titleColor}`}>{title}</p>
      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
