"use client";

const kpiCards = [
  { icon: "assignment", label: "Total de Solicitações", value: "1.284", change: "+12%", changeColor: "text-emerald-500", bgColor: "bg-blue-50", iconColor: "text-blue-600", hoverBg: "group-hover:bg-primary group-hover:text-white" },
  { icon: "medical_services", label: "Cirurgias Realizadas", value: "452", change: "+5.2%", changeColor: "text-emerald-500", bgColor: "bg-teal-50", iconColor: "text-teal-600", hoverBg: "group-hover:bg-tertiary group-hover:text-white" },
  { icon: "pending_actions", label: "Aguardando Autorização", value: "86", change: "-2.4%", changeColor: "text-orange-500", bgColor: "bg-orange-50", iconColor: "text-orange-600", hoverBg: "group-hover:bg-orange-500 group-hover:text-white" },
  { icon: "analytics", label: "Taxa de Conversão", value: "74.2%", change: "+8%", changeColor: "text-emerald-500", bgColor: "bg-blue-50", iconColor: "text-blue-700", hoverBg: "group-hover:bg-primary-container group-hover:text-white" },
];

const months = [
  { label: "JAN", height: "60%", highlight: false },
  { label: "FEV", height: "45%", highlight: false },
  { label: "MAR", height: "75%", highlight: false },
  { label: "ABR", height: "85%", highlight: true },
  { label: "MAI", height: "40%", highlight: false },
  { label: "JUN", height: "55%", highlight: false },
];

const tableData = [
  { procedimento: "Parto Cesariana", medico: "Dra. Mariana Silva", data: "22/05/2024", status: "CONCLUÍDO", statusColor: "bg-tertiary-fixed text-on-tertiary-fixed", valor: "R$ 12.500,00" },
  { procedimento: "Histeroscopia", medico: "Dr. Ricardo Souza", data: "21/05/2024", status: "EM ANÁLISE", statusColor: "bg-secondary-container text-on-secondary-container", valor: "R$ 4.200,00" },
  { procedimento: "Consulta Pré-Natal", medico: "Dra. Mariana Silva", data: "20/05/2024", status: "CONCLUÍDO", statusColor: "bg-tertiary-fixed text-on-tertiary-fixed", valor: "R$ 450,00" },
];

export default function RelatoriosPage() {
  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 py-8">
        <div>
          <nav className="flex text-xs text-slate-400 mb-2 gap-2 items-center">
            <span>Início</span>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-primary font-medium">Relatórios e Indicadores</span>
          </nav>
          <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Relatórios e Indicadores</h1>
          <p className="text-slate-500 mt-1 font-body text-sm">Visualize o desempenho clínico e operacional da unidade.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-secondary font-semibold text-sm rounded-lg border border-outline-variant/20 shadow-sm hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
            Exportar PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white text-secondary font-semibold text-sm rounded-lg border border-outline-variant/20 shadow-sm hover:bg-surface-container-low transition-all">
            <span className="material-symbols-outlined text-lg">table_view</span>
            Exportar Excel
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="mb-8 bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Período</label>
            <div className="flex items-center bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">calendar_month</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-full font-medium" type="text" defaultValue="01 Jan - 31 Jan, 2024" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Médico</label>
            <select className="bg-surface-container-low border-outline-variant/20 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary">
              <option>Todos os Médicos</option>
              <option>Dra. Mariana Silva</option>
              <option>Dr. Ricardo Souza</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Procedimento</label>
            <select className="bg-surface-container-low border-outline-variant/20 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary">
              <option>Todos os Procedimentos</option>
              <option>Cesariana</option>
              <option>Ginecologia Geral</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Status</label>
            <select className="bg-surface-container-low border-outline-variant/20 rounded-lg text-sm font-medium focus:ring-primary focus:border-primary">
              <option>Todos Status</option>
              <option>Concluído</option>
              <option>Em Aberto</option>
            </select>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => (
          <div key={card.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/5 group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 ${card.bgColor} ${card.iconColor} rounded-lg ${card.hoverBg} transition-colors`}>
                <span className="material-symbols-outlined">{card.icon}</span>
              </div>
              <span className={`text-[11px] font-bold ${card.changeColor} ${card.changeColor === "text-emerald-500" ? "bg-emerald-50" : "bg-orange-50"} px-2 py-0.5 rounded-full`}>{card.change}</span>
            </div>
            <p className="text-slate-500 text-xs font-medium mb-1 uppercase tracking-tighter">{card.label}</p>
            <h3 className="text-2xl font-headline font-bold text-slate-800">{card.value}</h3>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-bold text-lg text-gynmed-dark">Solicitações por Mês</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-[10px] font-bold rounded-full bg-surface-container-high text-slate-600">2023</button>
              <button className="px-3 py-1 text-[10px] font-bold rounded-full bg-primary-container text-white">2024</button>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4 px-2">
            {months.map((m) => (
              <div key={m.label} className="flex flex-col items-center flex-1 gap-2">
                <div className="w-full bg-slate-100 rounded-t-md relative group h-full">
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-all ${m.highlight ? "bg-primary-container shadow-lg shadow-primary/10" : "bg-slate-200 group-hover:bg-primary/20"}`}
                    style={{ height: m.height }}
                  />
                </div>
                <span className={`text-[10px] font-bold ${m.highlight ? "text-primary" : "text-slate-400"}`}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/5 flex flex-col items-center">
          <h3 className="font-headline font-bold text-lg text-gynmed-dark w-full text-left mb-8">Distribuição por Status</h3>
          <div className="relative w-48 h-48 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="60, 100" strokeLinecap="round" strokeWidth="4" />
              <path className="text-tertiary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="25, 100" strokeDashoffset="-60" strokeLinecap="round" strokeWidth="4" />
              <path className="text-orange-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-85" strokeLinecap="round" strokeWidth="4" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-headline font-black text-gynmed-dark">100%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
            </div>
          </div>
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs font-medium text-slate-600">Concluídos</span>
              </div>
              <span className="text-xs font-bold text-slate-800">60%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="text-xs font-medium text-slate-600">Em Análise</span>
              </div>
              <span className="text-xs font-bold text-slate-800">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400" />
                <span className="text-xs font-medium text-slate-600">Pendentes</span>
              </div>
              <span className="text-xs font-bold text-slate-800">15%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Table */}
      <section className="mt-8 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/5 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="font-headline font-bold text-lg text-gynmed-dark">Relatórios Detalhados</h3>
          <button className="text-primary text-xs font-bold hover:underline">Ver tudo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-outline-variant/10">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Procedimento</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Médico Responsável</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor Estimado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4"><span className="text-sm font-semibold text-slate-800">{row.procedimento}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-[8px]">
                        {row.medico.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm text-slate-600">{row.medico}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-slate-600">{row.data}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 rounded-full ${row.statusColor} text-[10px] font-bold uppercase`}>{row.status}</span></td>
                  <td className="px-6 py-4"><span className="text-sm font-bold text-slate-800">{row.valor}</span></td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
