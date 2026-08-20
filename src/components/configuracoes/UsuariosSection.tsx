import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { UsuarioInativoBadge } from '../ui/UsuarioInativoBadge'
import type { ProfileCompleto, Role } from '../../lib/types'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  gerente_comercial: 'Gerente Comercial',
  representante: 'Representante',
}

const ROLES: Role[] = ['admin', 'gerente_comercial', 'representante']

function gerarSenhaTemporaria(): string {
  // 12 caracteres alfanuméricos, o suficiente pra uma senha temporária que o admin repassa
  // ao novo usuário — não precisa de símbolos, só de ser fácil de digitar/copiar.
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

type CredenciaisCriadas = { email: string; senha: string }

export function UsuariosSection() {
  const [usuarios, setUsuarios] = useState<ProfileCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const [novoNome, setNovoNome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [novoRole, setNovoRole] = useState<Role>('representante')
  const [novaComissao, setNovaComissao] = useState('')
  const [criando, setCriando] = useState(false)
  const [credenciaisCriadas, setCredenciaisCriadas] = useState<CredenciaisCriadas | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [edicaoNome, setEdicaoNome] = useState('')
  const [edicaoRole, setEdicaoRole] = useState<Role>('representante')
  const [edicaoComissao, setEdicaoComissao] = useState('')
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const [alternandoId, setAlternandoId] = useState<string | null>(null)

  const [credenciaisAbertoId, setCredenciaisAbertoId] = useState<string | null>(null)
  const [novoEmailCred, setNovoEmailCred] = useState('')
  const [confirmarEmailCred, setConfirmarEmailCred] = useState('')
  const [novaSenhaCred, setNovaSenhaCred] = useState('')
  const [confirmarSenhaCred, setConfirmarSenhaCred] = useState('')
  const [salvandoCredenciais, setSalvandoCredenciais] = useState(false)

  async function carregar() {
    const { data } = await supabase.from('profiles').select('*').order('nome')
    setUsuarios((data as ProfileCompleto[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const usuariosFiltrados = usuarios.filter((u) => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return true
    return u.nome.toLowerCase().includes(termo) || (u.email ?? '').toLowerCase().includes(termo)
  })

  async function criarUsuario() {
    if (!novoNome.trim() || !novoEmail.trim() || !novaSenha) {
      toast.error('Preencha nome, e-mail e senha temporária.')
      return
    }
    if (novaSenha.length < 8) {
      toast.error('A senha temporária deve ter pelo menos 8 caracteres.')
      return
    }

    setCriando(true)
    const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-users', {
      body: {
        action: 'create-user',
        email: novoEmail.trim(),
        nome: novoNome.trim(),
        role: novoRole,
        comissao_padrao: novaComissao ? Number(novaComissao.replace(',', '.')) : null,
        senha: novaSenha,
      },
    })
    setCriando(false)

    if (error || data?.error) {
      toast.error(data?.error ?? 'Não foi possível criar o usuário.')
      return
    }

    toast.success(`Usuário ${novoNome} criado.`)
    setCredenciaisCriadas({ email: novoEmail.trim(), senha: novaSenha })
    setNovoNome('')
    setNovoEmail('')
    setNovaSenha('')
    setNovaComissao('')
    setNovoRole('representante')
    carregar()
  }

  function abrirEdicao(usuario: ProfileCompleto) {
    setEditandoId(usuario.id)
    setEdicaoNome(usuario.nome)
    setEdicaoRole(usuario.role as Role)
    setEdicaoComissao(usuario.comissao_padrao !== null ? String(usuario.comissao_padrao) : '')
  }

  async function salvarEdicao(usuario: ProfileCompleto) {
    if (!edicaoNome.trim()) {
      toast.error('Informe um nome válido.')
      return
    }
    setSalvandoEdicao(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: edicaoNome.trim(),
        role: edicaoRole,
        comissao_padrao: edicaoComissao ? Number(edicaoComissao.replace(',', '.')) : null,
      })
      .eq('id', usuario.id)
    setSalvandoEdicao(false)

    if (error) {
      toast.error('Não foi possível atualizar o usuário.')
      return
    }
    toast.success('Usuário atualizado.')
    setEditandoId(null)
    carregar()
  }

  async function alternarAtivo(usuario: ProfileCompleto) {
    setAlternandoId(usuario.id)
    const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-users', {
      body: { action: 'set-active', id: usuario.id, ativo: !usuario.ativo },
    })
    setAlternandoId(null)

    if (error || data?.error) {
      toast.error(data?.error ?? 'Não foi possível atualizar o status do usuário.')
      return
    }
    toast.success(usuario.ativo ? `${usuario.nome} foi inativado.` : `${usuario.nome} foi reativado.`)
    carregar()
  }

  function abrirCredenciais(usuario: ProfileCompleto) {
    setCredenciaisAbertoId(usuario.id)
    setNovoEmailCred('')
    setConfirmarEmailCred('')
    setNovaSenhaCred('')
    setConfirmarSenhaCred('')
  }

  function fecharCredenciais() {
    setCredenciaisAbertoId(null)
  }

  function gerarESincronizarSenhaCred() {
    // Gerada por código, não precisa de dupla digitação pra pegar erro de digitação — preenche
    // os dois campos direto.
    const senha = gerarSenhaTemporaria()
    setNovaSenhaCred(senha)
    setConfirmarSenhaCred(senha)
  }

  async function salvarCredenciais(usuario: ProfileCompleto) {
    const email = novoEmailCred.trim()
    const senha = novaSenhaCred

    if (!email && !senha) {
      toast.error('Informe um novo e-mail e/ou uma nova senha.')
      return
    }
    if (email && email !== confirmarEmailCred.trim()) {
      toast.error('Os dois e-mails informados não são iguais.')
      return
    }
    if (senha) {
      if (senha.length < 8) {
        toast.error('A senha deve ter pelo menos 8 caracteres.')
        return
      }
      if (senha !== confirmarSenhaCred) {
        toast.error('As duas senhas informadas não são iguais.')
        return
      }
    }

    setSalvandoCredenciais(true)
    const { data, error } = await supabase.functions.invoke<{ error?: string }>('admin-users', {
      body: {
        action: 'update-credentials',
        id: usuario.id,
        email: email || undefined,
        senha: senha || undefined,
      },
    })
    setSalvandoCredenciais(false)

    if (error || data?.error) {
      toast.error(data?.error ?? 'Não foi possível atualizar as credenciais.')
      return
    }
    toast.success(`Credenciais de ${usuario.nome} atualizadas.`)
    fecharCredenciais()
    carregar()
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-on-surface-variant text-sm -mt-2">Cadastro, edição e inativação dos usuários do sistema.</p>

      <Card className="p-6">
        <h2 className="font-headline font-bold text-lg text-secondary mb-1">Adicionar usuário</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          O usuário entra com a senha temporária abaixo — recomendamos que ele a troque assim que possível.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Nome</label>
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-48 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">E-mail</label>
            <input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-56 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Perfil</label>
            <select
              value={novoRole}
              onChange={(e) => setNovoRole(e.target.value as Role)}
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Comissão padrão (%)</label>
            <input
              type="text"
              inputMode="decimal"
              value={novaComissao}
              onChange={(e) => setNovaComissao(e.target.value)}
              placeholder="Opcional"
              className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-32 focus:ring-2 focus:ring-primary/10 focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Senha temporária</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 w-40 focus:ring-2 focus:ring-primary/10 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setNovaSenha(gerarSenhaTemporaria())}
                className="text-outline hover:text-primary transition-colors"
                title="Gerar senha"
              >
                <span className="material-symbols-outlined text-[20px]">autorenew</span>
              </button>
            </div>
          </div>
          <Button isLoading={criando} disabled={criando} onClick={criarUsuario}>
            Criar usuário
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          </Button>
        </div>

        {credenciaisCriadas && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-tertiary-container/10 px-4 py-3">
            <p className="text-sm text-on-surface">
              Repasse ao usuário: <strong>{credenciaisCriadas.email}</strong> · senha temporária{' '}
              <strong>{credenciaisCriadas.senha}</strong>
            </p>
            <button
              type="button"
              onClick={() => setCredenciaisCriadas(null)}
              className="text-outline hover:text-on-surface transition-colors"
              title="Dispensar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-outline-variant/10">
          <h2 className="font-headline font-bold text-lg text-secondary">Usuários</h2>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-64 focus:ring-2 focus:ring-primary/10 focus:border-primary"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Usuário
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Perfil
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Comissão
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 font-headline font-bold text-xs text-on-surface-variant uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Carregando…
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => {
                  const emEdicao = editandoId === usuario.id
                  const editandoCredenciais = credenciaisAbertoId === usuario.id
                  return (
                    <Fragment key={usuario.id}>
                    <tr className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar nome={usuario.nome} avatarUrl={usuario.avatar_url} />
                          <div className="min-w-0">
                            {emEdicao ? (
                              <input
                                autoFocus
                                type="text"
                                value={edicaoNome}
                                onChange={(e) => setEdicaoNome(e.target.value)}
                                className="w-40 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-1.5 px-3"
                              />
                            ) : (
                              <span className="block text-sm font-semibold text-on-surface truncate">{usuario.nome}</span>
                            )}
                            <span className="block text-xs text-on-surface-variant truncate">{usuario.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {emEdicao ? (
                          <select
                            value={edicaoRole}
                            onChange={(e) => setEdicaoRole(e.target.value as Role)}
                            className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-1.5 px-3"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          ROLE_LABELS[usuario.role as Role] ?? usuario.role
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {emEdicao ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={edicaoComissao}
                            onChange={(e) => setEdicaoComissao(e.target.value)}
                            placeholder="—"
                            className="w-20 bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-1.5 px-3"
                          />
                        ) : usuario.comissao_padrao !== null ? (
                          `${usuario.comissao_padrao}%`
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {usuario.ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border bg-tertiary-container/10 text-tertiary-container border-tertiary-container/20">
                            Ativo
                          </span>
                        ) : (
                          <UsuarioInativoBadge />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {emEdicao ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={salvandoEdicao}
                              onClick={() => salvarEdicao(usuario)}
                              className="text-primary hover:text-primary-container transition-colors"
                              title="Salvar"
                            >
                              <span className="material-symbols-outlined text-[20px]">check</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoId(null)}
                              className="text-outline hover:text-error transition-colors"
                              title="Cancelar"
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => abrirEdicao(usuario)}
                              className="text-outline hover:text-primary transition-colors"
                              title="Editar"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => (editandoCredenciais ? fecharCredenciais() : abrirCredenciais(usuario))}
                              className={`transition-colors ${editandoCredenciais ? 'text-primary' : 'text-outline hover:text-primary'}`}
                              title="Alterar e-mail/senha"
                            >
                              <span className="material-symbols-outlined text-[20px]">key</span>
                            </button>
                            <button
                              type="button"
                              disabled={alternandoId === usuario.id}
                              onClick={() => alternarAtivo(usuario)}
                              className={`transition-colors ${
                                usuario.ativo ? 'text-outline hover:text-error' : 'text-outline hover:text-tertiary-container'
                              }`}
                              title={usuario.ativo ? 'Inativar' : 'Reativar'}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {usuario.ativo ? 'block' : 'check_circle'}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {editandoCredenciais && (
                      <tr className="bg-surface-container-low/60">
                        <td colSpan={5} className="px-6 py-5">
                          <div className="flex flex-col gap-4">
                            <p className="text-xs text-on-surface-variant">
                              Preencha só o que quiser trocar — e-mail e senha são independentes. Digite cada valor duas
                              vezes pra confirmar.
                            </p>
                            <div className="flex flex-wrap items-end gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                                  Novo e-mail
                                </label>
                                <input
                                  type="email"
                                  value={novoEmailCred}
                                  onChange={(e) => setNovoEmailCred(e.target.value)}
                                  placeholder={usuario.email ?? ''}
                                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-56 focus:ring-2 focus:ring-primary/10 focus:border-primary"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                                  Confirmar e-mail
                                </label>
                                <input
                                  type="email"
                                  value={confirmarEmailCred}
                                  onChange={(e) => setConfirmarEmailCred(e.target.value)}
                                  disabled={!novoEmailCred}
                                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-56 focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:opacity-50"
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                                  Nova senha
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={novaSenhaCred}
                                    onChange={(e) => setNovaSenhaCred(e.target.value)}
                                    className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-40 focus:ring-2 focus:ring-primary/10 focus:border-primary"
                                  />
                                  <button
                                    type="button"
                                    onClick={gerarESincronizarSenhaCred}
                                    className="text-outline hover:text-primary transition-colors"
                                    title="Gerar senha"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">autorenew</span>
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">
                                  Confirmar senha
                                </label>
                                <input
                                  type="text"
                                  value={confirmarSenhaCred}
                                  onChange={(e) => setConfirmarSenhaCred(e.target.value)}
                                  disabled={!novaSenhaCred}
                                  className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm py-2 px-3 w-40 focus:ring-2 focus:ring-primary/10 focus:border-primary disabled:opacity-50"
                                />
                              </div>
                              <Button
                                isLoading={salvandoCredenciais}
                                disabled={salvandoCredenciais}
                                onClick={() => salvarCredenciais(usuario)}
                              >
                                Salvar
                                <span className="material-symbols-outlined text-[18px]">check</span>
                              </Button>
                              <Button variant="secondary" disabled={salvandoCredenciais} onClick={fecharCredenciais}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
