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

async function updateSchema() {
  const { data, error } = await supabase.rpc('execute_sql_internal', {
    sql_query: `
      ALTER TABLE IF EXISTS usuarios ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'representante';
      
      -- Let's check if we can actually run plain SQL here. 
      -- If RPC doesn't exist, we might need another way.
    `
  });

  if (error) {
    console.log('RPC Error (might not exist):', error.message);
    
    // Alternative: Use a direct SQL query if we can find a way, 
    // but typically Supabase JS SDK doesn't allow DDL directly 
    // unless you have an RPC defined for it.
  }
}

async function checkColumns() {
    // We can't easily check columns without information_schema, 
    // but we can try to select from the table and see what we get.
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1);
    
    if (data && data.length > 0) {
        console.log('Columns in usuarios:', Object.keys(data[0]));
    } else {
        console.log('No data in usuarios table or table empty.');
    }
}

checkColumns();
