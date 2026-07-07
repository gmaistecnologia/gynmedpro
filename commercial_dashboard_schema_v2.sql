-- =====================================================================
--  GYNMED · Dashboard Comercial OPME — Schema v2
--  Amplia cotacoes_comerciais para refletir os campos reais da planilha
--  SAGA (abas COTAÇÕES + REPORT MÉDICO). Rode DEPOIS de
--  commercial_dashboard_schema.sql. Idempotente (ADD COLUMN IF NOT EXISTS).
-- =====================================================================

ALTER TABLE cotacoes_comerciais
  ADD COLUMN IF NOT EXISTS nro_orcamento             TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS nro_agendamento           TEXT,
  ADD COLUMN IF NOT EXISTS hospital                  TEXT,
  ADD COLUMN IF NOT EXISTS uf_hospital                TEXT,
  ADD COLUMN IF NOT EXISTS grupo_procedimento        TEXT,
  ADD COLUMN IF NOT EXISTS valor_orcamento           NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS valor_final               NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS status_cotacao            TEXT,
  ADD COLUMN IF NOT EXISTS status_pedido_cirurgico   TEXT,
  ADD COLUMN IF NOT EXISTS status_pedido_cirurgico2  TEXT,
  ADD COLUMN IF NOT EXISTS status_final              TEXT,
  ADD COLUMN IF NOT EXISTS data_solicitacao          DATE,
  ADD COLUMN IF NOT EXISTS data_protocolo            DATE,
  ADD COLUMN IF NOT EXISTS data_reprovacao           DATE;

CREATE INDEX IF NOT EXISTS idx_cot_hospital ON cotacoes_comerciais(hospital);
CREATE INDEX IF NOT EXISTS idx_cot_nro_orc  ON cotacoes_comerciais(nro_orcamento);
CREATE INDEX IF NOT EXISTS idx_cot_uf       ON cotacoes_comerciais(uf_hospital);
