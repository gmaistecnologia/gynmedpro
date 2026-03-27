const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  const trimKey = key?.trim();
  const trimValue = value?.trim();
  if (trimKey && trimValue) env[trimKey] = trimValue;
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const andersonId = 'c0b844a6-1057-414e-b4c3-74b35c3adfd2';

const rawData = [
    { nro: '4261', sol: '18/03/2025', proc: 'BLOQUEIO', conv: 'POSTAL SAUDE', pac: 'SOLANGE MARIA BATISTA DE OLIVEIRA', med: 'DR.LUCAS ALVES PORTILHO', status: 'autorizado' },
    { nro: '8779', sol: '30/07/2025', proc: 'BLOQUEIO', conv: 'GEAP', pac: 'MARIA APARECIDA DE LIMA SILVA', med: 'DR.MARCELO TORRES', status: 'autorizado' },
    { nro: '9006', sol: '07/08/2025', proc: 'BLOQUEIO JOELHO', conv: 'POSTAL SAUDE', pac: 'ALADIR FERNANDES DA SILVA', med: 'DR.MARCELO PARIS MENDONCA', status: 'autorizado' },
    { nro: '10561', sol: '19/09/2025', proc: 'BLOQUEIO', conv: 'SAUDE ITAU', pac: 'DILMACY RODRIGUES FERREIRA', med: 'DR.LUCAS ALVES PORTILHO', status: 'autorizado' },
    { nro: '12609', sol: '17/11/2025', proc: 'ARTROPLASTIA ATM', conv: 'IPASGO', pac: 'MARIA ANGELICA ALVES CARVALHO', med: 'DR.NASMYA JAMAL FERNANDES', status: 'pendencia_agendamento' },
    { nro: '12984', sol: '28/11/2025', proc: 'ORTOGNATICA', conv: 'UNIMED GOIANIA', pac: 'ELLEN CRISTINA MOREIRA E SILVA', med: 'DR.NASMYA JAMAL FERNANDES', status: 'desistencia' },
    { nro: '15068', sol: '17/12/2025', proc: 'BUCOMAXILO', conv: 'PARTICULAR', pac: 'LETICIA CABRAL', med: 'DR.ALAN PANARELO', status: 'cirurgia_realizada' },
    { nro: '14486', sol: '12/01/2026', proc: 'BLOQUEIO JOELHO', conv: 'PARTICULAR', pac: 'JANE FATIMA AMELIA BORGES MASSANO', med: 'DR.MARCELO PARIS MENDONCA', status: 'desistencia' },
    { nro: '14468', sol: '13/01/2026', proc: 'BLOQUEIO JOELHO', conv: 'PARTICULAR', pac: 'FERNANDO CORREIA DE MELO', med: 'DR.MARCELO PARIS MENDONCA', status: 'cancelado' },
    { nro: '14334', sol: '14/01/2026', proc: 'BLOQUEIO', conv: 'GEAP', pac: 'ELIANE DE JESUS TELES', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '14660', sol: '23/01/2026', proc: 'BLOQUEIO JOELHO', conv: 'POSTAL SAUDE', pac: 'OLINDA MARTA ROZA DE PAULA LOPES', med: 'DR.MARCELO PARIS MENDONCA', status: 'pendencia_agendamento' },
    { nro: '14674', sol: '23/01/2026', proc: 'QUADRIL', conv: 'PARTICULAR', pac: 'ALEXANDRE CARDOSO DO NASCIMENTO', med: 'DR.CLAUDIO SOUSA CASTRO', status: 'cancelado' },
    { nro: '14690', sol: '23/01/2026', proc: 'BUCOMAXILO', conv: 'SUL AMERICA', pac: 'VITORIA CORREIA LEAL', med: 'DR.TAWAN MANZE SANTANA', status: 'negado' },
    { nro: '14860', sol: '28/01/2026', proc: 'BLOQUEIO', conv: 'VIVACOM', pac: 'NAIR DA SILVA TAVARES', med: 'DR.MARCELO GONCALVES DE ALMEIDA', status: 'negado' },
    { nro: '14957', sol: '29/01/2026', proc: 'BLOQUEIO', conv: 'PARTICULAR', pac: 'MARIA HELENA DE ARAUJO', med: 'DR.MARCELO PARIS MENDONCA', status: 'cirurgia_realizada' },
    { nro: '15204', sol: '04/02/2026', proc: 'BLOQUEIO JOELHO', conv: 'VIVACOM', pac: 'ALTALIRA MOREIRA DO CARMO', med: 'DR.MARCELO TORRES', status: 'negado' },
    { nro: '15234', sol: '04/02/2026', proc: 'BLOQUEIO COLUNA', conv: 'POSTAL SAUDE', pac: 'THIAGO BATISTA DE OLIVEIRA', med: 'DR.LUCAS ALVES PORTILHO', status: 'pendencia_agendamento' },
    { nro: '15224', sol: '05/02/2026', proc: 'ALIF', conv: 'PARTICULAR', pac: 'NATALIA VIEIRA PINHO', med: 'DR.AURELIO FELIPE ARANTES', status: 'cancelado' },
    { nro: '15325', sol: '06/02/2026', proc: 'BLOQUEIO JOELHO', conv: 'CASSI', pac: 'ADEMAR JOSE DOS SANTOS', med: 'DR.DALTON SIQUEIRA FILHO', status: 'protocolado' },
    { nro: '15326', sol: '06/02/2026', proc: 'BLOQUEIO', conv: 'CASSI', pac: 'JAIR TIAGO NOGUEIRA', med: 'DR.DALTON SIQUEIRA FILHO', status: 'protocolado' },
    { nro: '15492', sol: '12/02/2026', proc: 'RIZOTOMIA', conv: 'CASSI', pac: 'ELIANE VITAL DE LIMA', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '15536', sol: '13/02/2026', proc: 'BLOQUEIO COLUNA', conv: 'SAUDE ITAU', pac: 'IRON BORGES GOMES', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '15627', sol: '18/02/2026', proc: 'ARTROSCOPIA', conv: 'UNIMED GOIANIA', pac: 'LUCI DE PAULA RAMOS SANTOS', med: 'DR.NASMYA JAMAL FERNANDES', status: 'pendencia_agendamento' },
    { nro: '15697', sol: '19/02/2026', proc: 'BLOQUEIO COLUNA', conv: 'SAUDE ITAU', pac: 'JESUS MARINHO DA COSTA', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '15696', sol: '19/02/2026', proc: 'BLOQUEIO COLUNA', conv: 'CASSI', pac: 'MARIA FLAUSINA FELES BASTOS', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '15658', sol: '19/02/2026', proc: 'QUADRIL', conv: 'BRAD.CE', pac: 'EURIPA APARECIDA P BRITO', med: 'DR.LUCAS ALVES PORTILHO', status: 'protocolado' },
    { nro: '15735', sol: '20/02/2026', proc: 'ALIF', conv: 'UNIMED GOIANIA', pac: 'PACIENTE DESCONHECIDO 1', med: 'DR.MURILO TAVARES DAHER', status: 'solicitado' },
    { nro: '15852', sol: '20/02/2026', proc: 'ALIF', conv: 'UNIMED GOIANIA', pac: 'PACIENTE DESCONHECIDO 2', med: 'DR.MURILO TAVARES DAHER', status: 'solicitado' },
    { nro: '15879', sol: '24/02/2026', proc: 'COALITION', conv: 'UNIMED ANAPOLIS', pac: 'VANUSA DE SOUZA RODRIGUES', med: 'DR.SAAD GEORGE OLIVEIRA EL HAOULI', status: 'solicitado' },
    { nro: '15992', sol: '26/02/2026', proc: 'BLOQUEIO COLUNA', conv: 'GEAP', pac: 'VANDA ROSA DE SIQUEIRA SOARES', med: 'DR.LUCAS ALVES PORTILHO', status: 'pendencia_agendamento' },
    { nro: '16069', sol: '27/02/2026', proc: 'BLOQUEIO JOELHO', conv: 'VIVACOM', pac: 'LUCAS RITA DA SILVA', med: 'DR.MARCELO GONCALVES DE ALMEIDA', status: 'negado' },
    { nro: '16064', sol: '27/02/2026', proc: 'RIZOTOMIA', conv: 'LIFE', pac: 'BRENDA PALHETA GARCIA FERREIRA', med: 'DR.LUCAS ALVES PORTILHO', status: 'solicitado' },
    { nro: '16265', sol: '06/03/2026', proc: 'BLOQUEIO JOELHO', conv: 'GEAP', pac: 'MARIA FERREIRA FREITAS', med: 'DR.MATHEUS FACHETTI MACHADO', status: 'solicitado' },
    { nro: '16270', sol: '06/03/2026', proc: 'BLOQUEIO COLUNA', conv: 'GEAP', pac: 'JOAO ALBERTO CACADO AZEREDO', med: 'DR.LUCAS ALVES PORTILHO', status: 'solicitado' },
    { nro: '16394', sol: '10/03/2026', proc: 'BLOQUEIO', conv: 'CASSI', pac: 'TIBURCIO TORRES NETO', med: 'DR.GABRIEL RODRIGUES SILVA', status: 'solicitado' },
    { nro: '16524', sol: '12/03/2026', proc: 'BLOQUEIO JOELHO', conv: 'CASSI', pac: 'EDISMAR JOSE SILVA FIDENCIO', med: 'DR.DALTON SIQUEIRA FILHO', status: 'solicitado' }
];

function parseDate(d) {
  if (!d || d.trim() === '') return null;
  const parts = d.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
}

async function getOrCreatePatient(name, plano) {
  const { data: existing } = await supabase.from('pacientes').select('id').eq('nome', name).maybeSingle();
  if (existing) {
    // Update plano_saude if it changed or was empty
    await supabase.from('pacientes').update({ plano_saude: plano }).eq('id', existing.id);
    return existing.id;
  }
  const { data: created, error } = await supabase.from('pacientes').insert({ 
    nome: name, 
    plano_saude: plano,
    cpf: `MOCK-${Math.random().toString(36).substr(2, 9)}` 
  }).select('id').single();
  if (error) throw new Error(`Patient error: ${error.message}`);
  return created.id;
}

async function getOrCreateDoctor(name) {
  const { data: existing } = await supabase.from('medicos').select('id').eq('nome', name).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from('medicos').insert({ 
    nome: name, 
    crm: `MOCK-${Math.random().toString(36).substr(2, 9)}` 
  }).select('id').single();
  if (error) throw new Error(`Doctor error: ${error.message}`);
  return created.id;
}

async function importData() {
  console.log('--- STARTING IMPORT ---');

  const statusMap = {
    'autorizado': 'agendado',
    'pendencia_agendamento': 'divergencia',
    'desistencia': 'divergencia',
    'cirurgia_realizada': 'cirurgia_realizada',
    'cancelado': 'divergencia',
    'protocolado': 'solicitado',
    'negado': 'divergencia',
    'solicitado': 'solicitado'
  };

  const { data: h } = await supabase.from('hospitais').select('id').limit(1).single();

  for (const row of rawData) {
    console.log(`Processing ${row.nro}...`);
    try {
      const pId = await getOrCreatePatient(row.pac, row.conv);
      const mId = await getOrCreateDoctor(row.med);

      const { error } = await supabase.from('solicitacoes_cirurgia').insert({
        numero_solicitacao: row.nro,
        paciente_id: pId,
        medico_solicitante_id: mId,
        hospital_id: h.id,
        representante_responsavel_id: andersonId,
        procedimento_descricao: row.proc,
        status_atual: statusMap[row.status] || 'solicitado',
        data_solicitacao: parseDate(row.sol),
      });

      if (error) console.error(`Error row ${row.nro}:`, error.message);
      else console.log(`Inserted ${row.nro}`);
    } catch (e) {
      console.error(`Row ${row.nro} failed: ${e.message}`);
    }
  }

  console.log('--- IMPORT FINISHED ---');
}

importData();
