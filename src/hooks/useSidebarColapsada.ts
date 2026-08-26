import { useCallback, useState } from 'react'

const CHAVE = 'gynmed:sidebar-colapsada'

function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    // Navegador com storage bloqueado (janela anônima, cookies de terceiros): abre expandida.
    return false
  }
}

/** Estado colapsado/expandido da sidebar, lembrado entre sessões no próprio navegador. */
export function useSidebarColapsada() {
  const [colapsada, setColapsada] = useState(lerPreferencia)

  const alternar = useCallback(() => {
    setColapsada((atual) => {
      const proxima = !atual
      try {
        localStorage.setItem(CHAVE, proxima ? '1' : '0')
      } catch {
        // Preferência não persiste, mas a sessão atual continua funcionando.
      }
      return proxima
    })
  }, [])

  return { colapsada, alternar }
}
