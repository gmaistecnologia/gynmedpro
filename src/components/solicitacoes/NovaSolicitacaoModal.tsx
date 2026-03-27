"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface NovaSolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NovaSolicitacaoModal({ isOpen, onClose, onSuccess }: NovaSolicitacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [hospitais, setHospitais] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    paciente_nome: "",
    medico_nome: "",
    hospital_id: "",
    procedimento: "",
    convenio: "",
    data_solicitacao: new Date().toISOString().split('T')[0],
    observacoes: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchHospitais();
    }
  }, [isOpen]);

  async function fetchHospitais() {
    const { data } = await supabase.from("hospitais").select("id, nome_hospital").order("nome_hospital");
    setHospitais(data || []);
    if (data && data.length > 0 && !formData.hospital_id) {
      setFormData(prev => ({ ...prev, hospital_id: data[0].id }));
    }
  }

  async function getOrCreatePatient(name: string, plano: string) {
    const { data: existing } = await supabase.from('pacientes').select('id').eq('nome', name).maybeSingle();
    if (existing) {
      if (plano) {
          await supabase.from('pacientes').update({ plano_saude: plano }).eq('id', existing.id);
      }
      return existing.id;
    }
    const { data: created, error } = await supabase.from('pacientes').insert({ 
      nome: name, 
      plano_saude: plano,
      cpf: `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}` 
    }).select('id').single();
    if (error) throw error;
    return created.id;
  }

  async function getOrCreateDoctor(name: string) {
    const { data: existing } = await supabase.from('medicos').select('id').eq('nome', name).maybeSingle();
    if (existing) return existing.id;
    const { data: created, error } = await supabase.from('medicos').insert({ 
      nome: name, 
      crm: `NEW-${Math.random().toString(36).substr(2, 6).toUpperCase()}` 
    }).select('id').single();
    if (error) throw error;
    return created.id;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const pId = await getOrCreatePatient(formData.paciente_nome, formData.convenio);
      const mId = await getOrCreateDoctor(formData.medico_nome);

      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const { data: newSol, error } = await supabase.from("solicitacoes_cirurgia").insert({
        numero_solicitacao: `SOL-${Date.now().toString().slice(-6)}`,
        paciente_id: pId,
        medico_solicitante_id: mId,
        hospital_id: formData.hospital_id,
        representante_responsavel_id: currentUserId,
        procedimento_descricao: formData.procedimento,
        status_atual: "solicitado",
        data_solicitacao: formData.data_solicitacao,
      }).select().single();

      if (error) throw error;

      if (formData.observacoes && newSol) {
        await supabase.from("historico_anotacoes").insert({
          solicitacao_id: newSol.id,
          usuario_id: currentUserId,
          anotacao: formData.observacoes
        });
      }

      onSuccess?.();
      onClose();
      setFormData({
        paciente_nome: "",
        medico_nome: "",
        hospital_id: hospitais[0]?.id || "",
        procedimento: "",
        convenio: "",
        data_solicitacao: new Date().toISOString().split('T')[0],
        observacoes: ""
      });
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-secondary/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-surface w-full max-w-2xl h-fit max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in duration-300 my-auto">
        <header className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
          <h2 className="font-headline font-bold text-2xl text-secondary tracking-tight">Novo Atendimento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-secondary focus:outline-none">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paciente */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">person</span> Paciente
              </label>
              <input
                required
                type="text"
                placeholder="Nome completo do paciente"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-body"
                value={formData.paciente_nome}
                onChange={e => setFormData(prev => ({ ...prev, paciente_nome: e.target.value }))}
              />
            </div>

            {/* Médico */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">person_add</span> Médico Solicitante
              </label>
              <input
                required
                type="text"
                placeholder="Nome do médico"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-body"
                value={formData.medico_nome}
                onChange={e => setFormData(prev => ({ ...prev, medico_nome: e.target.value }))}
              />
            </div>

            {/* Hospital */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">hospital</span> Hospital
              </label>
              <div className="relative">
                <select
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none font-body"
                  value={formData.hospital_id}
                  onChange={e => setFormData(prev => ({ ...prev, hospital_id: e.target.value }))}
                >
                  {hospitais.map(h => (
                    <option key={h.id} value={h.id}>{h.nome_hospital}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>

            {/* Convênio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">credit_card</span> Convênio
              </label>
              <input
                type="text"
                placeholder="Ex: Unimed, Cassi, Bradesco..."
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-body"
                value={formData.convenio}
                onChange={e => setFormData(prev => ({ ...prev, convenio: e.target.value }))}
              />
            </div>

            {/* Procedimento */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">description</span> Procedimento
              </label>
              <input
                required
                type="text"
                placeholder="Descrição resumida do procedimento"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-body"
                value={formData.procedimento}
                onChange={e => setFormData(prev => ({ ...prev, procedimento: e.target.value }))}
              />
            </div>

            {/* Data Solicitação */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span> Data da Solicitação
              </label>
              <input
                required
                type="date"
                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-body"
                value={formData.data_solicitacao}
                onChange={e => setFormData(prev => ({ ...prev, data_solicitacao: e.target.value }))}
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Observações Iniciais</label>
            <textarea
              rows={3}
              placeholder="Descreva aqui detalhes iniciais importantes..."
              className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none font-body"
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          <footer className="pt-6 sticky bottom-0 bg-surface">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] font-body"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Salvar Atendimento
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
