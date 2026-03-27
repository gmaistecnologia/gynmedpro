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
    const { data: roleData, error: roleError } = await supabase.from('usuarios').select('role').limit(1);
    console.log('Role query error:', roleError ? roleError.message : 'None (exists)');

    const { data: perfilData, error: perfilError } = await supabase.from('usuarios').select('perfil').limit(1);
    console.log('Perfil query error:', perfilError ? perfilError.message : 'None (exists)');
}

check();
