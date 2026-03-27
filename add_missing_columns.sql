-- Copie e cole este script no Editor SQL do seu painel Supabase
-- Isso habilitará os campos adicionais da planilha que não puderam ser criados automaticamente

ALTER TABLE solicitacoes_cirurgia 
ADD COLUMN IF NOT EXISTS data_entrada_hospital DATE,
ADD COLUMN IF NOT EXISTS data_autorizacao DATE,
ADD COLUMN IF NOT EXISTS convenio TEXT,
ADD COLUMN IF NOT EXISTS status_cotacao TEXT,
ADD COLUMN IF NOT EXISTS status_pedido_cirurgico TEXT,
ADD COLUMN IF NOT EXISTS status_pedido_cirurgico2 TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Otimização: Adicionar índice para busca por convênio
CREATE INDEX IF NOT EXISTS idx_solicitacoes_convenio ON solicitacoes_cirurgia(convenio);
