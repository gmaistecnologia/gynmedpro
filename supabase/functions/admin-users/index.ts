// Única Edge Function que precisa da service_role key (Admin Auth API), usada pela aba
// "Usuários" de Configurações (ver src/components/configuracoes/UsuariosSection.tsx):
//   - create-user: cria o login (auth.users) com senha temporária definida pelo admin e a
//     linha correspondente em `profiles`.
//   - set-active: liga/desliga `profiles.ativo` e, principalmente, bane/desbane o login via
//     Admin Auth API — é isso que de fato impede o usuário inativado de logar de novo (o
//     client em src/lib/auth.tsx só cobre a sessão que já estava aberta no navegador dele).
//   - update-credentials: troca e-mail e/ou senha de um usuário existente. A dupla confirmação
//     (digitar de novo) acontece no client, antes de chamar esta ação — aqui só valida e aplica.
// Editar nome/role/comissão de um usuário existente NÃO passa por aqui — é update direto na
// tabela `profiles`, coberto pela policy/trigger da migração perfil_e_gestao_de_usuarios.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

type CreateUserBody = {
  action: 'create-user'
  email: string
  nome: string
  role: 'admin' | 'gerente_comercial' | 'representante'
  comissao_padrao?: number | null
  senha: string
}

type SetActiveBody = {
  action: 'set-active'
  id: string
  ativo: boolean
}

type UpdateCredentialsBody = {
  action: 'update-credentials'
  id: string
  email?: string
  senha?: string
}

type Body = CreateUserBody | SetActiveBody | UpdateCredentialsBody

const ROLES = ['admin', 'gerente_comercial', 'representante']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Client com o JWT de quem chamou, só pra confirmar que é admin.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser()
  if (!caller) return jsonResponse({ error: 'Não autenticado.' }, 401)

  const { data: callerProfile } = await callerClient.from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'Apenas administradores podem gerenciar usuários.' }, 403)
  }

  // Client com service_role pra Admin Auth API + upsert em profiles.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  let body: Body
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400)
  }

  if (body.action === 'create-user') {
    const { email, nome, role, comissao_padrao, senha } = body
    if (!email?.trim() || !nome?.trim() || !senha) {
      return jsonResponse({ error: 'Preencha nome, e-mail e senha temporária.' }, 400)
    }
    if (senha.length < 8) {
      return jsonResponse({ error: 'A senha temporária deve ter pelo menos 8 caracteres.' }, 400)
    }
    if (!ROLES.includes(role)) {
      return jsonResponse({ error: 'Perfil inválido.' }, 400)
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password: senha,
      email_confirm: true,
      user_metadata: { nome: nome.trim() },
    })

    if (createError || !created.user) {
      const msg = createError?.message?.includes('already been registered')
        ? 'Já existe um usuário com esse e-mail.'
        : createError?.message ?? 'Não foi possível criar o usuário.'
      return jsonResponse({ error: msg }, 400)
    }

    // upsert, não insert: cobre o caso de já existir um trigger de auth.users que insira uma
    // linha default em profiles antes deste passo.
    const { error: upsertError } = await adminClient.from('profiles').upsert({
      id: created.user.id,
      nome: nome.trim(),
      role,
      comissao_padrao: comissao_padrao ?? null,
      email: email.trim(),
      ativo: true,
    })

    if (upsertError) {
      return jsonResponse({ error: 'Usuário criado no login, mas falhou ao salvar o perfil.' }, 500)
    }

    return jsonResponse({ user: { id: created.user.id, email: email.trim(), nome: nome.trim(), role } })
  }

  if (body.action === 'set-active') {
    const { id, ativo } = body
    if (!id) return jsonResponse({ error: 'Usuário inválido.' }, 400)

    const { error: banError } = await adminClient.auth.admin.updateUserById(id, {
      ban_duration: ativo ? 'none' : '876000h', // ~100 anos: efetivamente bloqueia o login
    })
    if (banError) return jsonResponse({ error: 'Não foi possível atualizar o acesso do usuário.' }, 500)

    const { error: updateError } = await adminClient.from('profiles').update({ ativo }).eq('id', id)
    if (updateError) return jsonResponse({ error: 'Não foi possível atualizar o status do usuário.' }, 500)

    return jsonResponse({ ok: true })
  }

  if (body.action === 'update-credentials') {
    const { id, email, senha } = body
    if (!id) return jsonResponse({ error: 'Usuário inválido.' }, 400)

    const emailLimpo = email?.trim()
    if (!emailLimpo && !senha) {
      return jsonResponse({ error: 'Informe um novo e-mail e/ou uma nova senha.' }, 400)
    }
    if (senha && senha.length < 8) {
      return jsonResponse({ error: 'A senha deve ter pelo menos 8 caracteres.' }, 400)
    }

    const updatePayload: { email?: string; password?: string } = {}
    if (emailLimpo) updatePayload.email = emailLimpo
    if (senha) updatePayload.password = senha

    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      ...updatePayload,
      email_confirm: emailLimpo ? true : undefined,
    })
    if (authError) {
      const msg = authError.message?.includes('already been registered')
        ? 'Já existe um usuário com esse e-mail.'
        : (authError.message ?? 'Não foi possível atualizar as credenciais.')
      return jsonResponse({ error: msg }, 400)
    }

    if (emailLimpo) {
      const { error: profileError } = await adminClient.from('profiles').update({ email: emailLimpo }).eq('id', id)
      if (profileError) {
        return jsonResponse({ error: 'E-mail alterado no login, mas falhou ao salvar no perfil.' }, 500)
      }
    }

    return jsonResponse({ ok: true })
  }

  return jsonResponse({ error: 'Ação desconhecida.' }, 400)
})
