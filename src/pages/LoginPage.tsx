import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha inválidos.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-surface">
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-secondary-fixed/20 blur-[100px] pointer-events-none" />

      <main className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="font-headline font-black text-4xl tracking-tighter text-gynmed-dark">Gynmed</span>
            <span className="ml-1 w-2 h-2 rounded-full bg-primary-container" />
          </div>
          <h1 className="font-headline font-bold text-xl text-secondary tracking-tight">
            Portal Comercial — Solicitações de Cirurgia
          </h1>
        </div>

        <div className="bg-surface-container-lowest elevation-ambient rounded-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1" htmlFor="email">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gynmedpro.com.br"
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1" htmlFor="password">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-12 py-3.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-secondary transition-colors"
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error-container text-on-error-container text-sm font-medium rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary-container to-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : (
                <>
                  Entrar
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-outline-variant/10 text-center">
            <p className="text-xs text-outline font-medium tracking-wide uppercase">
              Acesso restrito a profissionais autorizados
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-center px-4 gap-4">
          <p className="text-xs text-on-surface-variant font-medium">© 2026 Gynmed Digital Experience</p>
        </div>
      </main>
    </div>
  )
}
