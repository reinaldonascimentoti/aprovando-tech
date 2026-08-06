import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as ws from 'ws';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws as any }
});

async function run() {
  console.log('Buscando editais no Supabase...');
  const { data: editais, error } = await supabase.from('editais').select('id, title, cargo, pareto_data');
  if (error) {
    console.error('Erro:', error);
    return;
  }
  console.log(`Encontrados ${editais?.length} editais:`);
  for (const e of editais || []) {
    console.log(`- ID: ${e.id} | Title: ${e.title} | Cargo: ${e.cargo}`);
    console.log(`   pareto_analisado: ${e.pareto_data?.pareto_analisado}`);
    console.log(`   mapa_geral basicas: ${e.pareto_data?.mapa_geral?.disciplinas_basicas?.length}`);
    console.log(`   mapa_geral especificas: ${e.pareto_data?.mapa_geral?.disciplinas_especificas?.length}`);
  }
}

run();
