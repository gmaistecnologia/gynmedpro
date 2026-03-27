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

async function check() {
    const { data: repData, error: repError } = await supabase.from('solicitacoes_cirurgia').select('representante_responsavel_id').limit(1);
    console.log('Representante column error:', repError ? repError.message : 'None (exists)');
}

check();
