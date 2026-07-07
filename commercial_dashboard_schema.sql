-- =====================================================================
--  GYNMED · Dashboard Comercial OPME — Schema
--  Cole este script no Editor SQL do painel Supabase para criar as
--  tabelas comerciais. As tabelas nascem VAZIAS; a página lê daqui.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Representantes comerciais (com a meta sugerida do mês)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS representantes_comerciais (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          TEXT NOT NULL,
  meta_sugerida NUMERIC(14,2) NOT NULL DEFAULT 0,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 2. Etapa comercial (funil): cada caso vive na sua etapa ATUAL
-- ---------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE etapa_comercial AS ENUM (
    'cotacao',            -- cotação em aberto
    'autorizacao',        -- autorização em aberto
    'agendamento',        -- agendado no mês de referência
    'cirurgia_realizada', -- cirurgia realizada no mês de referência
    'perdida'             -- perdida / cancelada (não conta)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------
-- 3. Cotações comerciais — tabela-fato do funil
--    Uma linha = um caso (paciente + procedimento) na sua etapa atual.
--    mes_referencia = 1º dia do mês comercial ao qual o caso pertence.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotacoes_comerciais (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  representante_id         UUID REFERENCES representantes_comerciais(id) ON DELETE SET NULL,
  medico_nome              TEXT,
  paciente_nome            TEXT,
  procedimento             TEXT,
  convenio                 TEXT,
  valor                    NUMERIC(14,2) NOT NULL DEFAULT 0,
  etapa                    etapa_comercial NOT NULL DEFAULT 'cotacao',
  em_aberto                BOOLEAN NOT NULL DEFAULT true,  -- cotação/autorização ainda em aberto (snapshot)
  mes_referencia           DATE,                           -- 1º dia do mês comercial (ex.: 2026-07-01)
  data_cotacao             DATE,
  data_autorizacao         DATE,
  data_agendamento         DATE,
  data_cirurgia            DATE,
  data_vencimento_cotacao  DATE,                           -- alimenta "Cot. a vencer"
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para os recortes mais usados pelo dashboard
CREATE INDEX IF NOT EXISTS idx_cot_representante ON cotacoes_comerciais(representante_id);
CREATE INDEX IF NOT EXISTS idx_cot_etapa         ON cotacoes_comerciais(etapa);
CREATE INDEX IF NOT EXISTS idx_cot_mes_ref       ON cotacoes_comerciais(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_cot_convenio      ON cotacoes_comerciais(convenio);
CREATE INDEX IF NOT EXISTS idx_cot_medico        ON cotacoes_comerciais(medico_nome);

-- ---------------------------------------------------------------------
-- 4. RLS (aberto por enquanto, seguindo o padrão do projeto)
-- ---------------------------------------------------------------------
ALTER TABLE representantes_comerciais ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes_comerciais       ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "rep_com_all" ON representantes_comerciais FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "cot_com_all" ON cotacoes_comerciais FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
