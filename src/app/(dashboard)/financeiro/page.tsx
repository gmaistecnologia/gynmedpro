"use client";

export default function FinanceiroPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center animate-pulse">
        <span className="material-symbols-outlined text-5xl text-slate-300">payments</span>
      </div>
      <h1 className="text-2xl font-headline font-bold text-gynmed-dark">Financeiro</h1>
      <p className="text-slate-500 font-body px-8 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-amber-500">engineering</span>
        Funcionalidade em construção
      </p>
    </div>
  );
}
