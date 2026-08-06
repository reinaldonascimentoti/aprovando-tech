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
  const ids = ['9d7051b9-ab50-404c-9c2d-0de69703d5d6', 'edital-bnb-2022'];
  
  for (const id of ids) {
    console.log(`\n==================================================`);
    console.log(`Buscando edital ID: ${id}...`);
    const { data: ed, error } = await supabase.from('editais').select('*').eq('id', id).single();
    if (error || !ed) {
      console.error(`Erro ao buscar edital ${id}:`, error?.message);
      continue;
    }
    
    console.log(`Iniciando Análise Pareto para ${ed.title} (ID: ${ed.id})...`);
    // Faz a chamada HTTP para o backend NestJS local para atualizar o edital no Supabase
    try {
      const res = await fetch(`http://localhost:3000/api/editais/${id}/analisar-pareto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      console.log(`Status HTTP: ${res.status}`);
      if (res.ok && data?.pareto_data?.pareto_analisado) {
        console.log(`✅ Sucesso! Pareto para "${ed.title}" atualizado e salvo no Supabase.`);
        console.log(`   - Disciplinas básicas: ${data.pareto_data.mapa_geral?.disciplinas_basicas?.length}`);
        console.log(`   - Disciplinas específicas: ${data.pareto_data.mapa_geral?.disciplinas_especificas?.length}`);
      } else {
        console.error(`❌ Erro no retorno:`, data);
      }
    } catch (e: any) {
      console.error(`❌ Falha na requisição HTTP:`, e.message);
    }
  }
}

run();
