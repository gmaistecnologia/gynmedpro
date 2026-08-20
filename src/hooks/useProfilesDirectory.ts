import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProfileCompleto } from '../lib/types'

type PerfilDireto = Pick<ProfileCompleto, 'id' | 'nome' | 'ativo' | 'avatar_url' | 'role'>

// Carrega todos os perfis uma única vez e expõe dois lookups: por nome (para telas que hoje só
// têm `representante_nome` em texto — Histórico, Painel Comercial) e por id (para telas que já
// têm o join com `profiles`, ex. Aprovações). Usado para sinalizar "usuário inativo" sem
// esconder o histórico das solicitações dele.
export function useProfilesDirectory() {
  const [porNome, setPorNome] = useState<Map<string, PerfilDireto>>(new Map())
  const [porId, setPorId] = useState<Map<string, PerfilDireto>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function carregar() {
      const { data } = await supabase.from('profiles').select('id, nome, ativo, avatar_url, role')
      if (!active) return
      const perfis = (data as PerfilDireto[] | null) ?? []
      setPorNome(new Map(perfis.map((p) => [p.nome, p])))
      setPorId(new Map(perfis.map((p) => [p.id, p])))
      setLoading(false)
    }
    carregar()
    return () => {
      active = false
    }
  }, [])

  return { porNome, porId, loading }
}
