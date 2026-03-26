"use client";

export default function ConfiguracoesPage() {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <header className="mb-10">
        <h1 className="text-3xl font-headline font-extrabold text-gynmed-dark tracking-tight mb-2">Configurações do Sistema</h1>
        <p className="text-slate-500 font-body">Gerencie suas preferências pessoais e configurações de conta.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Vertical Tabs */}
        <aside className="lg:col-span-3">
          <nav className="flex flex-col gap-2 p-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
            <button className="flex items-center gap-3 px-4 py-3 bg-white text-primary rounded-lg font-semibold shadow-sm text-sm text-left transition-all">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              Perfil do Usuário
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white/50 rounded-lg text-sm text-left transition-all">
              <span className="material-symbols-outlined text-xl">notifications</span>
              Notificações
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white/50 rounded-lg text-sm text-left transition-all">
              <span className="material-symbols-outlined text-xl">security</span>
              Segurança
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white/50 rounded-lg text-sm text-left transition-all">
              <span className="material-symbols-outlined text-xl">hub</span>
              Integrações
            </button>
          </nav>

          {/* Support Card */}
          <div className="mt-8 p-6 rounded-xl bg-primary-container text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Suporte Gynmed</h3>
              <p className="text-xs opacity-90 leading-relaxed mb-4">Precisa de ajuda com as configurações avançadas da clínica?</p>
              <button className="bg-white text-primary text-[10px] font-bold py-2 px-4 rounded-full uppercase tracking-wider">Falar com Consultor</button>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">contact_support</span>
            </div>
          </div>
        </aside>

        {/* Profile Content */}
        <section className="lg:col-span-9 space-y-8">
          {/* Profile Card */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/5 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner bg-primary-fixed flex items-center justify-center">
                  <span className="text-3xl font-headline font-bold text-primary">MS</span>
                </div>
                <button className="absolute bottom-0 right-0 bg-primary-container text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-gynmed-dark mb-1">Perfil Profissional</h2>
                <p className="text-slate-400 text-sm mb-4 font-body">As informações abaixo serão exibidas em seus laudos e receitas.</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="bg-tertiary-container/10 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Verificado</span>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Premium Access</span>
                </div>
              </div>
            </div>
            <div className="p-8">
              <form className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nome Completo</label>
                  <input className="w-full bg-surface-container-low border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all" type="text" defaultValue="Dra. Mariana Silva Ferreira" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">E-mail Profissional</label>
                  <input className="w-full bg-surface-container-low border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all" type="email" defaultValue="mariana.silva@gynmed.com.br" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">CRM/Registro</label>
                  <input className="w-full bg-surface-container-low border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all" type="text" defaultValue="CRM-SP 123456" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Especialidade</label>
                  <select className="w-full bg-surface-container-low border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container transition-all appearance-none">
                    <option selected>Ginecologia e Obstetrícia</option>
                    <option>Mastologia</option>
                    <option>Endocrinologia Ginecológica</option>
                    <option>Reprodução Humana</option>
                  </select>
                </div>
                <div className="md:col-span-2 pt-6 border-t border-slate-100 flex justify-end gap-4">
                  <button className="px-6 py-2.5 text-slate-500 text-sm font-semibold hover:bg-slate-50 rounded-lg transition-colors" type="button">Descartar</button>
                  <button className="bg-primary-container text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all" type="submit">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>

          {/* System Preferences */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/5 p-8">
            <h3 className="text-xl font-bold text-gynmed-dark mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined">tune</span>
              Preferências do Sistema
            </h3>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Tema Visual</p>
                  <p className="text-xs text-slate-500">Escolha como a interface deve ser exibida.</p>
                </div>
                <div className="flex bg-surface-container-high p-1 rounded-lg">
                  <button className="px-4 py-1.5 bg-white shadow-sm rounded-md text-xs font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">light_mode</span>
                    Claro
                  </button>
                  <button className="px-4 py-1.5 text-slate-500 text-xs font-bold flex items-center gap-2 hover:text-slate-700">
                    <span className="material-symbols-outlined text-sm">dark_mode</span>
                    Escuro
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Idioma</p>
                  <p className="text-xs text-slate-500">Defina o idioma das ferramentas clínicas.</p>
                </div>
                <select className="bg-white border-outline-variant/20 rounded-lg text-xs font-bold text-slate-700 px-4 py-2 pr-10">
                  <option selected>Português (Brasil)</option>
                  <option>English (US)</option>
                  <option>Español</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Auto-Save de Prontuários</p>
                  <p className="text-xs text-slate-500">Salva automaticamente a cada 2 minutos.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
                </label>
              </div>
            </div>
          </div>

          {/* Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between group cursor-pointer overflow-hidden relative">
              <div className="relative z-10">
                <span className="text-primary-container font-bold text-[10px] uppercase tracking-widest mb-2 block">Assinatura</span>
                <h4 className="font-bold text-lg mb-1">Gynmed Pro Annual</h4>
                <p className="text-slate-400 text-xs">Vence em 15 de Dezembro, 2024</p>
                <button className="mt-4 flex items-center gap-2 text-xs font-bold text-white group-hover:gap-3 transition-all">
                  Gerenciar Plano
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <span className="material-symbols-outlined text-6xl text-white/5 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform">workspace_premium</span>
            </div>
            <div className="p-6 bg-white border border-outline-variant/20 rounded-2xl flex items-center justify-between group cursor-pointer shadow-sm">
              <div>
                <span className="text-error font-bold text-[10px] uppercase tracking-widest mb-2 block">Segurança Crítica</span>
                <h4 className="font-bold text-lg text-slate-900 mb-1">Backup na Nuvem</h4>
                <p className="text-slate-500 text-xs">Último backup: Hoje, 08:45 AM</p>
                <button className="mt-4 flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all">
                  Forçar Sincronização
                  <span className="material-symbols-outlined text-sm">sync</span>
                </button>
              </div>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-3xl">cloud_done</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
