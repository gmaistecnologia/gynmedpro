export type MedicoLinha = {
  nome: string;
  solicitado: number;
  protocolado: number;
  autorizado: number;
  pendencia_agendamento: number;
  cirurgia_realizada: number;
  perdido: number;
  outros: number;
  total: number;
  valorCirurgiasRealizadas: number;
};

function fmtCompact(v: number) {
  if (!v) return "—";
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000)} mil`;
  return `R$ ${Math.round(v)}`;
}

function Cell({ n }: { n: number }) {
  return <td className="px-4 py-3 text-center text-slate-600">{n || "—"}</td>;
}

export default function ReportMedicoTable({
  linhas,
  mesRefLabel,
}: {
  linhas: MedicoLinha[];
  mesRefLabel: string;
}) {
  const totais = linhas.reduce(
    (acc, l) => ({
      solicitado: acc.solicitado + l.solicitado,
      protocolado: acc.protocolado + l.protocolado,
      autorizado: acc.autorizado + l.autorizado,
      pendencia_agendamento: acc.pendencia_agendamento + l.pendencia_agendamento,
      cirurgia_realizada: acc.cirurgia_realizada + l.cirurgia_realizada,
      perdido: acc.perdido + l.perdido,
      total: acc.total + l.total,
      valor: acc.valor + l.valorCirurgiasRealizadas,
    }),
    { solicitado: 0, protocolado: 0, autorizado: 0, pendencia_agendamento: 0, cirurgia_realizada: 0, perdido: 0, total: 0, valor: 0 }
  );

  return (
    <section className="overflow-hidden rounded-xl border border-outline-variant/5 bg-surface-container-lowest shadow-sm">
      <div className="p-6">
        <h3 className="font-headline text-lg font-bold text-gynmed-dark">Report Médico · Funil operacional por médico</h3>
        <p className="text-sm text-slate-500">
          Status do pedido cirúrgico (protocolo → autorização → agendamento → cirurgia) · recorte {mesRefLabel}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-y border-outline-variant/10 bg-slate-50">
            <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-3">Médico</th>
              <th className="px-4 py-3 text-center">Solicitado</th>
              <th className="px-4 py-3 text-center">Protocolado</th>
              <th className="px-4 py-3 text-center">Autorizado</th>
              <th className="px-4 py-3 text-center">Pend. Agend.</th>
              <th className="bg-primary-fixed/30 px-4 py-3 text-center">Cirurgia Realizada</th>
              <th className="px-4 py-3 text-center">Perdidos</th>
              <th className="px-4 py-3 text-center">Total</th>
              <th className="px-6 py-3 text-right">Valor cirurgias R$</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {linhas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  Nenhum caso encontrado para este recorte.
                </td>
              </tr>
            )}
            {linhas.map((l) => (
              <tr key={l.nome} className="hover:bg-slate-50/50">
                <td className="truncate px-6 py-3 font-semibold text-slate-700">{l.nome}</td>
                <Cell n={l.solicitado} />
                <Cell n={l.protocolado} />
                <Cell n={l.autorizado} />
                <Cell n={l.pendencia_agendamento} />
                <td className="bg-primary-fixed/20 px-4 py-3 text-center font-bold text-gynmed-dark">
                  {l.cirurgia_realizada || "—"}
                </td>
                <Cell n={l.perdido} />
                <td className="px-4 py-3 text-center font-semibold text-slate-700">{l.total}</td>
                <td className="px-6 py-3 text-right text-slate-600">{fmtCompact(l.valorCirurgiasRealizadas)}</td>
              </tr>
            ))}
          </tbody>
          {linhas.length > 0 && (
            <tfoot className="border-t-2 border-outline-variant/20 bg-slate-50 text-sm font-bold text-gynmed-dark">
              <tr>
                <td className="px-6 py-3">Total</td>
                <td className="px-4 py-3 text-center">{totais.solicitado}</td>
                <td className="px-4 py-3 text-center">{totais.protocolado}</td>
                <td className="px-4 py-3 text-center">{totais.autorizado}</td>
                <td className="px-4 py-3 text-center">{totais.pendencia_agendamento}</td>
                <td className="bg-primary-fixed/30 px-4 py-3 text-center">{totais.cirurgia_realizada}</td>
                <td className="px-4 py-3 text-center">{totais.perdido}</td>
                <td className="px-4 py-3 text-center">{totais.total}</td>
                <td className="px-6 py-3 text-right">{fmtCompact(totais.valor)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
