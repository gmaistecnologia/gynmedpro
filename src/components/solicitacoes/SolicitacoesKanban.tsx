"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";

export type Solicitacao = {
  id: string;
  numero_solicitacao: string;
  status_atual: string;
  procedimento_descricao: string;
  data_solicitacao: string;
  data_agendamento?: string;
  pacientes?: { nome: string };
  medicos?: { nome: string };
};

type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  statuses: string[];
};

const columns: KanbanColumn[] = [
  { id: "solicitado", title: "Solicitado", color: "bg-blue-400", statuses: ["solicitado"] },
  { id: "protocolado", title: "Protocolado", color: "bg-amber-400", statuses: ["protocolado", "divergencia", "defesa", "junta_medica", "reiniciado"] },
  { id: "autorizado", title: "Autorizado", color: "bg-teal-400", statuses: ["autorizado", "pendencia_agendamento"] },
  { id: "agendado", title: "Agendado", color: "bg-primary-container", statuses: ["agendado"] },
  { id: "realizada", title: "Cirurgia Realizada", color: "bg-tertiary-container", statuses: ["cirurgia_realizada"] },
];

function KanbanCard({ sol, index, onOpenDetails }: { sol: Solicitacao; index: number; onOpenDetails: (id: string) => void }) {
  const isDivergencia = sol.status_atual === "divergencia";
  const isAgendado = sol.status_atual === "agendado";

  return (
    <Draggable draggableId={sol.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-surface-container-lowest p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border cursor-pointer
            ${isDivergencia ? "border-l-4 border-l-error/40 border-error/10 hover:border-error/20" : "border-transparent hover:border-primary-container/20"}
            ${isAgendado ? "border-l-4 border-l-primary-container/60" : ""}
            ${snapshot.isDragging ? "shadow-xl rotate-2 scale-105" : ""}
          `}
        >
          <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
            <span className="font-headline font-bold text-primary text-sm shrink-0">
              {sol.numero_solicitacao || `#GYN-${sol.id.split('-')[0].toUpperCase()}`}
            </span>
            {sol.status_atual === "divergencia" && (
              <span className="text-[10px] font-bold text-error bg-error-container px-2 py-1 rounded-lg uppercase tracking-tight">
                Divergência
              </span>
            )}
            {sol.status_atual === "junta_medica" && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-tight">
                Em Junta Médica
              </span>
            )}
            {sol.status_atual === "defesa" && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-tight">
                Defesa Solicitada
              </span>
            )}
            {sol.status_atual === "solicitado" && (
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-tight">
                Em Análise
              </span>
            )}
            {sol.status_atual === "agendado" && (
              <div className="flex items-center gap-1 bg-primary-container/10 px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-xs text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  calendar_today
                </span>
                <span className="text-[10px] font-bold text-primary-container uppercase tracking-tight">
                  Cirurgia Agendada
                </span>
              </div>
            )}
            {sol.status_atual === "cirurgia_realizada" && (
              <span className="text-[10px] font-bold text-white bg-tertiary-container px-2 py-1 rounded-lg uppercase tracking-tight">
                Realizada
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Paciente</p>
              <button
                onClick={() => onOpenDetails(sol.id)}
                className="text-sm font-semibold text-on-surface hover:text-primary transition-colors text-left focus:outline-none"
              >
                {sol.pacientes?.nome || "Não Informado"}
              </button>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Médico</p>
              <p className="text-sm font-medium text-slate-600">{sol.medicos?.nome || "Não Informado"}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Procedimento</p>
              <p className="text-sm font-medium text-slate-600">{sol.procedimento_descricao}</p>
            </div>
            {sol.data_agendamento && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-container shadow-sm">
                  <span className="material-symbols-outlined text-lg">event</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Data Prevista</p>
                  <p className="text-xs font-bold text-slate-700">{sol.data_agendamento}</p>
                </div>
              </div>
            )}
            {!sol.data_agendamento && (
              <div className="flex items-center gap-2 pt-1">
                <span className="material-symbols-outlined text-slate-300 text-lg">event_note</span>
                <span className="text-xs text-slate-500">Solicitado em: {new Date(sol.data_solicitacao).toLocaleDateString("pt-BR")}</span>
              </div>
            )}
          </div>

        </div>
      )}
    </Draggable>
  );
}

interface SolicitacoesKanbanProps {
  initialSolicitacoes: any[];
  onOpenDetails: (id: string) => void;
}

export default function SolicitacoesKanban({ initialSolicitacoes, onOpenDetails }: SolicitacoesKanbanProps) {
  const supabase = createClient();
  const [boardData, setBoardData] = useState<Record<string, Solicitacao[]>>({
    solicitado: [], protocolado: [], autorizado: [], agendado: [], realizada: []
  });

  useEffect(() => {
    const grouped: Record<string, Solicitacao[]> = {
      solicitado: [], protocolado: [], autorizado: [], agendado: [], realizada: []
    };

    columns.forEach((col) => {
      grouped[col.id] = (initialSolicitacoes as unknown as Solicitacao[]).filter((s) => col.statuses.includes(s.status_atual as string));
    });

    setBoardData(grouped);
  }, [initialSolicitacoes]);

  async function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...boardData[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId
      ? sourceCol
      : [...boardData[destination.droppableId]];

    const [moved] = sourceCol.splice(source.index, 1);

    const newStatus = columns.find(c => c.id === destination.droppableId)?.statuses[0] || destination.droppableId;
    const previousStatus = moved.status_atual;
    moved.status_atual = newStatus;

    if (source.droppableId === destination.droppableId) {
      sourceCol.splice(destination.index, 0, moved);
      setBoardData((prev) => ({ ...prev, [source.droppableId]: sourceCol }));
    } else {
      destCol.splice(destination.index, 0, moved);
      setBoardData((prev) => ({
        ...prev,
        [source.droppableId]: sourceCol,
        [destination.droppableId]: destCol,
      }));
    }

    // Persist to Supabase
    await supabase
      .from("solicitacoes_cirurgia")
      .update({ status_atual: newStatus })
      .eq("id", moved.id);

    // Log history
    if (previousStatus !== newStatus) {
      await supabase
        .from("historico_status")
        .insert({
          solicitacao_id: moved.id,
          status_anterior: previousStatus,
          status_novo: newStatus
        });
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-6 items-start">
        {columns.map((col) => (
          <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col gap-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="font-headline font-bold text-sm text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                {col.title}
              </h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {String(boardData[col.id]?.length || 0).padStart(2, "0")}
              </span>
            </div>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex flex-col gap-4 min-h-[200px] rounded-2xl p-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary-fixed/10" : ""}`}
                >
                  {boardData[col.id]?.map((sol, idx) => (
                    <KanbanCard key={sol.id} sol={sol} index={idx} onOpenDetails={onOpenDetails} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
