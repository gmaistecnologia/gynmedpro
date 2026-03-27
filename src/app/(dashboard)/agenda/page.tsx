"use client";

import { useState } from "react";

export default function AgendaPage() {
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");
  
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Agenda Médica</h1>
          <p className="text-slate-500 font-body mt-1">Gerenciamento de consultas e procedimentos cirúrgicos.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setView("mes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === "mes" ? "bg-primary-container text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Mês
          </button>
          <button 
            onClick={() => setView("semana")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === "semana" ? "bg-primary-container text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Semana
          </button>
          <button 
            onClick={() => setView("dia")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === "dia" ? "bg-primary-container text-white shadow-md shadow-primary/20" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Dia
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-bold text-gynmed-dark">Março 2026</h2>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Novo Evento</span>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-surface-container-low/30">
          {daysOfWeek.map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-[140px]">
          {/* Empty cells for starting offset (assuming March 1st is Sunday for demo) */}
          {daysInMonth.map(day => (
            <div key={day} className="p-4 border-r border-b border-slate-100 hover:bg-slate-50/50 transition-colors group cursor-pointer relative">
              <span className={`text-sm font-bold ${day === 26 ? "bg-primary-container text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md" : "text-slate-500"}`}>
                {day}
              </span>
              
              {/* Event placeholders */}
              {day === 26 && (
                <div className="mt-2 space-y-1">
                  <div className="bg-amber-100 border-l-2 border-amber-500 px-2 py-1 rounded text-[9px] font-bold text-amber-700 truncate shadow-sm">
                    09:30 - Cirurgia Helena
                  </div>
                  <div className="bg-blue-100 border-l-2 border-blue-500 px-2 py-1 rounded text-[9px] font-bold text-blue-700 truncate shadow-sm">
                    14:00 - Consulta Maria
                  </div>
                </div>
              )}
              {day === 27 && (
                <div className="mt-2">
                  <div className="bg-teal-100 border-l-2 border-teal-500 px-2 py-1 rounded text-[9px] font-bold text-teal-700 truncate shadow-sm">
                    11:00 - Retorno João
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
