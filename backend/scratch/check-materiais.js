const fs = require('fs');
const env = fs.readFileSync('.env.development', 'utf8');
const lines = env.split('\n');
const envVars = {};
lines.forEach(l => {
  const parts = l.split('=');
  if (parts.length >= 2 && !parts[0].startsWith('#')) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});
async function check() {
  const url = envVars.SUPABASE_URL + '/rest/v1/legislacao_materiais_concurso?select=id,legislacao_id,status,questoes,flashcards,metas,cobertura,resumo,created_at,updated_at';
  const res = await fetch(url, {
    headers: {
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY)
    }
  });
  const data = await res.json();
  if (!data || !data.length) {
    console.log('Nenhum material de concurso encontrado no banco.');
    return;
  }
  data.forEach((m, idx) => {
    console.log('=== Material [' + (idx + 1) + '] ===');
    console.log('ID:', m.id);
    console.log('Legislação ID:', m.legislacao_id);
    console.log('Status:', m.status);
    console.log('Total Questoes:', Array.isArray(m.questoes) ? m.questoes.length : 0);
    console.log('Total Flashcards:', Array.isArray(m.flashcards) ? m.flashcards.length : 0);
    console.log('Metas:', JSON.stringify(m.metas, null, 2));
    console.log('Cobertura:', JSON.stringify(m.cobertura, null, 2));
    console.log('Resumo:', JSON.stringify(m.resumo, null, 2));
    console.log('Atualizado em:', m.updated_at);
    if (Array.isArray(m.questoes) && m.questoes.length > 0) {
      console.log('Primeira questão:', m.questoes[0].id, 'Art:', m.questoes[0].artigo_numero);
      console.log('Ultima questão:', m.questoes[m.questoes.length - 1].id, 'Art:', m.questoes[m.questoes.length - 1].artigo_numero);
    }
  });
}
check();
