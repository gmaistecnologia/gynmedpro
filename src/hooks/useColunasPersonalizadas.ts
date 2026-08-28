import { useCallback, useEffect, useRef, useState } from 'react'

export type ColunaPreferenciaItem<K extends string> = { key: K; visivel: boolean }

function chaveStorage(userId: string): string {
  return `gynmed:colunas-report-medico:${userId}`
}

// Reconcilia o que está salvo com o catálogo atual de colunas: descarta chaves que não existem
// mais, mantém a ordem salva pras que continuam válidas, e acrescenta no fim (visíveis por
// padrão) qualquer coluna nova que o usuário nunca viu — sem isso, uma coluna adicionada depois
// que o admin personalizou ficaria pra sempre invisível pra ele.
function reconciliar<K extends string>(
  salvo: ColunaPreferenciaItem<K>[],
  chavesValidas: K[],
): ColunaPreferenciaItem<K>[] {
  const validas = new Set(chavesValidas)
  const vistas = new Set<K>()
  const resultado: ColunaPreferenciaItem<K>[] = []
  for (const item of salvo) {
    if (validas.has(item.key) && !vistas.has(item.key)) {
      resultado.push(item)
      vistas.add(item.key)
    }
  }
  for (const key of chavesValidas) {
    if (!vistas.has(key)) resultado.push({ key, visivel: true })
  }
  return resultado
}

function padrao<K extends string>(chaves: K[]): ColunaPreferenciaItem<K>[] {
  return chaves.map((key) => ({ key, visivel: true }))
}

function carregar<K extends string>(userId: string | null, chavesPadrao: K[]): ColunaPreferenciaItem<K>[] {
  if (!userId) return padrao(chavesPadrao)
  try {
    const bruto = localStorage.getItem(chaveStorage(userId))
    if (!bruto) return padrao(chavesPadrao)
    const salvo = JSON.parse(bruto) as unknown
    if (!Array.isArray(salvo)) return padrao(chavesPadrao)
    return reconciliar(salvo as ColunaPreferenciaItem<K>[], chavesPadrao)
  } catch {
    return padrao(chavesPadrao)
  }
}

/**
 * Preferência de quais colunas aparecem e em que ordem, persistida por usuário no navegador
 * (a chave inclui o id, então a escolha de um admin não vaza pra outra conta que use o mesmo
 * computador). `userId` nulo desativa a persistência — usado quando quem está vendo a tela não
 * tem permissão de personalizar, caindo sempre no padrão.
 */
export function useColunasPersonalizadas<K extends string>(userId: string | null, chavesPadrao: K[]) {
  const [preferencia, setPreferenciaState] = useState<ColunaPreferenciaItem<K>[]>(() =>
    carregar(userId, chavesPadrao),
  )

  // `userId` normalmente já vem certo no primeiro render (ProtectedRoute só desmonta o loader
  // depois que o perfil termina de carregar), mas se algum dia isso mudar e o id só chegar depois
  // da montagem, o valor inicial acima teria rodado com userId=null. Este efeito relê assim que o
  // id muda de verdade, sem depender dessa suposição entre arquivos.
  const userIdAnteriorRef = useRef(userId)
  useEffect(() => {
    if (userId === userIdAnteriorRef.current) return
    userIdAnteriorRef.current = userId
    setPreferenciaState(carregar(userId, chavesPadrao))
    // chavesPadrao muda de identidade a cada render (é um .map() novo) — só nos importa o valor
    // no momento em que o id muda, não recarregar toda vez que a lista de colunas for recriada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const definirPreferencia = useCallback(
    (nova: ColunaPreferenciaItem<K>[]) => {
      setPreferenciaState(nova)
      if (!userId) return
      try {
        localStorage.setItem(chaveStorage(userId), JSON.stringify(nova))
      } catch {
        // Preferência não persiste, mas a sessão atual continua funcionando.
      }
    },
    [userId],
  )

  const restaurarPadrao = useCallback(() => {
    definirPreferencia(padrao(chavesPadrao))
  }, [definirPreferencia, chavesPadrao])

  return { preferencia, definirPreferencia, restaurarPadrao }
}
