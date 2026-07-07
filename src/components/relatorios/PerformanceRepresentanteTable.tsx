"use client";

import { Fragment, useMemo, useState } from "react";

export type RepMedicoLinha = {
  nome: string;
  parcial: number;
  agend: number;
  fechParcial: number;
};

export type RepLinha = {
  id: string;
  nome: string;
  meta: number;
  parcial: number;
  agend: number;
  fechParcial: number;
  pctMeta: number;
  cirurgias: number;
  positivados: number;
  carteira: number;
  cotAVencer: number;
  medicos: RepMedicoLinha[];
};

type SortKey =
  | "nome"
  | "meta"
  | "parcial"
  | "agend"
  | "fechParcial"
  | "cirurgias"
  | "positivados"
  | "carteira"
  | "cotAVencer";

function fmtFull(v: number) {
  if (!v) return "—";
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}
function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

const COLUNAS: { key: SortKey; label: string; align: "left" | "right" | "center"; highlight?: boolean }[] = [
  { key: "nome", label: "Representante", align: "left" },
  { key: "meta", label: "Meta sugerida", align: "right" },
  { key: "parcial", label: "Parcial R$", align: "right" },
  { key: "agend", label: "Agend. R$", align: "right" },
  { key: "fechParcial", label: "Fech. parcial R$", align: "right", highlight: true },
  { key: "cirurgias", label: "Cirurgias", align: "center" },
  { key: "positivados", label: "Positivados", align: "center" },
  { key: "carteira", label: "Carteira", align: "center" },
  { key: "cotAVencer", label: "Cot. a vencer", align: "center" },
];

function Dot() {
  return <span className="text-slate-300">·</span>;
}

function Pill({ n }: { n: number }) {
  return (
    <span
      className={`inline-flex min-w-[1.75rem] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
        n > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {n}
    </span>
  );
}

export default function PerformanceRepresentanteTable({
  linhas,
  mesRefLabel,
}: {
  linhas: RepLinha[];
  mesRefLabel: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("fechParcial");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  const perf = useMemo(() => {
    const arr = [...linhas];
    arr.sort((a, b) => {
      const av = sortKey === "nome" ? a.nome : a[sortKey];
      const bv = sortKey === "nome" ? b.nome : b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [linhas, sortKey, sortDir]);

  const totalMeta = linhas.reduce((s, l) => s + l.meta, 0);
  const totalParcial = linhas.reduce((s, l) => s + l.parcial, 0);
  const totalAgend = linhas.reduce((s, l) => s + l.agend, 0);
  const totalFech = linhas.reduce((s, l) => s + l.fechParcial, 0);
  const totalCirurgias = linhas.reduce((s, l) => s + l.cirurgias, 0);
  const totalPositivados = linhas.reduce((s, l) => s + l.positivados, 0);
  const totalCotAVencer = linhas.reduce((s, l) => s + l.cotAVencer, 0);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleExpand(id: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="font-headline text-lg font-bold text-gynmed-dark">Performance por Representante</h3>
          <p className="text-sm text-slate-500">mês {mesRefLabel} · clique nos títulos para ordenar</p>
        </div>
        <span className="rounded-full bg-gynmed-dark px-3 py-1 text-[11px] font-bold text-white">
          Referência: {mesRefLabel}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-y border-outline-variant/10 bg-slate-50">
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {COLUNAS.map((col) => {
                const ativa = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-6 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${
                      ativa ? "bg-primary-fixed/30 text-gynmed-dark" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-gynmed-dark ${col.align === "right" ? "flex-row-reverse" : ""}`}
                    >
                      {col.label}
                      <span className="text-[9px]">{ativa ? (sortDir === "desc" ? "▾" : "▴") : ""}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {perf.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  Nenhum representante cadastrado. Popule <code>representantes_comerciais</code> e{" "}
                  <code>cotacoes_comerciais</code>.
                </td>
              </tr>
            )}
            {perf.map((l) => {
              const aberto = expandidos.has(l.id);
              return (
                <Fragment key={l.id}>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => l.medicos.length > 0 && toggleExpand(l.id)}
                        className="flex w-full items-center gap-2 text-left"
                        disabled={l.medicos.length === 0}
                      >
                        <span
                          className={`material-symbols-outlined text-base transition-transform ${
                            l.medicos.length === 0 ? "text-slate-200" : "text-slate-400"
                          } ${aberto ? "rotate-90" : ""}`}
                        >
                          chevron_right
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-700">{l.nome}</p>
                          {l.meta > 0 && (
                            <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${l.pctMeta >= 50 ? "bg-amber-400" : "bg-primary-container"}`}
                                style={{ width: `${Math.min(100, l.pctMeta)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-3 text-right text-slate-600">{fmtFull(l.meta)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{fmtFull(l.parcial)}</td>
                    <td className="px-6 py-3 text-right text-slate-600">{fmtFull(l.agend)}</td>
                    <td className="bg-primary-fixed/20 px-6 py-3 text-right">
                      <p className="font-bold text-gynmed-dark">{fmtFull(l.fechParcial)}</p>
                      <p className="text-[10px] font-medium text-slate-400">{l.pctMeta}% da meta</p>
                    </td>
                    <td className="px-6 py-3 text-center font-semibold text-slate-700">{l.cirurgias}</td>
                    <td className="px-6 py-3 text-center">
                      <Pill n={l.positivados} />
                    </td>
                    <td className="px-6 py-3 text-center text-slate-600">{l.carteira}</td>
                    <td className="px-6 py-3 text-center text-slate-400">{l.cotAVencer || "—"}</td>
                  </tr>
                  {aberto &&
                    l.medicos.map((m) => (
                      <tr key={`${l.id}-${m.nome}`} className="bg-slate-50/40 text-[13px]">
                        <td className="px-6 py-2 pl-12">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-300">subdirectory_arrow_right</span>
                            <span className="truncate font-medium text-primary">{m.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-right">
                          <Dot />
                        </td>
                        <td className="px-6 py-2 text-right text-slate-600">{m.parcial ? fmtFull(m.parcial) : <Dot />}</td>
                        <td className="px-6 py-2 text-right text-slate-600">{m.agend ? fmtFull(m.agend) : <Dot />}</td>
                        <td className="bg-primary-fixed/10 px-6 py-2 text-right font-bold text-gynmed-dark">
                          {fmtFull(m.fechParcial)}
                        </td>
                        <td className="px-6 py-2 text-center">
                          <Dot />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <Dot />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <Dot />
                        </td>
                        <td className="px-6 py-2 text-center">
                          <Dot />
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
          {perf.length > 0 && (
            <tfoot className="border-t-2 border-outline-variant/20 bg-slate-50 text-sm font-bold text-gynmed-dark">
              <tr>
                <td className="px-6 py-3">Total</td>
                <td className="px-6 py-3 text-right">{fmtFull(totalMeta)}</td>
                <td className="px-6 py-3 text-right">{fmtFull(totalParcial)}</td>
                <td className="px-6 py-3 text-right">{fmtFull(totalAgend)}</td>
                <td className="bg-primary-fixed/30 px-6 py-3 text-right">
                  {fmtFull(totalFech)}
                  <span className="block text-[10px] font-medium text-slate-400">{pct(totalFech, totalMeta)}% da meta</span>
                </td>
                <td className="px-6 py-3 text-center">{totalCirurgias}</td>
                <td className="px-6 py-3 text-center text-emerald-600">{totalPositivados}</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center">{totalCotAVencer || "—"}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
