"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

export type EvolucaoPonto = {
  mes: string; // "JUL 26"
  valor: number; // R$ cirurgias totais
  qtde: number; // quantidade de cirurgias
};

function formatCompact(value: number) {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)} mil`;
  return `R$ ${value}`;
}

type TooltipEntry = { dataKey?: string | number; value?: number };
type TooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const valor = payload.find((p) => p.dataKey === "valor")?.value ?? 0;
  const qtde = payload.find((p) => p.dataKey === "qtde")?.value ?? 0;
  return (
    <div className="rounded-lg border border-outline-variant/20 bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-sm font-bold text-gynmed-dark">{formatCompact(valor)}</p>
      <p className="text-xs font-medium text-amber-500">{qtde} cirurgias</p>
    </div>
  );
}

export default function EvolucaoChart({ data }: { data: EvolucaoPonto[] }) {
  if (!data.length) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
        <span className="material-symbols-outlined text-4xl text-slate-300">bar_chart</span>
        <p className="text-sm font-medium text-slate-400">Sem cirurgias realizadas para exibir.</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 28, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="#eef0f2" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            yAxisId="valor"
            tickFormatter={(v) => formatCompact(v).replace("R$ ", "")}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <YAxis yAxisId="qtde" orientation="right" hide domain={[0, "dataMax + 60"]} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(11,61,94,0.04)" }} />
          <Bar yAxisId="valor" dataKey="valor" fill="#0B3D5E" radius={[3, 3, 0, 0]} maxBarSize={34} />
          <Line
            yAxisId="qtde"
            type="monotone"
            dataKey="qtde"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fff", stroke: "#f59e0b", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          >
            <LabelList dataKey="qtde" position="top" style={{ fontSize: 10, fontWeight: 700, fill: "#f59e0b" }} />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
