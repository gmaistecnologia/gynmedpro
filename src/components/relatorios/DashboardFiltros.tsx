"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type FiltroOpcao = { value: string; label: string };

type Props = {
  meses: FiltroOpcao[];
  representantes: FiltroOpcao[];
  procedimentos: FiltroOpcao[];
  medicos: FiltroOpcao[];
  convenios: FiltroOpcao[];
  hospitais: FiltroOpcao[];
  ufs: FiltroOpcao[];
  atual: {
    mes: string;
    representante: string;
    procedimento: string;
    medico: string;
    convenio: string;
    hospital: string;
    uf: string;
  };
};

function Select({
  label,
  paramKey,
  options,
  value,
  onChange,
  todosLabel = "Todos",
}: {
  label: string;
  paramKey: string;
  options: FiltroOpcao[];
  value: string;
  onChange: (key: string, value: string) => void;
  todosLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(paramKey, e.target.value)}
        className="rounded-lg border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm font-medium text-slate-700 focus:border-primary focus:ring-primary"
      >
        {paramKey !== "mes" && <option value="">{todosLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function DashboardFiltros({
  meses,
  representantes,
  procedimentos,
  medicos,
  convenios,
  hospitais,
  ufs,
  atual,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function limpar() {
    const params = new URLSearchParams();
    if (atual.mes) params.set("mes", atual.mes); // preserva o mês de referência
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section className="mb-8 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        <Select label="Mês referência" paramKey="mes" options={meses} value={atual.mes} onChange={update} />
        <Select label="Representante" paramKey="representante" options={representantes} value={atual.representante} onChange={update} />
        <Select label="Procedimento" paramKey="procedimento" options={procedimentos} value={atual.procedimento} onChange={update} />
        <Select label="Médico" paramKey="medico" options={medicos} value={atual.medico} onChange={update} />
        <Select label="Convênio" paramKey="convenio" options={convenios} value={atual.convenio} onChange={update} />
        <Select label="Hospital" paramKey="hospital" options={hospitais} value={atual.hospital} onChange={update} />
        <Select label="UF" paramKey="uf" options={ufs} value={atual.uf} onChange={update} />
        <button
          onClick={limpar}
          className="rounded-lg border border-outline-variant/20 bg-white px-4 py-2 text-sm font-semibold text-secondary shadow-sm transition-all hover:bg-surface-container-low"
        >
          Limpar
        </button>
      </div>
    </section>
  );
}
