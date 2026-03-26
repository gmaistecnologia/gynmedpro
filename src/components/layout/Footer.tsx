export default function Footer() {
  return (
    <footer className="ml-64 w-[calc(100%-16rem)] mt-auto flex flex-col md:flex-row justify-between items-center px-8 gap-4 bg-white py-8 border-t border-slate-100">
      <span className="font-body text-xs uppercase tracking-widest text-slate-400">
        © 2024 Gynmed Digital Experience. Todos os direitos reservados.
      </span>
      <div className="flex gap-8">
        <a
          className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-gynmed-dark underline underline-offset-4 opacity-80 hover:opacity-100 transition-all"
          href="#"
        >
          Privacidade
        </a>
        <a
          className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-gynmed-dark underline underline-offset-4 opacity-80 hover:opacity-100 transition-all"
          href="#"
        >
          Termos de Uso
        </a>
        <a
          className="font-body text-xs uppercase tracking-widest text-slate-400 hover:text-gynmed-dark underline underline-offset-4 opacity-80 hover:opacity-100 transition-all"
          href="#"
        >
          Suporte
        </a>
      </div>
    </footer>
  );
}
