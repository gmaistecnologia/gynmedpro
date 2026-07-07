-- =====================================================================
--  GYNMED · Dashboard Comercial — SEED DEMO (OPCIONAL)
--  Popula alguns dados de exemplo só para conferir a interface.
--  Rode DEPOIS de commercial_dashboard_schema.sql. Não é obrigatório —
--  o dashboard funciona vazio. Ajuste/remova quando ligar os dados reais.
-- =====================================================================

INSERT INTO representantes_comerciais (nome, meta_sugerida) VALUES
  ('TERENCE MULLER OSORIO',   1000000),
  ('CASSIO AURELIO DE AZEVEDO', 1178823),
  ('ANDERSON ALCANTARA DE OLIVEIRA', 254466);

-- Cotações de exemplo (etapa = estágio ATUAL do caso).
-- mes_referencia ancora o caso ao mês comercial.
WITH r AS (
  SELECT id, nome FROM representantes_comerciais
)
INSERT INTO cotacoes_comerciais
  (representante_id, medico_nome, paciente_nome, procedimento, convenio, valor, etapa, em_aberto, mes_referencia, data_cirurgia, data_agendamento, data_vencimento_cotacao)
SELECT r.id, v.medico, v.paciente, v.proc, v.conv, v.valor, v.etapa::etapa_comercial, v.aberto, v.mes::date, v.dcir::date, v.dagend::date, v.dvenc::date
FROM r
JOIN (VALUES
  -- Terence: 1 cirurgia realizada + agendamentos + pipeline em aberto (JUL 26)
  ('TERENCE MULLER OSORIO', 'DR. JOAO LIMA',    'PACIENTE A', 'Artroplastia',      'Unimed',   86785,  'cirurgia_realizada', false, '2026-07-01', '2026-07-04', NULL,          NULL),
  ('TERENCE MULLER OSORIO', 'DR. JOAO LIMA',    'PACIENTE B', 'Artrodese',         'Unimed',   415671, 'agendamento',        false, '2026-07-01', NULL,         '2026-07-20',  NULL),
  ('TERENCE MULLER OSORIO', 'DRA. ANA COSTA',   'PACIENTE C', 'Videolaparoscopia', 'Bradesco', 120000, 'cotacao',            true,  '2026-07-01', NULL,         NULL,          '2026-07-28'),
  -- Cassio: cirurgias em jun e jul + cotações
  ('CASSIO AURELIO DE AZEVEDO', 'DR. PEDRO SA', 'PACIENTE D', 'Artroplastia',      'SulAmerica', 89503, 'cirurgia_realizada', false, '2026-07-01', '2026-07-10', NULL,          NULL),
  ('CASSIO AURELIO DE AZEVEDO', 'DR. PEDRO SA', 'PACIENTE E', 'Artrodese',         'SulAmerica', 171811,'agendamento',        false, '2026-07-01', NULL,         '2026-07-22',  NULL),
  ('CASSIO AURELIO DE AZEVEDO', 'DRA. LUZ DIAS','PACIENTE F', 'Videolaparoscopia', 'Unimed',    200000, 'cirurgia_realizada', false, '2026-06-01', '2026-06-15', NULL,          NULL),
  ('CASSIO AURELIO DE AZEVEDO', 'DRA. LUZ DIAS','PACIENTE G', 'Artroplastia',      'Unimed',    260000, 'autorizacao',        true,  '2026-07-01', NULL,         NULL,          NULL),
  -- Anderson: 1 cirurgia realizada
  ('ANDERSON ALCANTARA DE OLIVEIRA', 'DR. RUI M','PACIENTE H','Artrodese',         'Amil',      14080,  'cirurgia_realizada', false, '2026-07-01', '2026-07-02', NULL,          NULL)
) AS v(rep, medico, paciente, proc, conv, valor, etapa, aberto, mes, dcir, dagend, dvenc)
  ON r.nome = v.rep;
