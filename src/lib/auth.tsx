import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { supabase } from './supabase'
import { registrarLogin } from './atividades'
import type { ProfileCompleto } from './types'

type AuthContextValue = {
  session: Session | null
  profile: ProfileCompleto | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<ProfileCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProfile(userId: string) {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (!active) return
      const perfil = data as ProfileCompleto | null
      // Conta inativada pelo admin: não deixa a sessão em pé, mesmo que o token ainda seja
      // válido — a "Sinalização de usuário inativo" (ver Configurações > Usuários) também
      // revoga o login no Supabase Auth, isto aqui cobre a sessão já aberta no navegador.
      if (perfil && perfil.ativo === false) {
        setProfile(null)
        await supabase.auth.signOut()
        toast.error('Sua conta foi desativada. Fale com o administrador.')
        return
      }
      setProfile(perfil)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setSession(session)
      userIdRef.current = session?.user.id ?? null
      if (session) {
        // Carimba o último acesso e grava a linha de auditoria (ver Registro de Atividades). A
        // função no banco ignora chamadas repetidas em menos de 5 min, então reabrir uma aba
        // não vira um "login" novo.
        registrarLogin()
        loadProfile(session.user.id).finally(() => active && setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!active) return
      setSession(session)
      userIdRef.current = session?.user.id ?? null
      if (session) {
        // Só em SIGNED_IN: TOKEN_REFRESHED dispara de hora em hora e não é um acesso novo.
        if (evento === 'SIGNED_IN') registrarLogin()
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshProfile() {
    const userId = userIdRef.current
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data as ProfileCompleto | null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
