"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/solicitacoes";
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Abstract Shapes */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-secondary-fixed/20 blur-[100px] pointer-events-none" />

      {/* Main Content */}
      <main className="w-full max-w-md z-10">
        {/* Header / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="font-headline font-black text-4xl tracking-tighter text-gynmed-dark">
              Gynmed
            </span>
            <span className="ml-1 w-2 h-2 rounded-full bg-primary-container" />
          </div>
          <h1 className="font-headline font-bold text-xl text-secondary tracking-tight">
            Portal Gynmed - Solicitações de Cirurgia
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest elevation-ambient rounded-xl p-8 border border-outline-variant/10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-on-surface-variant ml-1"
                htmlFor="email"
              >
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                  id="email"
                  name="email"
                  placeholder="exemplo@gynmed.com.br"
                  type="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-on-surface-variant ml-1"
                htmlFor="password"
              >
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                </div>
                <input
                  className="block w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary-container to-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
            >
              {loading ? "Entrando..." : "Entrar"}
              {!loading && (
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-xs text-outline font-medium tracking-wide uppercase">
              Acesso restrito a profissionais autorizados
            </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 flex flex-col md:flex-row justify-between items-center px-4 gap-4">
          <p className="text-xs text-on-surface-variant font-medium">
            © 2026 Gynmed Digital Experience
          </p>
        </div>
      </main>

      {/* Visual Anchor Decorations */}
      <div className="fixed bottom-12 left-12 hidden lg:block opacity-20">
        <div className="w-32 h-32 border-l border-b border-primary-container/40 rounded-bl-3xl" />
      </div>
      <div className="fixed top-12 right-12 hidden lg:block opacity-20">
        <div className="w-32 h-32 border-r border-t border-primary-container/40 rounded-tr-3xl" />
      </div>
    </div>
  );
}
