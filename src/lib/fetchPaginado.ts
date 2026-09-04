// O Supabase/PostgREST deste projeto limita cada request a 1000 linhas. Tabelas maiores que
// isso (ex.: solicitacoes_importadas, com mais de 10 mil registros) precisam ser buscadas em
// lotes com `.range()` — um único `.select()` sem paginação trunca silenciosamente o resultado.
export async function fetchTodasPaginas<T>(
  buscarPagina: (
    offset: number,
    limite: number,
    // Só a chamada da primeira página deve pedir `count: 'exact'` — é o `count` dela que decide
    // se dá pra buscar o resto em paralelo (ver abaixo). Pedir de novo em cada página fazia o
    // Postgres recontar a tabela inteira sob RLS uma vez POR página, ao mesmo tempo — nas
    // tabelas deste projeto isso significa reavaliar a policy (que consulta `profiles` por
    // linha, sem cache) pra ~10 mil linhas, 11 vezes simultâneas. Isso deixou o carregamento
    // pior do que a versão sequencial original, que nunca pedia count nenhum. `buscarPagina` só
    // deve incluir `count: 'exact'` no `.select()` quando este parâmetro for `true`.
    comContagem: boolean,
  ) => PromiseLike<{ data: T[] | null; error: unknown; count?: number | null }>,
  tamanhoLote = 1000,
  // Disparar todas as páginas de uma vez, sem limite, chegou a sobrecarregar o Postgres o
  // suficiente pra estourar o statement_timeout da role authenticated (8s) sob RLS — causa raiz:
  // as policies reavaliavam auth.uid()/get_my_role() por LINHA em vez de cachear por consulta
  // (migration `otimizar_rls_painel_comercial`, aplicada em 2026-09-04). Depois da correção,
  // confirmado via EXPLAIN ANALYZE que uma página caiu de ~777ms pra ~204ms (get_my_role() agora
  // roda 1x por consulta via InitPlan, não 1x por linha) — o que causava a contenção sob
  // concorrência praticamente sumiu. 4 é um valor conservador com folga grande em relação ao
  // limite de 8s; pode subir mais se quiser recuperar ainda mais velocidade.
  concorrenciaMaxima = 4,
): Promise<T[]> {
  // Busca a primeira página sozinha, pra descobrir quantas restam (via `count`) e disparar
  // as demais em lotes de `concorrenciaMaxima` — uma tabela de 10 mil+ linhas facilmente vira
  // 8-11 lotes, e buscá-los um de cada vez (esperando cada requisição terminar antes de abrir a
  // próxima) foi o que deixava o Painel Comercial lento pra carregar. Peça `count: 'exact'` no
  // `.select()` pra habilitar esse caminho; sem `count`, cai no sequencial de sempre (só não dá
  // pra saber quantas páginas faltam sem tentar uma de cada vez).
  const primeira = await buscarPagina(0, tamanhoLote, true)
  if (primeira.error) throw primeira.error
  const primeiraPagina = primeira.data ?? []
  const total = primeira.count ?? null

  if (total !== null) {
    const totalPaginas = Math.max(1, Math.ceil(total / tamanhoLote))
    if (totalPaginas <= 1) return primeiraPagina

    const todas = [...primeiraPagina]
    const offsetsRestantes = Array.from({ length: totalPaginas - 1 }, (_, i) => (i + 1) * tamanhoLote)
    for (let inicio = 0; inicio < offsetsRestantes.length; inicio += concorrenciaMaxima) {
      const lote = offsetsRestantes.slice(inicio, inicio + concorrenciaMaxima)
      const resultados = await Promise.all(lote.map((offset) => buscarPagina(offset, tamanhoLote, false)))
      for (const { data, error } of resultados) {
        if (error) throw error
        todas.push(...(data ?? []))
      }
    }
    return todas
  }

  if (primeiraPagina.length < tamanhoLote) return primeiraPagina

  const todas = [...primeiraPagina]
  let offset = tamanhoLote
  for (;;) {
    const { data, error } = await buscarPagina(offset, tamanhoLote, false)
    if (error) throw error
    todas.push(...(data ?? []))
    if (!data || data.length < tamanhoLote) break
    offset += tamanhoLote
  }
  return todas
}
