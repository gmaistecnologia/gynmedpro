"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { mockSolicitacoes, type Solicitacao } from "@/lib/mock-data";

type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  statuses: string[];
};

const columns: KanbanColumn[] = [
  { id: "solicitado", title: "Solicitado (orçamento)", color: "bg-blue-400", statuses: ["solicitado"] },
  { id: "protocolado", title: "Protocolado", color: "bg-amber-400", statuses: ["protocolado", "divergencia", "em_junta"] },
  { id: "autorizado", title: "Autorizado", color: "bg-teal-400", statuses: ["autorizado"] },
  { id: "agendado", title: "Agendado", color: "bg-primary-container", statuses: ["agendado"] },
  { id: "realizada", title: "Cirurgia Realizada", color: "bg-tertiary-container", statuses: ["realizada"] },
];

function getInitialData() {
  const data: Record<string, Solicitacao[]> = {};
  columns.forEach((col) => {
    data[col.id] = mockSolicitacoes.filter((s) =>
      col.statuses.includes(s.status)
    );
  });
  return data;
}

function KanbanCard({ sol, index }: { sol: Solicitacao; index: number }) {
  const isDivergencia = sol.status === "divergencia";
  const isAgendado = sol.status === "agendado";

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
          <div className="flex justify-between items-start mb-4">
            <span className="font-headline font-bold text-primary text-sm">{sol.codigo}</span>
            {sol.status === "divergencia" && (
              <span className="text-[10px] font-bold text-error bg-error-container px-2 py-1 rounded-lg uppercase tracking-tight">
                Divergência
              </span>
            )}
            {sol.status === "em_junta" && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-tight">
                Em Junta Médica
              </span>
            )}
            {sol.status === "solicitado" && (
              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-tight">
                Em Análise
              </span>
            )}
            {sol.status === "agendado" && (
              <div className="flex items-center gap-1 bg-primary-container/10 px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-xs text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  calendar_today
                </span>
                <span className="text-[10px] font-bold text-primary-container uppercase tracking-tight">
                  Cirurgia Agendada
                </span>
              </div>
            )}
            {sol.status === "realizada" && (
              <span className="text-[10px] font-bold text-white bg-tertiary-container px-2 py-1 rounded-lg uppercase tracking-tight">
                Realizada
              </span>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Paciente</p>
              <p className="text-sm font-semibold text-on-surface">{sol.paciente}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Médico</p>
              <p className="text-sm font-medium text-slate-600">{sol.medicoSolicitante}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Procedimento</p>
              <p className="text-sm font-medium text-slate-600">{sol.procedimento}</p>
            </div>
            {sol.dataAgendamento && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-container shadow-sm">
                  <span className="material-symbols-outlined text-lg">event</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Data Prevista</p>
                  <p className="text-xs font-bold text-slate-700">{sol.dataAgendamento}</p>
                </div>
              </div>
            )}
            {!sol.dataAgendamento && (
              <div className="flex items-center gap-2 pt-1">
                <span className="material-symbols-outlined text-slate-300 text-lg">event_note</span>
                <span className="text-xs text-slate-500">Solicitado em: {sol.dataSolicitacao}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-50 pt-4">
            <Link
              href={`/solicitacoes/${sol.id}`}
              className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              title="Ver Detalhes"
            >
              <span className="material-symbols-outlined text-xl">visibility</span>
            </Link>
            {sol.status === "autorizado" && (
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 text-white text-xs font-bold rounded-lg hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/10">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                Agendar
              </button>
            )}
            {sol.status === "divergencia" && (
              <button className="px-3 py-1 bg-primary/5 text-primary text-xs font-bold rounded-lg hover:bg-primary/10">
                Resolver
              </button>
            )}
            {sol.status === "realizada" && (
              <button className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-sm">clinical_notes</span>
                Prontuário
              </button>
            )}
            {(sol.status === "solicitado" || sol.status === "protocolado") && (
              <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">check_circle</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanPage() {
  const [boardData, setBoardData] = useState(getInitialData);

  function onDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...boardData[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId
      ? sourceCol
      : [...boardData[destination.droppableId]];

    const [moved] = sourceCol.splice(source.index, 1);

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
  }

  return (
    <>
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 py-8">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">
            <span>Painel</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-bold">Gerenciamento</span>
          </nav>
          <h1 className="font-headline font-bold text-3xl text-gynmed-dark tracking-tight">
            Gerenciamento de Solicitações (Kanban)
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container p-1 rounded-xl">
            <Link
              href="/solicitacoes"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:bg-white transition-all"
            >
              Tabela
            </Link>
            <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-primary shadow-sm transition-all">
              Kanban
            </button>
          </div>
          <button className="flex items-center gap-2 bg-primary-container text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-container/20 hover:scale-[1.02] active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Novo Atendimento</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-wrap items-center gap-6 mb-8">
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Paciente</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-1 focus:ring-primary" placeholder="Nome do paciente" type="text" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Médico Responsável</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">medical_services</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-1 focus:ring-primary" placeholder="Dr. Nome" type="text" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">calendar_today</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg text-sm focus:ring-1 focus:ring-primary" type="date" />
          </div>
        </div>
        <div className="flex items-end h-full pt-5">
          <button className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
            <span className="material-symbols-outlined text-lg">filter_alt</span>
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Kanban Board */}
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
                      <KanbanCard key={sol.id} sol={sol} index={idx} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </>
  );
}
