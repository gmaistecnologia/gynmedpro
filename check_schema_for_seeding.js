const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
    // Check pacientes
    const { data: pData, error: pError } = await supabase.from('pacientes').select('*').limit(1);
    if (pData) console.log('Pacientes columns:', Object.keys(pData[0] || {}));
    else console.log('Pacientes error:', pError.message);

    // Check medicos
    const { data: mData, error: mError } = await supabase.from('medicos').select('*').limit(1);
    if (mData) console.log('Medicos columns:', Object.keys(mData[0] || {}));
    else console.log('Medicos error:', mError.message);
    
    // Check solicitacoes_cirurgia
    const { data: sData, error: sError } = await supabase.from('solicitacoes_cirurgia').select('*').limit(1);
    if (sData) console.log('Solicitacoes_cirurgia columns:', Object.keys(sData[0] || {}));
    else console.log('Solicitacoes_cirurgia error:', sError.message);
}

checkSchema();
