import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as ws from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as any },
});

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  if (error) {
    console.error('Erro:', error);
    return;
  }
  console.log('Total de usuários:', users.length);
  for (const u of users) {
    console.log({
      id: u.id,
      email: u.email,
      confirmed_at: u.email_confirmed_at,
      confirmation_sent_at: u.confirmation_sent_at,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
    });
  }
}

main().catch(console.error);
