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

async function testIncremental() {
  console.log('Iniciando teste de geração incremental do Agente 5...');
  
  // 1. Busca material existente
  const url = envVars.SUPABASE_URL + '/rest/v1/legislacao_materiais_concurso?id=eq.6f8fc02a-b904-428b-8664-d8697105ba00';
  const res = await fetch(url, {
    headers: {
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY)
    }
  });
  const data = await res.json();
  const materialExistente = data[0];
  const questoesExistentes = materialExistente.questoes || [];
  const flashcardsExistentes = materialExistente.flashcards || [];
  console.log(`Questões atuais no banco: ${questoesExistentes.length}`);

  // 2. Busca artigos da LGPD
  const urlArtigos = envVars.SUPABASE_URL + '/rest/v1/legislacao_artigos?legislacao_id=eq.58fb400f-5e99-4dcc-98df-634cd543af28&order=ordem.asc&limit=30';
  const resArt = await fetch(urlArtigos, {
    headers: {
      apikey: envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + (envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_ANON_KEY)
    }
  });
  const artigos = await resArt.json();

  const prompt = `Gere 10 novas questões inéditas (Múltipla Escolha e Certo/Errado) e 5 novos flashcards para a LGPD (Lei 13.709/2018), focando nos artigos ${artigos.slice(10, 25).map(a => a.numero).join(', ')}.
Evite duplicar as 45 questões anteriores.
Responda EXCLUSIVAMENTE em JSON no formato:
{
  "questoes": [
    {
      "id": "q-new-1",
      "tipo": "multipla_escolha",
      "artigo_numero": "11",
      "assunto": "Tratamento de Dados Sensíveis",
      "dificuldade": "medio",
      "prioridade": "alta",
      "enunciado": "...",
      "alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
      "gabarito": "A",
      "justificativa": "...",
      "justificativas_alternativas": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." }
    }
  ],
  "flashcards": [
    {
      "id": "fc-new-1",
      "artigo_numero": "11",
      "pergunta": "...",
      "resposta": "...",
      "assunto": "...",
      "dificuldade": "medio",
      "prioridade": "alta"
    }
  ]
}`;

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });

  console.log('Chamando Gemini 3.5 Flash...');
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);
  console.log(`Novas questões geradas pela IA: ${parsed.questoes?.length || 0}`);
  console.log(`Novos flashcards gerados pela IA: ${parsed.flashcards?.length || 0}`);

  // 3. Mescla com os existentes
  const novasQuestoesAjustadas = (parsed.questoes || []).map((q, idx) => ({
    ...q,
    id: `q-${questoesExistentes.length + idx + 1}`,
  }));
  const novosFlashcardsAjustados = (parsed.flashcards || []).map((f, idx) => ({
    ...f,
    id: `fc-${flashcardsExistentes.length + idx + 1}`,
  }));

  const questoesTotal = [...questoesExistentes, ...novasQuestoesAjustadas];
  const flashcardsTotal = [...flashcardsExistentes, ...novosFlashcardsAjustados];

  console.log(`Total consolidado após merge: ${questoesTotal.length} questões, ${flashcardsTotal.length} flashcards.`);

  // 4. Salva no banco
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
      questoes: questoesTotal,
      flashcards: flashcardsTotal,
      metas: {
        questoes_geradas: questoesTotal.length,
        flashcards_gerados: flashcardsTotal.length,
        questoes_planejadas: questoesTotal.length,
        flashcards_planejados: flashcardsTotal.length
      },
      resumo: {
        total_questoes: questoesTotal.length,
        total_flashcards: flashcardsTotal.length,
        total_casos_praticos: 0
      }
    })
  });

  const updated = await patchRes.json();
  console.log('✅ Salvo com sucesso no Supabase! Total no banco:', updated[0]?.questoes?.length);
}

testIncremental();
