import { LangChainOpenAIService } from './src/services/langchain-openai.service';
import * as dotenv from 'dotenv';
dotenv.config();

const s = new LangChainOpenAIService();
s.extractEditalMapaOnly('Conteúdo programático. Cargo: Auditor. Disciplinas: 1. Direito Constitucional. 2. Direito Administrativo', 'Edital Teste', { cargo: 'Auditor', concurso: null, dataProva: null, horasPorDia: null, diasPorSemana: null })
  .then(res => console.log(JSON.stringify(res, null, 2)))
  .catch(console.error);
