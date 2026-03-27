-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Status Enum
CREATE TYPE solicitacao_status AS ENUM (
  'solicitado',
  'protocolado',
  'autorizado',
  'agendado',
  'realizada',
  'divergencia',
  'negado',
  'em_junta'
);

-- 2. Create Solicitacoes Table
CREATE TABLE solicitacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  paciente_nome TEXT NOT NULL,
  paciente_avatar TEXT,
  status solicitacao_status NOT NULL DEFAULT 'solicitado',
  medico_solicitante TEXT NOT NULL,
  cirurgiao_principal TEXT,
  procedimento TEXT NOT NULL,
  data_solicitacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_agendamento TEXT, -- Using text to match mock format for now
  hospital_preferencia TEXT,
  plano_saude TEXT,
  cid TEXT,
  paciente_cpf TEXT,
  paciente_nascimento TEXT,
  paciente_telefone TEXT,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Observacoes Table
CREATE TABLE solicitacao_observacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID REFERENCES solicitacoes(id) ON DELETE CASCADE,
  autor TEXT NOT NULL,
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  texto TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'normal', -- 'normal', 'sistema', 'divergencia'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert Mock Data
INSERT INTO solicitacoes (codigo, paciente_nome, status, medico_solicitante, cirurgiao_principal, procedimento, data_solicitacao)
VALUES 
('#GYN-8821', 'Helena M. Oliveira', 'realizada', 'Dr. Marcos Silva', 'Dra. Clara Mendes', 'Histeroscopia Cirúrgica', '2023-10-12'),
('#GYN-8822', 'Beatriz Santos', 'agendado', 'Dra. Juliana Costa', 'Dr. Roberto Leal', 'Cesárea Programada', '2023-10-14'),
('#GYN-8823', 'Amanda Ferreira', 'divergencia', 'Dr. Paulo Vieira', 'Dra. Sofia Lima', 'Laparoscopia Pélvica', '2023-10-15'),
('#GYN-8824', 'Carla Pereira', 'negado', 'Dr. Arthur Lima', '--', 'Biópsia de Endométrio', '2023-10-16'),
('#GYN-8825', 'Luciana Ramos', 'autorizado', 'Dra. Juliana Costa', 'Dr. Roberto Leal', 'Retirada de DIU', '2023-10-17');

-- 5. RLS Policies (Allow anonymity for now as per user request to simplify)
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now" ON solicitacoes FOR ALL USING (true);

ALTER TABLE solicitacao_observacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now" ON solicitacao_observacoes FOR ALL USING (true);
