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

async function check() {
  // Try to find status from existing records first, or querying pg_enum
  const { data, error } = await supabase.rpc('execute_sql', { 
    query: "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'solicitacao_status'" 
  });

  if (error) {
    console.error('Error fetching enums:', error.message);
    // If execute_sql RPC doesn't exist, try to list a few rows and check column
    const { data: rows } = await supabase.from('solicitacoes_cirurgia').select('status_atual').limit(5);
    console.log('Sample statuses from table:', rows);
  } else {
    console.log('Enum labels:', data);
  }
}

check();
