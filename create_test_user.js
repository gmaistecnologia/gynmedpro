const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple .env.local parser since dotenv is not installed
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

async function createTestUser() {
  const email = 'test@gynmed.com.br';
  const password = 'Password@123';
  
  console.log('Using URL:', env.NEXT_PUBLIC_SUPABASE_URL);

  // 1. Create user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError && authError.message !== 'User already registered') {
    // If user exists, it's fine
    if (authError.message.includes('already registered')) {
        console.log('User already exists in Auth');
    } else {
        console.error('Error creating auth user:', authError);
        return;
    }
  }

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  const userId = user?.id;

  if (!userId) {
    console.error('Could not find user ID');
    return;
  }

  // 2. Create profile in usuarios
  const { error: profileError } = await supabase
    .from('usuarios')
    .upsert({
      id: userId,
      nome_completo: 'Test Admin',
      role: 'admin'
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    return;
  }

  console.log('Test user created/updated:', email, 'ID:', userId);
}

createTestUser();
