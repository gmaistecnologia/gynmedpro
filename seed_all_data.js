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

async function seed() {
  console.log('--- RE-SEEDING FOR AGENDA ---');

  const { data: users } = await supabase.from('usuarios').select('id, nome_completo');
  
  const adminId = users.find(u => u.nome_completo.includes('Admin'))?.id;
  const joaoId = users.find(u => u.nome_completo.includes('João'))?.id || users.find(u => u.nome_completo.includes('Joao'))?.id;
  const mariaId = users.find(u => u.nome_completo.includes('Maria'))?.id;

  const { data: ps } = await supabase.from('pacientes').select('id');
  const { data: ms } = await supabase.from('medicos').select('id');
  const { data: hs } = await supabase.from('hospitais').select('id');

  await supabase.from('solicitacoes_cirurgia').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);

  const sols = [
    { 
        numero_solicitacao: 'SOL-201', 
        paciente_id: ps[0].id, 
        medico_solicitante_id: ms[0].id, 
        hospital_id: hs[0].id, 
        representante_responsavel_id: joaoId, 
        procedimento_descricao: 'Histerectomia Laparoscópica', 
        status_atual: 'agendado', 
        data_solicitacao: today.toISOString(),
        data_cirurgia_agendada: tomorrow.toISOString() 
    },
    { 
        numero_solicitacao: 'SOL-202', 
        paciente_id: ps[1].id, 
        medico_solicitante_id: ms[1].id, 
        hospital_id: hs[0].id, 
        representante_responsavel_id: joaoId, 
        procedimento_descricao: 'Laparoscopia Pélvica', 
        status_atual: 'solicitado', 
        data_solicitacao: today.toISOString(),
        data_cirurgia_agendada: nextWeek.toISOString()
    },
    { 
        numero_solicitacao: 'SOL-203', 
        paciente_id: ps[2].id, 
        medico_solicitante_id: ms[0].id, 
        hospital_id: hs[0].id, 
        representante_responsavel_id: mariaId, 
        procedimento_descricao: 'Cesárea Programada', 
        status_atual: 'cirurgia_realizada', 
        data_solicitacao: today.toISOString(),
        data_cirurgia_agendada: today.toISOString()
    },
    { 
        numero_solicitacao: 'SOL-204', 
        paciente_id: ps[3].id, 
        medico_solicitante_id: ms[0].id, 
        hospital_id: hs[0].id, 
        representante_responsavel_id: adminId, 
        procedimento_descricao: 'Mioectomia Abdominal', 
        status_atual: 'divergencia', 
        data_solicitacao: today.toISOString(),
        data_cirurgia_agendada: tomorrow.toISOString()
    },
  ];

  const { data, error } = await supabase.from('solicitacoes_cirurgia').insert(sols).select();
  if (error) console.error('Error:', error.message);
  else console.log(`SUCCESS: Seeded ${data.length} records with surgery dates.`);

  console.log('--- FINISHED ---');
}

seed();
