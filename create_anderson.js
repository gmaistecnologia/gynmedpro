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

async function createAnderson() {
  const email = 'anderson@gynmed.com.br';
  const name = 'ANDERSON ALCANTARA DE OLIVEIRA';
  const password = 'Password@123';

  console.log('--- CREATING ANDERSON ---');

  // Check if exists
  const { data: existingUser } = await supabase.from('usuarios').select('id').eq('email', email).maybeSingle();
  if (existingUser) {
    console.log('User already exists in usuarios table:', existingUser.id);
    return;
  }

  // Create in Auth
  const { data: auth, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (authError && authError.message !== 'Emails are disabled' && authError.message !== 'User already registered') {
    // Note: in local dev, email might succeed or fail depending on config.
    console.log('User already in auth or error:', authError.message);
  }

  const { data: list } = await supabase.auth.admin.listUsers();
  const userId = list.users.find(u => u.email === email)?.id;

  if (!userId) {
    console.error('Could not get User ID');
    return;
  }

  // Create Profile
  const { error: profileError } = await supabase.from('usuarios').insert({
    id: userId,
    email,
    nome_completo: name,
    role: 'representante',
    funcao_role: 'Representante'
  });

  if (profileError) console.error('Profile Error:', profileError.message);
  else console.log('SUCCESS: Anderson created with ID:', userId);
}

createAnderson();
