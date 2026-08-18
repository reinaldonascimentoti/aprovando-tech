import * as dotenv from 'dotenv';
import * as path from 'path';
import { SupabaseService } from '../services/supabase.service';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const sampleQuestions = [
  {
    "disciplina": "BANCO DE DADOS",
    "id_qc": "Q4158861",
    "banca": "FCC",
    "ano": 2026,
    "orgao": "AL-RR",
    "cargo": "Analista Legislativo",
    "assunto": "Segurança",
    "tipo": "multipla_escolha",
    "enunciado": "Um analista de segurança da informação é responsável por proteger um banco de dados corporativo...",
    "alternativas": [
      { "letra": "A", "texto": "usar criptografia de coluna usando AES-256..." },
      { "letra": "B", "texto": "substituir por NoSQL..." }
    ],
    "resposta_correta": "A"
  }
];

async function runTest() {
  console.log('🧪 Iniciando teste de importação e transformação de JSON das questões...\n');

  const supabaseService = new SupabaseService();

  console.log('--- [1] Teste de Inserção/Upsert no Supabase ---');
  if (supabaseService.getIsConfigured()) {
    const result = await supabaseService.importJsonQuestions(sampleQuestions);
    console.log(`✅ Inserção/Atualização no Supabase finalizada com ${result.length} questões.`);
    console.log(JSON.stringify(result, null, 2));
  }
}

runTest();
