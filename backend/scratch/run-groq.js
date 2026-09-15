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

async function runGroqTest() {
  console.log('--- TESTANDO GERAÇÃO INCREMENTAL VIA FALLBACK GROQ ---');
  
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
  const qAntigas = materialExistente.questoes || [];
  const fAntigos = materialExistente.flashcards || [];
  console.log('Questões atuais antes da nova rodada:', qAntigas.length);

  const prompt = `Gere 10 novas questões de concurso inéditas (5 Múltipla Escolha com alternativas A-E e 5 Certo/Errado) e 5 novos flashcards para a LGPD (Lei 13.709/2018), focando nos Artigos 11 ao 25 (Dados Sensíveis e Poder Público).
Responda EXCLUSIVAMENTE em JSON no seguinte formato:
{
  "questoes": [
    {
      "id": "q-1",
      "tipo": "multipla_escolha",
      "artigo_numero": "11",
      "assunto": "Tratamento de Dados Sensíveis",
      "dificuldade": "medio",
      "prioridade": "alta",
      "enunciado": "Nos termos da LGPD, o tratamento de dados pessoais sensíveis...",
      "alternativas": {
        "A": "Depende sempre de consentimento, sem qualquer hipótese de dispensa.",
        "B": "Pode ocorrer sem consentimento do titular nas hipóteses de cumprimento de obrigação legal ou regulatória pelo controlador.",
        "C": "É vedado a qualquer órgão da administração pública.",
        "D": "Pode ser dispensado caso o titular seja pessoa jurídica.",
        "E": "Exige autorização prévia e expressa da Autoridade Nacional de Proteção de Dados."
      },
      "gabarito": "B",
      "justificativa": "O Art. 11, II, 'a' da LGPD prevê expressamente a dispensa de consentimento para cumprimento de obrigação legal ou regulatória.",
      "justificativas_alternativas": {
        "A": "Incorreta. Existem hipóteses legais de dispensa no Art. 11, II.",
        "B": "Correta. Conforme Art. 11, II, 'a'.",
        "C": "Incorreta. A administração pública pode tratar dados sensíveis.",
        "D": "Incorreta. A LGPD tutela pessoas naturais.",
        "E": "Incorreta. Não há exigência de autorização prévia da ANPD."
      }
    }
  ],
  "flashcards": [
    {
      "id": "fc-1",
      "artigo_numero": "11",
      "pergunta": "Quando é dispensado o consentimento para tratamento de dados sensíveis?",
      "resposta": "Para cumprimento de obrigação legal, políticas públicas, estudos por órgãos de pesquisa, exercício regular de direitos, proteção da vida, tutela da saúde e prevenção a fraudes.",
      "assunto": "Dados Sensíveis",
      "dificuldade": "medio",
      "prioridade": "alta"
    }
  ]
}`;

  const t0 = Date.now();
  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + envVars.GROQ_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });
  const groqData = await groqRes.json();
  const dur = (Date.now() - t0) / 1000;
  console.log(`Resposta Groq recebida em ${dur}s!`);
  const parsed = JSON.parse(groqData.choices[0].message.content);
  console.log('Novas questões geradas pela IA:', parsed.questoes?.length);
  console.log('Novos flashcards gerados pela IA:', parsed.flashcards?.length);

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

  console.log(`Salvando no Supabase: ${qAntigas.length} existentes + ${novasQ.length} novas = ${qTotal.length} QUESTÕES TOTAIS.`);

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
  console.log('✅ BANCO ATUALIZADO COM SUCESSO! Total atual no Supabase:', saved[0]?.questoes?.length, 'questões e', saved[0]?.flashcards?.length, 'flashcards!');
}
runGroqTest();
