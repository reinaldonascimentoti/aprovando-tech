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
process.env.GOOGLE_AI_API_KEY = envVars.GOOGLE_AI_API_KEY || envVars.GEMINI_API_KEY;

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testFast() {
  console.log('--- TESTE GERACAO AGENTE 5 ---');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  
  const prompt = `# AGENTE 5 — GERADOR DE QUESTOES (LOTE COMPLEMENTAR)
Gere 10 novas questoes de concurso (5 Multipla Escolha com 5 alternativas A-E e 5 Certo/Errado) e 5 flashcards sobre a LGPD (Lei 13.709/2018), focando nos Artigos 11 ao 25 (Tratamento de Dados Sensiveis e Poder Publico).

Cada questao de multipla escolha DEVE ter justificativas individuais para as alternativas A, B, C, D e E.
Responda EXCLUSIVAMENTE em JSON no seguinte formato:
{
  "questoes": [
    {
      "id": "q-1",
      "tipo": "multipla_escolha",
      "artigo_numero": "11",
      "assunto": "Dados Sensíveis",
      "dificuldade": "medio",
      "prioridade": "alta",
      "enunciado": "Com base na LGPD...",
      "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "gabarito": "A",
      "justificativa": "...",
      "justificativas_alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." }
    },
    {
      "id": "q-2",
      "tipo": "certo_errado",
      "artigo_numero": "14",
      "assunto": "Dados de Crianças e Adolescentes",
      "dificuldade": "facil",
      "prioridade": "alta",
      "enunciado": "O consentimento para tratamento...",
      "gabarito": "certo",
      "justificativa": "..."
    }
  ],
  "flashcards": [
    {
      "id": "fc-1",
      "artigo_numero": "11",
      "pergunta": "...",
      "resposta": "...",
      "assunto": "...",
      "dificuldade": "medio",
      "prioridade": "alta"
    }
  ],
  "pegadinhas": []
}`;

  const t0 = Date.now();
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  console.log('Enviando para Gemini 3.5 Flash...');
  const res = await model.generateContent(prompt);
  const dur = (Date.now() - t0) / 1000;
  console.log(`Resposta recebida em ${dur}s!`);
  const parsed = JSON.parse(res.response.text());
  console.log(`Questões geradas: ${parsed.questoes?.length}, Flashcards: ${parsed.flashcards?.length}`);
  
  // Agora vamos mesclar com o registro no Supabase
  const url = envVars.SUPABASE_URL + '/rest/v1/legislacao_materiais_concurso?id=eq.6f8fc02a-b904-428b-8664-d8697105ba00';
  const getRes = await fetch(url, {
    headers: {
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY)
    }
  });
  const data = await getRes.json();
  const mat = data[0];
  const qAntigas = mat?.questoes || [];
  const fAntigos = mat?.flashcards || [];

  const novasQ = (parsed.questoes || []).map((q, idx) => ({
    ...q,
    id: `q-${qAntigas.length + idx + 1}`
  }));
  const novosF = (parsed.flashcards || []).map((f, idx) => ({
    ...f,
    id: `fc-${fAntigos.length + idx + 1}`
  }));

  const qTotal = [...qAntigas, ...novasQ];
  const fTotal = [...fAntigos, ...novosF];

  console.log(`Salvando no banco: ${qAntigas.length} anteriores + ${novasQ.length} novas = ${qTotal.length} QUESTÕES TOTAIS.`);

  const patchRes = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY),
      Prefer: 'return=representation'
    },
    body: JSON.stringify({
      status: 'concluido',
      questoes: qTotal,
      flashcards: fTotal,
      metas: {
        questoes_geradas: qTotal.length,
        flashcards_gerados: fTotal.length,
        questoes_planejadas: qTotal.length,
        flashcards_planejados: fTotal.length
      },
      resumo: {
        total_questoes: qTotal.length,
        total_flashcards: fTotal.length,
        total_casos_praticos: 0
      }
    })
  });
  const saved = await patchRes.json();
  console.log('✅ BANCO ATUALIZADO COM SUCESSO! Total atual no Supabase:', saved[0]?.questoes?.length);
}

testFast();
