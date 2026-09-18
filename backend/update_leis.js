const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Atualizando legislações...');

  const updates = [
    { ramo: 'Direito Digital', match: '%LGPD%' },
    { ramo: 'Direito Digital', match: '%Lei Geral de Proteção de Dados Pessoais%' },
    { ramo: 'Direito Administrativo', match: '%LAI%' },
    { ramo: 'Direito Administrativo', match: '%Lei de Acesso à Informação%' },
    { ramo: 'Direito Civil', match: '%Marco Civil da Internet%' },
    { ramo: 'Direito Administrativo', match: '%Decreto de acesso a informação no âmbito do Poder Executivo Federal%' },
  ];

  for (const update of updates) {
    const { data, error } = await supabase
      .from('legislacoes')
      .update({ ramo_direito: update.ramo })
      .ilike('titulo', update.match);

    if (error) {
      console.error(`Erro ao atualizar para ${update.match}:`, error.message);
    } else {
      console.log(`Sucesso para ${update.match}`);
    }
  }

  console.log('Finalizado.');
}

main();
