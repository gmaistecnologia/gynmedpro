// O Supabase/PostgREST deste projeto limita cada request a 1000 linhas. Tabelas maiores que
// isso (ex.: solicitacoes_importadas, com mais de 10 mil registros) precisam ser buscadas em
// lotes com `.range()` — um único `.select()` sem paginação trunca silenciosamente o resultado.
export async function fetchTodasPaginas<T>(
  buscarPagina: (offset: number, limite: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  tamanhoLote = 1000,
): Promise<T[]> {
  let offset = 0
  const todas: T[] = []
  for (;;) {
    const { data, error } = await buscarPagina(offset, tamanhoLote)
    if (error) throw error
    todas.push(...(data ?? []))
    if (!data || data.length < tamanhoLote) break
    offset += tamanhoLote
  }
  return todas
}
