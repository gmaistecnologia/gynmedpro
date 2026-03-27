"use client";

import { useMemo } from "react";

export default function PainelPage() {
  const stats = [
    { label: "Pacientes Atendidos", value: "1,284", icon: "group", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Cirurgias Agendadas", value: "42", icon: "calendar_today", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pendências", value: "08", icon: "warning", color: "text-error", bg: "bg-error-container" },
    { label: "Prontuários Novos", value: "15", icon: "clinical_notes", color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-1 py-8">
        <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Painel de Controle</h1>
        <p className="text-slate-500 font-body">Bem-vindo de volta, Dr. Clinico. Aqui está o resumo do seu dia.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-50 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+12% este mês</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h2 className="text-3xl font-headline font-black text-gynmed-dark">{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-50 min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-bold text-xl text-gynmed-dark">Volume de Cirurgias</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold bg-surface-container-low text-primary rounded-lg">Semanal</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">Mensal</button>
            </div>
          </div>
          {/* Placeholder for Chart */}
          <div className="w-full h-64 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">bar_chart</span>
            <p className="text-slate-400 text-sm font-medium">Gráficos de desempenho em processamento</p>
          </div>
        </div>

        <div className="bg-primary-container/5 rounded-3xl p-8 border border-primary-container/10">
          <h3 className="font-headline font-bold text-xl text-gynmed-dark mb-6">Próximos Eventos</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-primary-container/5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">2{i}</span>
                  <span className="text-[8px] font-bold uppercase">Mar</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Consulta de Retorno</p>
                  <p className="text-xs text-slate-500">Maria Silva · 09:30</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 text-sm font-bold text-primary hover:bg-white rounded-xl transition-all">Ver Agenda Completa</button>
          </div>
        </div>
      </div>
    </div>
  );
}
