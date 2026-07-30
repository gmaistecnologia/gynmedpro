export function Footer() {
  return (
    <footer className="w-full mt-auto flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 py-6 border-t border-outline-variant/10 bg-surface-container-lowest gap-3 text-center md:text-left">
      <div className="flex items-center gap-2">
        <span className="text-gynmed-dark font-bold text-xs uppercase tracking-widest">Gynmed Digital Experience</span>
        <span className="text-outline-variant">|</span>
        <p className="text-outline text-xs uppercase tracking-widest">© 2026. Todos os direitos reservados.</p>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-outline text-xs uppercase tracking-widest">Módulo Comercial</span>
      </div>
    </footer>
  )
}
