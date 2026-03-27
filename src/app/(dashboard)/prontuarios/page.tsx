"use client";

import { useState } from "react";

export default function ProntuariosPage() {
  const [search, setSearch] = useState("");
  
  const patients = [
    { id: "1", name: "Helena M. Oliveira", lastUpdate: "Há 2 horas", diagnosis: "Endometriose Profunda", status: "Em tratamento" },
    { id: "2", name: "Maria Clara Silva", lastUpdate: "Ontem", diagnosis: "Miomatose Uterina", status: "Pré-cirúrgico" },
    { id: "3", name: "Ana Beatriz Rocha", lastUpdate: "3 dias atrás", diagnosis: "Cisto Ovariano", status: "Acompanhamento" },
    { id: "4", name: "Júlia Mendonça", lastUpdate: "1 semana atrás", diagnosis: "Gravidez de Risco", status: "Em observação" },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-1 py-8">
        <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">Prontuários Eletrônicos</h1>
        <p className="text-slate-500 font-body">Histórico clínico detalhado e arquivos de pacientes.</p>
      </header>

      {/* Global Search */}
      <div className="relative max-w-2xl mx-auto">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-2xl">search</span>
        <input 
          type="text" 
          placeholder="Pesquisar por nome do paciente, CPF ou prontuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white rounded-[24px] shadow-xl shadow-primary/5 border-none focus:ring-2 focus:ring-primary/20 text-lg font-body placeholder:text-slate-300"
        />
      </div>

      {/* Recent Patients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {patients.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-50 hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container font-black text-lg group-hover:bg-primary group-hover:text-white transition-colors">
                {p.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-on-surface leading-tight">{p.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.lastUpdate}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Diagnóstico Principal</p>
                <p className="text-xs font-bold text-slate-600 line-clamp-1">{p.diagnosis}</p>
              </div>
              <span className="inline-block px-3 py-1 bg-surface-container-low text-primary-container rounded-lg text-[10px] font-bold uppercase tracking-tight">
                {p.status}
              </span>
            </div>

            <button className="w-full py-2.5 bg-slate-50 hover:bg-primary-container hover:text-white text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Abrir Prontuário
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="bg-surface-container-low/40 rounded-[40px] p-10 mt-12">
        <h3 className="font-headline font-bold text-xl text-gynmed-dark mb-8">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-white hover:border-primary/20 transition-all flex items-center gap-5 cursor-pointer hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">add_notes</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Nova Evolução</p>
              <p className="text-xs text-slate-500">Registrar atendimento recente</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-white hover:border-primary/20 transition-all flex items-center gap-5 cursor-pointer hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">prescriptions</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Prescrição Digital</p>
              <p className="text-xs text-slate-500">Emitir receita controlada</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-white hover:border-primary/20 transition-all flex items-center gap-5 cursor-pointer hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Anexar Exames</p>
              <p className="text-xs text-slate-500">Upload de PDF ou Imagens</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
