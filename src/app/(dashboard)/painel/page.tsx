"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";

export default function PainelPage() {
  const [stats, setStats] = useState([
    { label: "Pacientes Atendidos", value: "0", icon: "group", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Cirurgias Agendadas", value: "0", icon: "calendar_today", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pendências", value: "0", icon: "warning", color: "text-error", bg: "bg-error-container" },
    { label: "Prontuários Novos", value: "0", icon: "clinical_notes", color: "text-teal-600", bg: "bg-teal-50" },
  ]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setUserName(profile?.nome_completo?.split(" ")[0] || user.email?.split("@")[0] || "Usuário");

      let query = supabase.from("solicitacoes_cirurgia").select("*, pacientes(nome)");
      if (profile?.role === "representante") {
        query = query.eq("representante_responsavel_id", user.id);
      }

      const { data: solicitacoes } = await query;
      
      if (solicitacoes) {
        const totalPacientes = new Set(solicitacoes.map(s => s.paciente_id)).size;
        const agendadas = solicitacoes.filter(s => s.status_atual === "agendado").length;
        const pendencias = solicitacoes.filter(s => ["divergencia", "defesa", "junta_medica"].includes(s.status_atual)).length;
        
        setStats([
          { label: "Pacientes Atendidos", value: totalPacientes.toString(), icon: "group", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Cirurgias Agendadas", value: agendadas.toString(), icon: "calendar_today", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Pendências", value: pendencias.toString(), icon: "warning", color: "text-error", bg: "bg-error-container" },
          { label: "Prontuários Novos", value: "0", icon: "clinical_notes", color: "text-teal-600", bg: "bg-teal-50" },
        ]);
        
        const scheduled = solicitacoes
          .filter(s => s.data_agendamento)
          .sort((a, b) => new Date(a.data_agendamento).getTime() - new Date(b.data_agendamento).getTime())
          .slice(0, 3);
        
        setUpcomingEvents(scheduled);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-1 py-8">
        <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Painel de Controle</h1>
        <p className="text-slate-500 font-body">Bem-vindo de volta, {userName}. Aqui está o resumo do seu dia.</p>
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
            {upcomingEvents.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum evento agendado.</p>}
            {upcomingEvents.map((event) => (
              <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-primary-container/5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black leading-none">
                    {new Date(event.data_agendamento).getDate()}
                  </span>
                  <span className="text-[8px] font-bold uppercase">
                    {new Date(event.data_agendamento).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface truncate max-w-[140px]">{event.procedimento_descricao}</p>
                  <p className="text-xs text-slate-500">{event.pacientes?.nome || "Paciente"} · {new Date(event.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            <Link href="/agenda" className="w-full py-3 text-sm font-bold text-primary hover:bg-white rounded-xl transition-all text-center block">Ver Agenda Completa</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
