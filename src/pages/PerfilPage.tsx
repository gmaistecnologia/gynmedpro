import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'

const TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp']
const TAMANHO_MAXIMO = 3 * 1024 * 1024 // 3MB

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente_comercial: 'Gerente Comercial',
  representante: 'Representante',
}

export function PerfilPage() {
  const { session, profile, refreshProfile } = useAuth()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [salvandoNome, setSalvandoNome] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const nomeAlterado = nome.trim() !== '' && nome.trim() !== profile?.nome

  async function salvarNome() {
    if (!session) return
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) {
      toast.error('Informe um nome válido.')
      return
    }
    setSalvandoNome(true)
    const { error } = await supabase.from('profiles').update({ nome: nomeLimpo }).eq('id', session.user.id)
    setSalvandoNome(false)

    if (error) {
      toast.error('Não foi possível salvar o nome.')
      return
    }
    await refreshProfile()
    toast.success('Nome atualizado.')
  }

  async function trocarFoto(file: File) {
    if (!session) return
    if (!TIPOS_ACEITOS.includes(file.type)) {
      toast.error('Envie uma imagem PNG, JPEG ou WEBP.')
      return
    }
    if (file.size > TAMANHO_MAXIMO) {
      toast.error('A imagem deve ter no máximo 3MB.')
      return
    }

    setEnviandoFoto(true)
    const extensao = file.type.split('/')[1]
    const caminho = `${session.user.id}/avatar.${extensao}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(caminho, file, { upsert: true, contentType: file.type })

    if (uploadError) {
      setEnviandoFoto(false)
      toast.error('Não foi possível enviar a foto.')
      return
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(caminho)
    // Cache-busting: o caminho é sempre o mesmo, então sem isso o navegador manteria a foto antiga.
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', session.user.id)
    setEnviandoFoto(false)

    if (updateError) {
      toast.error('Foto enviada, mas não foi possível salvar no seu perfil.')
      return
    }
    await refreshProfile()
    toast.success('Foto de perfil atualizada.')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) trocarFoto(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <header>
        <h1 className="font-headline font-bold text-3xl text-secondary tracking-tight">Perfil</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Nome exibido e foto usados em todo o sistema.</p>
      </header>

      <Card className="p-6 flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <Avatar nome={profile?.nome} avatarUrl={profile?.avatar_url} size="lg" />
          <div className="flex flex-col gap-2">
            <input
              ref={inputFileRef}
              type="file"
              accept={TIPOS_ACEITOS.join(',')}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="secondary"
              isLoading={enviandoFoto}
              disabled={enviandoFoto}
              onClick={() => inputFileRef.current?.click()}
            >
              Trocar foto
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </Button>
            <p className="text-xs text-on-surface-variant">PNG, JPEG ou WEBP · até 3MB</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-outline uppercase tracking-wide ml-1">Nome exibido</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/20 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-primary/10 focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-on-surface-variant">
            E-mail: <span className="text-on-surface font-semibold">{profile?.email ?? session?.user.email}</span>
          </span>
          <span className="text-on-surface-variant">
            Perfil:{' '}
            <span className="text-on-surface font-semibold">
              {profile ? (ROLE_LABELS[profile.role] ?? profile.role) : '—'}
            </span>
          </span>
        </div>

        <div>
          <Button isLoading={salvandoNome} disabled={salvandoNome || !nomeAlterado} onClick={salvarNome}>
            Salvar alterações
            <span className="material-symbols-outlined text-[18px]">check</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
