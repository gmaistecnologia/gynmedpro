"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AgendaPage() {
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilterType, setDateFilterType] = useState<"solicitacao" | "cirurgia">("cirurgia");
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("usuarios")
        .select("role")
        .eq("id", user.id)
        .single();

      const dateField = dateFilterType === "solicitacao" ? "data_solicitacao" : "data_cirurgia_agendada";

      let query = supabase
        .from("solicitacoes_cirurgia")
        .select("*, pacientes(nome)")
        .not(dateField, "is", null);

      if (profile?.role === "representante") {
        query = query.eq("representante_responsavel_id", user.id);
      }

      const { data } = await query;
      setEvents(data || []);
      setLoading(false);
    }
    fetchEvents();
  }, [dateFilterType]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const calendarDays = [];
  // Days from previous month to fill the first week
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-8">
        <div>
          <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Agenda Médica</h1>
          <p className="text-slate-500 font-body mt-1">Gerenciamento de consultas e procedimentos cirúrgicos.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Type Filter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDateFilterType("cirurgia")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                dateFilterType === "cirurgia" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Data Cirurgia
            </button>
            <button
              onClick={() => setDateFilterType("solicitacao")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                dateFilterType === "solicitacao" 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Data Solicitação
            </button>
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
        </div>
      </header>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-bold text-gynmed-dark">{monthNames[month]} {year}</h2>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
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
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="p-4 border-r border-b border-slate-100 bg-slate-50/20"></div>;
            }

            const dateField = dateFilterType === "solicitacao" ? "data_solicitacao" : "data_cirurgia_agendada";
            const dayEvents = events.filter(e => {
              const d = new Date(e[dateField]);
              return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            });
            
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div key={day} className="p-4 border-r border-b border-slate-100 hover:bg-slate-50/50 transition-colors group cursor-pointer relative">
                <span className={`text-sm font-bold ${isToday ? "bg-primary-container text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md" : "text-slate-500"}`}>
                  {day}
                </span>
                
                <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  {dayEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className={`border-l-2 px-2 py-1 rounded text-[9px] font-bold truncate shadow-sm ${
                        event.status_atual === 'cirurgia_realizada' ? 'bg-green-100 border-green-500 text-green-700' :
                        event.status_atual === 'agendado' ? 'bg-primary-container/10 border-primary-container text-primary-container' : 
                        'bg-amber-100 border-amber-500 text-amber-700'
                      }`}
                    >
                      {new Date(event[dateField]).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {event.pacientes?.nome?.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
