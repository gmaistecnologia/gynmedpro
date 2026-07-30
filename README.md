# Gynmed Pro — Módulo Comercial

ERP para operações de OPME da Gynmed. Esta é a fase piloto: o **Módulo Comercial**,
que digitaliza o fluxo de solicitação e aprovação de materiais cirúrgicos hoje
preso a um sistema legado acessível apenas por VPN.

## Stack

- **Vite + React 19 + TypeScript**
- **Tailwind CSS v4** (tokens do design system em [src/index.css](src/index.css))
- **Supabase** — Postgres (com RLS), Auth e Realtime
- **React Router**, **Recharts**, **Sonner** (toasts), **date-fns**

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
```

Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` (encontrados em Project Settings → API no painel do
Supabase). `SUPABASE_SERVICE_ROLE_KEY` só é necessária para scripts
administrativos locais (ex: criação de usuários via Admin API) — nunca é lida
pelo bundle do navegador.

## Contas de teste (Auth)

| Papel | E-mail | Senha |
|---|---|---|
| Admin | admin@gynmedpro.com.br | GynMed@2026Admin |
| Gerente Comercial | gerente@gynmedpro.com.br | GynMed@2026Gerente |
| Representante | representante@gynmedpro.com.br | GynMed@2026Rep |

Troque essas senhas antes de qualquer uso além de desenvolvimento/demo.

## Modelo de dados

Cinco tabelas no schema `public`, todas com Row Level Security ativo:

- **profiles** — estende `auth.users` (nome, role, comissão). Criada automaticamente
  por trigger (`handle_new_user`) quando um usuário é cadastrado no Auth.
- **hospitais** — cadastro de clientes/locais (leitura liberada, escrita restrita a admin).
- **produtos** — catálogo com código TUSS/ANVISA e preço de tabela (leitura liberada, escrita restrita a admin).
- **solicitacoes_cirurgicas** — o coração do módulo. Fluxo de status:
  `rascunho → enviado → aprovado_gerente | recusado → faturado`.
  Representante só enxerga/edita as próprias solicitações e não pode
  alterá-las para um status de aprovação — apenas gerente/admin fazem essa
  transição (garantido via RLS, não só na UI).
- **itens_solicitados** — produtos de cada solicitação (cascade ao apagar a solicitação pai).

Migrações aplicadas diretamente no projeto Supabase (`fvsbvbppdmuhwlydjxsn`) via
MCP — não há pasta `supabase/migrations` neste repo ainda. Rode
`supabase db pull` caso queira versionar o schema localmente.

## Papéis e fluxo

- **Representante** (mobile-first): Painel → Nova Solicitação → Histórico.
  Recebe notificação em tempo real (Supabase Realtime + toast) assim que o
  gestor aprova ou recusa uma cirurgia.
- **Gerente Comercial / Admin** (desktop): Painel de Aprovações (aprovar/recusar
  com motivo) e Relatórios (volume por hospital, ranking por representante,
  previsão de faturamento das próximas semanas).

## Identidade visual

A paleta, tipografia (Montserrat + Inter) e princípios de layout ("Santuário de
Precisão" — sem bordas sólidas, profundidade por camadas de tom, sombras
ambiente azuladas) estão documentados em
[stitch_assets/design_system.md](stitch_assets/design_system.md) e
[stitch_assets/design_system.json](stitch_assets/design_system.json). Os tokens
Tailwind correspondentes vivem em [src/index.css](src/index.css).
