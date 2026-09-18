import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel, SchemaType } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { ChatOpenAI } from '@langchain/openai';
import { EditalUserContext } from '../modules/editais/editais.types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
/**
 * DEFINIÇÃO DO SCHEMA ESTRUTURADO (JSON Schema via SchemaType para Gemini File API)
 */
export const schemaConteudoProgramatico = {
  type: SchemaType.OBJECT,
  properties: {
    edital: { type: SchemaType.STRING },
    cargo: { type: SchemaType.STRING },
    conteudo_programatico: {
      type: SchemaType.OBJECT,
      properties: {
        conhecimentos_gerais: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              disciplina: { type: SchemaType.STRING },
              topicos: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    nome: { type: SchemaType.STRING },
                    subtopicos: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING }
                    }
                  },
                  required: ['nome', 'subtopicos']
                }
              }
            },
            required: ['disciplina', 'topicos']
          }
        },
        conhecimentos_especificos: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              disciplina: { type: SchemaType.STRING },
              topicos: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    nome: { type: SchemaType.STRING },
                    subtopicos: {
                      type: SchemaType.ARRAY,
                      items: { type: SchemaType.STRING }
                    }
                  },
                  required: ['nome', 'subtopicos']
                }
              }
            },
            required: ['disciplina', 'topicos']
          }
        }
      },
      required: ['conhecimentos_gerais', 'conhecimentos_especificos']
    }
  },
  required: ['edital', 'cargo', 'conteudo_programatico']
};

/**
 * DEFINIÇÃO DO SCHEMA ESTRUTURADO (Zod para LangChain/Groq/OpenAI)
 */
export const zodSchemaConteudoProgramatico = z.object({
  edital: z.string().optional(),
  cargo: z.string().optional(),
  conteudo_programatico: z.object({
    conhecimentos_gerais: z.array(z.object({
      disciplina: z.string(),
      topicos: z.array(z.object({
        nome: z.string(),
        subtopicos: z.array(z.string())
      }))
    })),
    conhecimentos_especificos: z.array(z.object({
      disciplina: z.string(),
      topicos: z.array(z.object({
        nome: z.string(),
        subtopicos: z.array(z.string())
      }))
    }))
  })
});

/**
 * Wrapper unificado para invocar modelos (Gemini nativo ou LangChain/Groq).
 * Garante que ambos os providers retornem texto via a mesma interface.
 */
interface LLMProvider {
  invoke(prompt: string): Promise<string>;
  invokeStructured?<T>(prompt: string, schema: any): Promise<T | null>;
  name: string;
}

class GeminiProvider implements LLMProvider {
  name = 'Google Gemini (gemini-3.6-flash / gemini-3.5-flash / gemini-3.5-flash-lite)';
  private models: { name: string; model: GenerativeModel; jsonModel: GenerativeModel }[];

  constructor(genAI: GoogleGenerativeAI, private logger: Logger) {
    const candidates = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    this.models = candidates.map(name => ({
      name,
      model: genAI.getGenerativeModel({
        model: name,
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 65536,
        },
      }),
      jsonModel: genAI.getGenerativeModel({
        model: name,
        generationConfig: {
          temperature: 0.0,
          maxOutputTokens: 65536,
          responseMimeType: 'application/json',
        },
      })
    }));
  }

  async invoke(prompt: string): Promise<string> {
    let lastError: any = null;
    for (const item of this.models) {
      try {
        const result = await item.model.generateContent(prompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`⚠️ Modelo Gemini [${item.name}] falhou (${err.message}). Tentando próximo modelo Gemini...`);
      }
    }
    throw lastError || new Error('Nenhum modelo Gemini respondeu');
  }

  async invokeStructured<T>(prompt: string, schema: any): Promise<T | null> {
    let lastError: any = null;
    for (const item of this.models) {
      try {
        const jsonPrompt = `${prompt}\n\nATENÇÃO: Retorne a resposta ESTRITAMENTE em formato JSON válido conforme o esquema solicitado. Não inclua texto introdutório ou explicações fora do JSON.`;
        const result = await item.jsonModel.generateContent(jsonPrompt);
        const text = result.response.text();
        if (text && text.trim().length > 0) {
          const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          const matchObj = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          const raw = matchObj ? matchObj[0] : cleaned;
          const parsed = JSON.parse(raw);
          if (parsed) return parsed as T;
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`⚠️ Gemini invokeStructured [${item.name}] falhou (${err.message}). Tentando próximo modelo Gemini...`);
      }
    }
    // Fallback: tenta invoke com parsing JSON simples
    try {
      const text = await this.invoke(`${prompt}\n\nATENÇÃO: Responda EXCLUSIVAMENTE em formato JSON.`);
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const matchObj = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const parsed = JSON.parse(matchObj ? matchObj[0] : cleaned);
      if (parsed) return parsed as T;
    } catch (e: any) {
      this.logger.warn(`⚠️ Fallback Gemini invokeStructured via invoke() falhou: ${e.message}`);
    }
    return null;
  }
}

class GroqProvider implements LLMProvider {
  name = 'Groq LLMs (Llama 3.3 70B -> Llama 3.1 8B -> Mixtral)';
  private models: { name: string; model: ChatOpenAI }[];

  constructor(apiKey: string, private logger: Logger) {
    const candidateModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768'
    ];
    this.models = candidateModels.map(mName => ({
      name: mName,
      model: new ChatOpenAI({
        apiKey: apiKey,
        modelName: mName,
        temperature: 0.0,
        timeout: 120000,
        maxRetries: 1,
        configuration: { baseURL: 'https://api.groq.com/openai/v1' },
      })
    }));
  }

  async invoke(prompt: string): Promise<string> {
    let lastErr: any = null;
    for (const item of this.models) {
      try {
        const response = await item.model.invoke(prompt);
        const text = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastErr = err;
        this.logger.warn(`⚠️ Groq modelo [${item.name}] falhou (${err.message}). Tentando próximo modelo do Groq...`);
      }
    }
    throw lastErr || new Error('Todos os modelos do Groq falharam.');
  }

  async invokeStructured<T>(prompt: string, schema: any): Promise<T | null> {
    let lastErr: any = null;
    for (const item of this.models) {
      try {
        const modelWithStructure = item.model.withStructuredOutput(schema);
        const response = await modelWithStructure.invoke(prompt);
        if (response) return response as T;
      } catch (err: any) {
        lastErr = err;
        this.logger.warn(`⚠️ Groq modelo [${item.name}] falhou estruturado (${err.message})...`);
      }
    }
    return null;
  }
}

class OpenAIProvider implements LLMProvider {
  name = 'OpenAI (gpt-4o-mini)';
  constructor(private model: ChatOpenAI) { }

  async invoke(prompt: string): Promise<string> {
    const response = await this.model.invoke(prompt);
    return typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);
  }

  async invokeStructured<T>(prompt: string, schema: any): Promise<T | null> {
    const modelWithStructure = this.model.withStructuredOutput(schema);
    const response = await modelWithStructure.invoke(prompt);
    return response as T;
  }
}

class FallbackLLMProvider implements LLMProvider {
  name: string;

  constructor(private providers: LLMProvider[], private logger: Logger) {
    this.name = providers.map(p => p.name).join(' -> ');
  }

  async invoke(prompt: string): Promise<string> {
    let lastError: any = null;
    for (const p of this.providers) {
      try {
        const result = await p.invoke(prompt);
        return result;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`⚠️ Provedor [${p.name}] falhou (${err.message}). Redirecionando automaticamente para o próximo provedor...`);
      }
    }
    throw lastError || new Error('Todos os provedores de LLM configurados falharam.');
  }

  async invokeStructured<T>(prompt: string, schema: any): Promise<T | null> {
    let lastError: any = null;
    for (const p of this.providers) {
      if (!p.invokeStructured) continue;
      try {
        const result = await p.invokeStructured<T>(prompt, schema);
        if (result) return result;
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`⚠️ Provedor Estruturado [${p.name}] falhou (${err.message}). Redirecionando para próximo provedor...`);
      }
    }

    // Se invokeStructured retornar null ou falhar em todos os provedores estruturados, tenta invoke() nos provedores disponíveis
    try {
      this.logger.warn('⚠️ invokeStructured não obteve resultado válido dos provedores. Tentando invoke() nos provedores ativos...');
      const textResult = await this.invoke(`${prompt}\n\nATENÇÃO: Responda EXCLUSIVAMENTE em formato JSON.`);
      if (textResult) {
        const cleaned = textResult.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const matchObj = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const parsed = JSON.parse(matchObj ? matchObj[0] : cleaned);
        if (parsed) return parsed as T;
      }
    } catch (fallbackErr: any) {
      this.logger.error(`⚠️ Fallback de invokeStructured via invoke() falhou: ${fallbackErr.message}`);
    }

    if (lastError) throw lastError;
    return null;
  }
}

@Injectable()
export class LangChainOpenAIService {
  private readonly logger = new Logger(LangChainOpenAIService.name);
  private provider: LLMProvider | null = null;

  constructor() {
    const activeProviders: LLMProvider[] = [];

    // --- Prioridade 1: Google Gemini Flash ---
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (googleKey && googleKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(googleKey);
        activeProviders.push(new GeminiProvider(genAI, this.logger));
        this.logger.log('✅ Provedor Gemini preparado como Prioridade 1 (gemini-3.6-flash / gemini-3.5-flash)');
      } catch (err) {
        this.logger.warn(`Falha ao preparar Gemini: ${err.message}`);
      }
    }

    // --- Prioridade 2: Groq (Com Failover interno Llama 3.3 70B -> Llama 3.1 8B Instant) ---
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.startsWith('gsk_')) {
      try {
        activeProviders.push(new GroqProvider(groqKey, this.logger));
        this.logger.log('✅ Provedor Groq preparado com resiliência multi-modelo (70B -> 8B Instant -> Mixtral)');
      } catch (err) {
        this.logger.warn(`Falha ao preparar Groq: ${err.message}`);
      }
    }

    // --- Prioridade 3: OpenAI (GPT-4o-mini / GPT-3.5) ---
    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey && openAIKey.startsWith('sk-')) {
      try {
        const openAIModel = new ChatOpenAI({
          apiKey: openAIKey,
          modelName: 'gpt-4o-mini',
          temperature: 0.0,
          timeout: 120000,
          maxRetries: 2,
        });
        activeProviders.push(new OpenAIProvider(openAIModel));
        this.logger.log('✅ Provedor OpenAI (gpt-4o-mini) preparado');
      } catch (err) {
        this.logger.warn(`Falha ao preparar OpenAI: ${err.message}`);
      }
    }

    if (activeProviders.length > 0) {
      this.provider = new FallbackLLMProvider(activeProviders, this.logger);
      this.logger.log(`✅ Serviço LLM Resiliente ativo com a cadeia: ${this.provider.name}`);
    } else {
      this.logger.error('❌ NENHUM provedor LLM disponível. As análises de edital NÃO funcionarão.');
    }
  }

  // ===========================================================================
  // Utilitários de parsing JSON
  // ===========================================================================

  /**
   * Extrai e parseia JSON de uma resposta do LLM, limpando markdown code fences.
   * Não lança erro fatal se o modelo responder com texto conversacional sem JSON.
   */
  private parseJsonResponse(content: string, etapa: string = 'desconhecida'): any {
    if (!content || typeof content !== 'string') {
      return {};
    }

    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // 1. Tenta extrair o primeiro objeto JSON válido { ... }
    const matchObj = cleaned.match(/\{[\s\S]*\}/);
    if (matchObj) {
      try {
        return JSON.parse(matchObj[0]);
      } catch (e) {
        this.logger.warn(`[${etapa}] Falha ao parsear matchObj: ${e.message}`);
      }
    }

    // 2. Tenta extrair o primeiro array JSON válido [ ... ]
    const matchArr = cleaned.match(/\[[\s\S]*\]/);
    if (matchArr) {
      try {
        return JSON.parse(matchArr[0]);
      } catch (e) {
        this.logger.warn(`[${etapa}] Falha ao parsear matchArr: ${e.message}`);
      }
    }

    // 3. Tenta parsear o conteúdo limpo inteiro
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const preview = content.substring(0, 300) + (content.length > 300 ? '...' : '');
      this.logger.warn(`[${etapa}] O modelo retornou texto conversacional sem objeto JSON. Resposta: "${preview}"`);
      return {
        _raw_text: cleaned,
        conteudo_programatico: { conhecimentos_gerais: [], conhecimentos_especificos: [] }
      };
    }
  }

  // ===========================================================================
  // Extração de Questões de PDFs de Aula
  // ===========================================================================

  /**
   * Extract multiple choice questions from raw text of a lesson PDF, including Quality Analysis metrics
   */
  async extractQuestionsFromPdfText(pdfText: string, filename: string): Promise<any[]> {
    if (!this.provider) {
      this.logger.error('Nenhum provedor LLM disponível para extração de questões.');
      return [];
    }

    try {
      const chunkSize = 25000;
      const overlap = 2000;
      const chunks: string[] = [];

      let start = 0;
      while (start < pdfText.length) {
        const end = Math.min(start + chunkSize, pdfText.length);
        chunks.push(pdfText.substring(start, end));
        if (end === pdfText.length) break;
        start += chunkSize - overlap;
      }

      this.logger.log(`Texto extraído possui ${pdfText.length} caracteres. Dividido em ${chunks.length} blocos para extração.`);

      const allQuestions: any[] = [];

      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Extraindo questões do bloco ${i + 1}/${chunks.length}...`);
        const chunkQuestions = await this.extractFromChunk(chunks[i], filename);
        allQuestions.push(...chunkQuestions);
      }

      // De-duplicate questions by statement
      const seenStatements = new Set<string>();
      const uniqueQuestions = allQuestions.filter(q => {
        const normalizedStatement = (q.statement || q.enunciado || '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!normalizedStatement || seenStatements.has(normalizedStatement)) {
          return false;
        }
        seenStatements.add(normalizedStatement);
        return true;
      });

      this.logger.log(`Extração concluída. Total: ${allQuestions.length} extraídas, ${uniqueQuestions.length} únicas.`);
      return uniqueQuestions;
    } catch (error) {
      this.logger.error(`Falha na extração em lote: ${error.message}.`);
      return [];
    }
  }

  private async extractFromChunk(chunkText: string, filename: string): Promise<any[]> {
    if (!this.provider) return [];

    try {
      const prompt = `Você é um especialista em exames, concursos públicos e psicometria educacional. 
Analise o texto a seguir extraído de um bloco do PDF de aula "${filename}" e extraia todas as questões da aula (sejam de múltipla escolha ou de certo/errado).

## REGRA FUNDAMENTAL
- Extraia SOMENTE questões que existem LITERALMENTE no texto abaixo.
- NÃO invente, NÃO complete, NÃO crie questões que não estejam no texto.
- No campo "statement" (enunciado), se a questão possuir itens enumerados em algarismos romanos (ex: I, II, III, IV, etc.), insira quebras de linha (\\n) antes de cada item para que fiquem em linhas separadas e o texto fique bem formatado/justificado.
- Se não houver questões no texto, retorne um array vazio: []

Diferencie as questões pelo campo "tipo":
- "multipla_escolha": se possuir alternativas de múltipla escolha.
- "certo_errado": se for uma questão de Certo ou Errado (Verdadeiro ou Falso).

Identifique e extraia também os seguintes metadados da questão quando disponíveis no cabeçalho ou texto:
- banca (organizadora, ex: "CESPE", "FGV", "FCC", "VUNESP")
- ano (ano da prova, ex: 2024, 2023)
- orgao (órgão público da prova, ex: "TRT 2ª Região", "Prefeitura de São Paulo")
- prova (cargo ou nome da prova, ex: "Auditor Fiscal", "Analista de Sistemas")

Se algum metadado NÃO estiver no texto, use null — NUNCA invente.

Para cada questão, faça também uma ANÁLISE DE QUALIDADE PSICOMÉTRICA (Quality Metrics).

Texto extraído da aula:
${chunkText}

Retorne a resposta EXCLUSIVAMENTE em formato JSON (Array de objetos), onde cada objeto tem exatamente a seguinte estrutura:
- tipo (string: "multipla_escolha" ou "certo_errado")
- statement (string: o enunciado da questão)
- alternativa_a (string ou null: texto da alternativa A se for múltipla escolha; null se for certo/errado)
- alternativa_b (string ou null: texto da alternativa B se for múltipla escolha; null se for certo/errado)
- alternativa_c (string ou null: texto da alternativa C se for múltipla escolha; null se for certo/errado)
- alternativa_d (string ou null: texto da alternativa D se for múltipla escolha; null se for certo/errado)
- alternativa_e (string ou null: texto da alternativa E se for múltipla escolha e houver uma 5ª alternativa; null caso contrário)
- correct_option (string ou null: "A", "B", "C", "D" ou "E" se for múltipla escolha; null se for certo/errado)
- resposta_boolean (boolean ou null: true se for certo/errado e o gabarito for Certo/Verdadeiro, false se for certo/errado e o gabarito for Errado/Falso; null se for múltipla escolha)
- explanation (string: explicação detalhada do gabarito)
- subject (string, ex: "Direito Constitucional")
- topic (string, ex: "Controle de Constitucionalidade")
- banca (string ou null: banca identificada, ex: "FGV")
- ano (number ou null: ano identificado, ex: 2024)
- orgao (string ou null: órgão identificado, ex: "TCU")
- prova (string ou null: prova/cargo identificado, ex: "Auditor")
- quality_metrics (objeto com:
    - clarity_score: number (1-10)
    - distractor_plausibility: number (1-10)
    - bloom_taxonomy: "Conhecimento" | "Compreensão" | "Aplicação" | "Análise"
    - difficulty_level: "Fácil" | "Médio" | "Difícil"
    - overall_quality_score: number (1-10)
    - quality_comments: string (análise da qualidade do enunciado e das alternativas/distratores)
  )`;

      const content = await this.provider.invoke(prompt);
      const parsed = this.parseJsonResponse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch (error) {
      this.logger.error(`Erro ao extrair do bloco: ${error.message}`);
      return [];
    }
  }

  // ===========================================================================
  // Utilitários de Extração de Texto de Edital e Debug
  // ===========================================================================

  private async saveDebugJson(cargo: string, parsed: any, provider: string): Promise<void> {
    try {
      const debugDir = path.join(process.cwd(), 'logs', 'extractions');
      await fs.promises.mkdir(debugDir, { recursive: true });
      
      const safeCargo = cargo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${safeCargo}_${provider}_${timestamp}.json`;
      const filePath = path.join(debugDir, filename);
      
      await fs.promises.writeFile(filePath, JSON.stringify(parsed, null, 2));
      this.logger.log(`[Debug] JSON da extração salvo em: ${filePath}`);
    } catch (err) {
      this.logger.warn(`[Debug] Falha ao salvar JSON de log: ${err.message}`);
    }
  }

  private getEditalTextSnippet(editalText: string, cargo?: string, secaoConteudo?: string): string {
    if (!editalText && !secaoConteudo) return '';

    let userSecaoSnippet = '';
    if (secaoConteudo && secaoConteudo.trim().length > 0) {
      userSecaoSnippet = `=== SEÇÃO DESTACADA DE CONHECIMENTOS / CONTEÚDO PROGRAMÁTICO (INSPEÇÃO PRIORITÁRIA DEFINIDA PELO USUÁRIO) ===\n${secaoConteudo.trim()}\n\n`;
    }

    // Permite envio completo do edital até 150.000 caracteres (modelos modernos possuem janelas de 128k+ a 1M tokens)
    const maxTotalChars = 150000;

    if ((editalText || '').length <= maxTotalChars) {
      return `${userSecaoSnippet}${editalText || ''}`;
    }

    const lower = editalText.toLowerCase();

    // 1. Busca específica pela posição do CARGO no edital
    let cargoSnippet = '';
    let foundCargoIdx = -1;

    if (cargo && cargo.trim().length >= 3) {
      // Substitui caracteres não alfanuméricos por ".*" para permitir variações de espaços, traços ou quebras de linha
      const cargoClean = cargo.trim().replace(/[^a-zA-Z0-9]+/g, '.*');
      const cargoRegex = new RegExp(`${cargoClean}`, 'gi');
      const match = cargoRegex.exec(editalText);
      if (match) {
        foundCargoIdx = match.index;
      } else {
        const firstWord = cargo.trim().split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (firstWord.length >= 4) {
          const firstWordRegex = new RegExp(`\\b${firstWord}\\b`, 'gi');
          const firstWordMatch = firstWordRegex.exec(editalText);
          if (firstWordMatch) foundCargoIdx = firstWordMatch.index;
        }
      }
    }

    if (foundCargoIdx !== -1) {
      const cargoStart = Math.max(0, foundCargoIdx - 2000);
      cargoSnippet = `=== SEÇÃO 1: TRECHO DO CARGO SOLICITADO ("${cargo}") ===\n${editalText.substring(cargoStart, cargoStart + 35000)}\n\n`;
    } else {
      cargoSnippet = `=== SEÇÃO 1: CABEÇALHO E CARGOS DO EDITAL ===\n${editalText.substring(0, 20000)}\n\n`;
    }

    // 2. Localização da SEÇÃO DO CONTEÚDO PROGRAMÁTICO
    let conteudoSnippet = '';
    const regex = /\b(conteúdo programático|conteudo programatico|objetos de avaliação|objetos de avaliacao|conhecimentos gerais|conhecimentos básicos|conhecimentos basicos|conhecimentos específicos|conhecimentos especificos|anexo i|anexo ii|anexo iii|programa das provas|conteúdos das provas)\b/gi;
    
    let foundIdx = -1;
    let match;
    while ((match = regex.exec(editalText)) !== null) {
      // Pega a última ocorrência para fugir do índice/sumário que fica no começo do edital
      foundIdx = match.index;
    }

    const remainingLimit = Math.max(50000, maxTotalChars - cargoSnippet.length - userSecaoSnippet.length);
    if (foundIdx !== -1) {
      conteudoSnippet = `=== SEÇÃO 2: CONTEÚDO PROGRAMÁTICO DO EDITAL ===\n${editalText.substring(foundIdx, foundIdx + remainingLimit)}`;
    } else {
      conteudoSnippet = `=== SEÇÃO 2: CORPO DO EDITAL ===\n${editalText.substring(20000, 20000 + remainingLimit)}`;
    }

    return `${userSecaoSnippet}${cargoSnippet}${conteudoSnippet}`;
  }

  /**
   * Extração de Edital via Gemini File API (Upload direto de PDF ou Download por URL/link)
   * com garantia estrutural de JSON Schema (SchemaType) e temperatura 0.1.
   */
  private async extractEditalViaGeminiFileApi(params: {
    fileBuffer?: Buffer;
    urlPdf?: string;
    editalTitle: string;
    cargo: string;
  }): Promise<any | null> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey || apiKey.length < 10) {
      this.logger.warn('[Gemini File API] Chave GEMINI_API_KEY / GOOGLE_AI_API_KEY não configurada.');
      return null;
    }

    const tempFilePath = path.join(
      os.tmpdir(),
      `edital_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`
    );
    let uploadResult: any = null;
    const fileManager = new GoogleAIFileManager(apiKey);

    try {
      let pdfBuffer: Buffer | null = null;

      if (params.fileBuffer && params.fileBuffer.length > 0) {
        this.logger.log(`[Gemini File API] Utilizando buffer de PDF fornecido via upload (${params.fileBuffer.length} bytes)...`);
        pdfBuffer = params.fileBuffer;
      } else if (params.urlPdf && params.urlPdf.trim().startsWith('http')) {
        this.logger.log(`[Gemini File API] Baixando PDF a partir do link: ${params.urlPdf}...`);
        const fetchFn: any = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
        const response = await fetchFn(params.urlPdf);
        if (!response.ok) {
          throw new Error(`Falha ao baixar PDF do link: ${response.status} ${response.statusText}`);
        }
        const arrayBuf = await response.arrayBuffer();
        pdfBuffer = Buffer.from(arrayBuf);
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        this.logger.warn('[Gemini File API] Nenhum buffer de PDF ou URL válido fornecido.');
        return null;
      }

      await fs.promises.writeFile(tempFilePath, pdfBuffer);
      this.logger.log(`[Gemini File API] 1. Fazendo upload do PDF para a API do Gemini (${tempFilePath})...`);

      uploadResult = await fileManager.uploadFile(tempFilePath, {
        mimeType: 'application/pdf',
        displayName: params.editalTitle || 'Edital Concurso',
      });

      this.logger.log(`[Gemini File API] Upload concluído! URI do arquivo: ${uploadResult.file.uri}`);
      this.logger.log(`[Gemini File API] 2. Analisando o edital e extraindo os dados com schema estrito para o cargo: "${params.cargo}"...`);

      const genAI = new GoogleGenerativeAI(apiKey);
      const candidates = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
      let result: any = null;
      let lastFileError: any = null;

      for (const modelName of candidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: `Você é um especialista em análise de editais de concursos públicos brasileiros.

Sua missão é acessar um edital, identificar o cargo solicitado, localizar todo o conteúdo programático e convertê-lo em uma estrutura JSON organizada e didática.

Seu objetivo não é apenas copiar o edital, mas reorganizar seu conteúdo para facilitar o planejamento dos estudos, mantendo total fidelidade às informações originais.

## Objetivo
1. Acessar o edital informado.
2. Identificar o nome do concurso.
3. Localizar os Conhecimentos Gerais (quando existirem).
4. Localizar o cargo solicitado.
5. Extrair todos os Conhecimentos Específicos referentes ao cargo.
6. Reestruturar o conteúdo de forma didática.
7. Retornar somente JSON válido.

## Fluxo de Extração (OBRIGATÓRIO)
Etapa 1 — Ler todo o edital: Percorra o documento para identificar Conteúdo Programático, Conhecimentos Básicos/Gerais, Conteúdo Comum, Disciplinas Comuns, Anexos e Programa das Provas.
Etapa 2 — Extrair Conhecimentos Gerais: Verifique se existe uma seção comum para todos os cargos (Conhecimentos Gerais/Básicos/Formação Geral/Programa Comum). Se existir, extraia integralmente. Caso contrário, retorne "conhecimentos_gerais": [].
Etapa 3 — Localizar o cargo: Localize o cargo solicitado e extraia apenas os conhecimentos específicos daquele cargo.
Etapa 4 — Consolidar: O JSON final deve conter conhecimentos_gerais e conhecimentos_especificos.

## Regras de Organização
- O objetivo é produzir um conteúdo organizado para estudo. Reorganize o conteúdo quando isso melhorar a compreensão.
- Disciplina: Cada disciplina representa uma grande área (ex: Língua Portuguesa, Matemática, Banco de Dados, Desenvolvimento de Sistemas).
- Tópicos: Cada tópico deve representar um assunto principal e possuir apenas um tema. Evite tópicos enormes que agrupam várias tecnologias.
  Exemplo Didático:
  Em vez de um único tópico enorme "Java, JavaEE, Spring, JPA, Angular, Android", divida em:
  {
    "nome": "Desenvolvimento em Linguagens de Programação",
    "subtopicos": ["Java", "Java EE", "Jakarta EE", "JPA", "JavaScript", "JUnit", "Hibernate", "JSF", "PrimeFaces", "Spring", "Spring Boot", "Spring Cloud", "Android", "iOS", "Low-code", "No-code"]
  }
- Subtópicos: Sempre que um tópico listar linguagens, frameworks, bibliotecas, ferramentas, padrões, protocolos, metodologias, tecnologias, conceitos ou arquiteturas (ex: "HTML, CSS, JavaScript, Angular, React e Vue"), transforme cada item em um subtópico individual.
  Exemplo:
  {
    "nome": "Frontend Web",
    "subtopicos": ["HTML", "CSS", "JavaScript", "Angular", "React", "Vue.js"]
  }
- Divisão Inteligente de Conteúdo: Caso um item do edital contenha dois ou mais assuntos independentes (ex: "Git. Testes Unitários. Testes de Integração. TDD"), divida-os em tópicos distintos (ex: Tópico "Controle de Versão" -> subtópicos ["Git"]; Tópico "Testes de Software" -> subtópicos ["Testes Unitários", "Testes de Integração", "TDD"]).
- Nome dos tópicos: É permitido criar um nome mais didático e curto para um tópico (ex: "Java, Spring, Hibernate" -> "Desenvolvimento Java"; "HTML, CSS, JavaScript" -> "Frontend Web"; "Docker, Kubernetes" -> "Containers e Orquestração"). O novo nome deve representar corretamente o conteúdo, não omitir nada do edital, nem adicionar tecnologias inexistentes.
- Fidelidade ao edital: Nunca invente conteúdos nem acrescente tecnologias inexistentes no edital.
- Texto corrido: Se houver texto corrido como "Arquitetura de software. Interoperabilidade. SOA. Web Services. REST. API. Swagger.", transforme no tópico "Arquitetura de Software" com os subtópicos ["Interoperabilidade", "SOA", "Web Services", "REST", "API", "Swagger"].
- Numeração: Ignore números, letras e marcadores originais.
- Arrays Vazios: Caso um tópico realmente não possua subdivisões, utilize array vazio [].
- JSON: Retorne exclusivamente JSON válido. Sem markdown fora do JSON, explicações ou observações.

## Estrutura Obrigatória JSON:
{
  "edital": "",
  "cargo": "",
  "conteudo_programatico": {
    "conhecimentos_gerais": [
      {
        "disciplina": "",
        "topicos": [
          {
            "nome": "",
            "subtopicos": []
          }
        ]
      }
    ],
    "conhecimentos_especificos": [
      {
        "disciplina": "",
        "topicos": [
          {
            "nome": "",
            "subtopicos": []
          }
        ]
      }
    ]
  }
}

## Validação Final
Valide antes de responder: O edital foi percorrido completamente. Os Conhecimentos Gerais foram procurados em todo o documento. O cargo foi localizado corretamente. Todos os tópicos foram contemplados. Itens extensos foram reorganizados didaticamente. Tecnologias e listas foram transformadas em subtópicos. Não existem assuntos inventados. O JSON é válido.`
          });

          result = await model.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { fileData: { fileUri: uploadResult.file.uri, mimeType: 'application/pdf' } },
                  { text: `Edital Concurso: "${params.editalTitle}"
Cargo solicitado: "${params.cargo}"

Analise o edital PDF anexo, especifique o cargo "${params.cargo}" e extraia o conteúdo programático seguindo estritamente as regras de extração.` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
              responseSchema: schemaConteudoProgramatico as any,
            },
          });

          if (result) {
            this.logger.log(`[Gemini File API] Modelo [${modelName}] respondeu com sucesso!`);
            break;
          }
        } catch (mErr: any) {
          lastFileError = mErr;
          this.logger.warn(`[Gemini File API] Modelo [${modelName}] falhou (${mErr.message}). Tentando próximo modelo Gemini...`);
        }
      }

      if (!result && lastFileError) {
        throw lastFileError;
      }

      this.logger.log('[Gemini File API] 3. Extração concluída com sucesso!');
      const jsonOutput = result.response.text();
      const parsed = JSON.parse(jsonOutput);
      await this.saveDebugJson(params.cargo, parsed, 'gemini_file_api');
      return parsed;

    } catch (error: any) {
      this.logger.error(`[Gemini File API] Erro durante a extração por File API: ${error.message}`);
      return null;
    } finally {
      // 4. LIMPEZA (Crucial para eficiência)
      if (uploadResult?.file?.name) {
        try {
          await fileManager.deleteFile(uploadResult.file.name);
          this.logger.log(`[Gemini File API] Arquivo remoto no servidor Gemini excluído: ${uploadResult.file.name}`);
        } catch (err: any) {
          this.logger.warn(`[Gemini File API] Falha ao excluir arquivo remoto no servidor Gemini: ${err.message}`);
        }
      }
      if (fs.existsSync(tempFilePath)) {
        try {
          await fs.promises.unlink(tempFilePath);
          this.logger.log('[Gemini File API] Arquivo temporário local apagado com sucesso.');
        } catch (err: any) {
          this.logger.warn(`[Gemini File API] Falha ao apagar arquivo temporário local: ${err.message}`);
        }
      }
    }
  }

  // ===========================================================================
  // ETAPA 1 — Extração Completa e Fiel do Conteúdo Programático (PROMPT 1)
  // ===========================================================================

  private async extractEditalComplete(
    editalText: string,
    editalTitle: string,
    cargo: string,
    secaoConteudo?: string,
    fileBuffer?: Buffer,
    link?: string,
  ): Promise<any | null> {
    // 1. Tenta extração via Gemini File API (upload direto de PDF ou download via URL/link)
    if ((fileBuffer && fileBuffer.length > 0) || (link && link.trim().startsWith('http'))) {
      try {
        const fileApiResult = await this.extractEditalViaGeminiFileApi({
          fileBuffer,
          urlPdf: link,
          editalTitle,
          cargo,
        });

        if (fileApiResult && fileApiResult.conteudo_programatico) {
          this.logger.log(`[PROMPT 1] ✅ Sucesso na extração via Gemini File API & SchemaType para o cargo: "${cargo}"`);
          const parsed = fileApiResult;
          parsed.mapa_completo = this.buildMapaGeralFromConteudoProgramatico(parsed);
          parsed.mapa_geral = parsed.mapa_completo;
          parsed.mapa_geral_extraido = parsed.mapa_completo;
          parsed.conteudo_programatico = this.buildConteudoProgramaticoFromMapaGeral(parsed.mapa_completo);

          const basicas = parsed.mapa_completo?.disciplinas_basicas?.length ?? 0;
          const especificas = parsed.mapa_completo?.disciplinas_especificas?.length ?? 0;

          if (!parsed.concurso_info) {
            parsed.concurso_info = {
              concurso: editalTitle,
              cargo: cargo,
              mensagem_confirmacao: 'Já confirmei seu Cargo no edital.'
            };
          }

          this.logger.log(`[Gemini File API] Mapa Geral das Disciplinas construído com ${basicas} disciplinas básicas + ${especificas} específicas.`);
          if (editalText && editalText.length > 100) {
            this.validateExtraction(parsed, editalText);
          }
          return parsed;
        }
      } catch (err: any) {
        this.logger.warn(`[PROMPT 1] Extração via Gemini File API falhou (${err.message}). Prosseguindo com fallback de texto...`);
      }
    }

    if (!this.provider) return null;

    try {
      const buildPromptText = (strictCargoOnly: boolean = false) =>
        `Você é um especialista em análise de editais de concursos públicos brasileiros.

Sua missão é acessar um edital, identificar o cargo solicitado, localizar todo o conteúdo programático e convertê-lo em uma estrutura JSON organizada e didática.

Seu objetivo não é apenas copiar o edital, mas reorganizar seu conteúdo para facilitar o planejamento dos estudos, mantendo total fidelidade às informações originais.

CARGO ALVO SOLICITADO: "${cargo}"
NOME DO CONCURSO / EDITAL: "${editalTitle}"

## REGRAS DE ORGANIZAÇÃO DIDÁTICA:
1. Ler todo o edital e localizar Conhecimentos Gerais (comuns a todos os cargos) e Conhecimentos Específicos do cargo "${cargo}".
2. Disciplina: Cada disciplina representa uma grande área (ex: Língua Portuguesa, Matemática, Banco de Dados, Desenvolvimento de Sistemas).
3. Tópicos: Cada tópico deve representar um assunto principal e possuir apenas um tema. Evite tópicos enormes que agrupam várias tecnologias.
   Exemplo Didático:
   Em vez de um único tópico enorme "Java, JavaEE, Spring, JPA, Angular, Android", divida em tópicos mais didáticos (ex: "Desenvolvimento em Linguagens de Programação", "Frameworks Java", "Desenvolvimento Mobile") mantendo os subtópicos individuais.
4. Subtópicos: Sempre que um tópico listar linguagens, frameworks, bibliotecas, ferramentas, padrões, protocolos, metodologias, tecnologias ou conceitos (ex: "HTML, CSS, JavaScript, Angular, React e Vue"), transforme cada item em um subtópico individual (ex: ["HTML", "CSS", "JavaScript", "Angular", "React", "Vue.js"]).
5. Divisão Inteligente de Conteúdo: Caso um item contenha dois ou mais assuntos independentes (ex: "Git. Testes Unitários. Testes de Integração. TDD"), divida-os em tópicos distintos (ex: Tópico "Controle de Versão" -> subtópicos ["Git"]; Tópico "Testes de Software" -> subtópicos ["Testes Unitários", "Testes de Integração", "TDD"]).
6. Nome dos tópicos: É permitido criar um nome mais didático e curto para um tópico (ex: "Java, Spring, Hibernate" -> "Desenvolvimento Java"; "HTML, CSS, JavaScript" -> "Frontend Web"; "Docker, Kubernetes" -> "Containers e Orquestração"). O novo nome deve representar corretamente o conteúdo, não omitir nada do edital, nem adicionar tecnologias inexistentes.
7. Fidelidade ao edital: Nunca invente conteúdos nem acrescente tecnologias inexistentes no edital.
8. Texto corrido: Se houver texto corrido como "Arquitetura de software. Interoperabilidade. SOA. Web Services. REST. API. Swagger.", transforme no tópico "Arquitetura de Software" com os subtópicos ["Interoperabilidade", "SOA", "Web Services", "REST", "API", "Swagger"].
9. Numeração: Ignore números, letras e marcadores originais.
10. JSON: O retorno deve conter SOMENTE JSON VÁLIDO. Não escreva explicações, comentários, markdown ou qualquer texto fora do JSON.

## TEXTO DO EDITAL:
${this.getEditalTextSnippet(editalText, cargo, secaoConteudo)}

## ESTRUTURA OBRIGATÓRIA JSON:
{
  "edital": "${editalTitle}",
  "cargo": "${cargo}",
  "conteudo_programatico": {
    "conhecimentos_gerais": [
      {
        "disciplina": "Nome da disciplina",
        "topicos": [
          {
            "nome": "Nome do tópico",
            "subtopicos": ["Subtópico 1", "Subtópico 2"]
          }
        ]
      }
    ],
    "conhecimentos_especificos": [
      {
        "disciplina": "Nome da disciplina",
        "topicos": [
          {
            "nome": "Nome do tópico",
            "subtopicos": ["Subtópico 1", "Subtópico 2"]
          }
        ]
      }
    ]
  }
}`;

      this.logger.log(`[PROMPT 1] Extraindo conteúdo programático do edital para o cargo: "${cargo}" (usando ${this.provider.name})`);
      let content = await this.provider.invokeStructured<any>(buildPromptText(false), zodSchemaConteudoProgramatico);
      if (!content) {
         content = await this.provider.invoke(buildPromptText(false));
      }

      let parsed = typeof content === 'string' ? this.parseJsonResponse(content) : content;
      if (parsed) {
        await this.saveDebugJson(cargo, parsed, 'fallback_texto_prompt1');
      }

      // --- Passo 1: Construção do Mapa Geral das Disciplinas a partir do Prompt 1 ---
      parsed.mapa_completo = this.buildMapaGeralFromConteudoProgramatico(parsed);
      parsed.mapa_geral = parsed.mapa_completo;
      parsed.mapa_geral_extraido = parsed.mapa_completo;
      parsed.conteudo_programatico = this.buildConteudoProgramaticoFromMapaGeral(parsed.mapa_completo);

      let basicas = (parsed?.mapa_completo?.disciplinas_basicas || [])
        .filter((d: any) => d.nome && !d.nome.toLowerCase().includes('não informado') && !d.nome.toLowerCase().includes('nao informado')).length;

      let especificas = (parsed?.mapa_completo?.disciplinas_especificas || [])
        .filter((d: any) => d.nome && !d.nome.toLowerCase().includes('não informado') && !d.nome.toLowerCase().includes('nao informado')).length;

      // --- FALLBACK EM CASO DE RETORNO VAZIO (0 DISCIPLINAS VÁLIDAS) ---
      if (basicas === 0 && especificas === 0) {
        this.logger.warn('[PROMPT 1] Extração inicial retornou 0 disciplinas válidas. Acionando Fallback Abrangente de Leitura do Edital...');
        const fallbackPrompt = `Você é um especialista em análise de editais de concursos públicos brasileiros.
Sua missão é extrair integralmente a estrutura do conteúdo programático do cargo solicitado no edital.

CARGO ALVO SOLICITADO: "${cargo}"
SEÇÕES A EXAMINAR: "CONTEÚDO PROGRAMÁTICO", "CONHECIMENTOS GERAIS", "CONHECIMENTOS BÁSICOS", "CONHECIMENTOS ESPECÍFICOS".

REGRAS DE EXTRAÇÃO:
- Não invente, não resuma e não altere as palavras originais do documento.
- Sempre que houver subdivisões (letras, números, marcadores, vírgulas ou enumerações), coloque em "subtopicos".
- Se não houver subtópicos para um tópico, utilize um array vazio [].
- Retorne SOMENTE JSON válido.

TEXTO DO EDITAL:
${this.getEditalTextSnippet(editalText, cargo)}

ESTRUTURA OBRIGATÓRIA JSON:
{
  "edital": "${editalTitle}",
  "cargo": "${cargo}",
  "conteudo_programatico": {
    "conhecimentos_gerais": [
      {
        "disciplina": "Nome da disciplina",
        "topicos": [ { "nome": "Nome do tópico", "subtopicos": ["Subtópico 1"] } ]
      }
    ],
    "conhecimentos_especificos": [
      {
        "disciplina": "Nome da disciplina",
        "topicos": [ { "nome": "Nome do tópico", "subtopicos": ["Subtópico 1"] } ]
      }
    ]
  }
}`;
        content = await this.provider.invokeStructured<any>(fallbackPrompt, zodSchemaConteudoProgramatico);
        if (!content) {
          content = await this.provider.invoke(fallbackPrompt);
        }
        const fallbackParsed = typeof content === 'string' ? this.parseJsonResponse(content) : content;
        if (fallbackParsed) {
          await this.saveDebugJson(cargo, fallbackParsed, 'fallback_texto_abrangente');
          fallbackParsed.mapa_completo = this.buildMapaGeralFromConteudoProgramatico(fallbackParsed);
          fallbackParsed.mapa_geral = fallbackParsed.mapa_completo;
          fallbackParsed.mapa_geral_extraido = fallbackParsed.mapa_completo;
          fallbackParsed.conteudo_programatico = this.buildConteudoProgramaticoFromMapaGeral(fallbackParsed.mapa_completo);
          parsed = fallbackParsed;
          basicas = parsed?.mapa_completo?.disciplinas_basicas?.length ?? 0;
          especificas = parsed?.mapa_completo?.disciplinas_especificas?.length ?? 0;
        }
      }

      if (!parsed.concurso_info) {
        parsed.concurso_info = {
          concurso: editalTitle,
          cargo: cargo,
          mensagem_confirmacao: "Já confirmei seu Cargo no edital."
        };
      }

      if (basicas === 0 && especificas === 0) {
        this.logger.warn('[PROMPT 1] Extração retornou 0 disciplinas. O conteúdo programático do cargo pode não ter sido localizado explicitamente.');
      } else {
        this.logger.log(`[PROMPT 1] ✅ Já confirmei seu Cargo ("${cargo}") no edital! Mapa Geral das Disciplinas construído com ${basicas} disciplinas básicas + ${especificas} específicas.`);
      }

      // --- Validação pós-extração ---
      this.validateExtraction(parsed, editalText);

      return parsed;
    } catch (error) {
      this.logger.error(`[PROMPT 1] Falha na extração de conteúdo programático: ${error.message}`);
      throw error;
    }
  }

  /**
   * Constrói o Mapa Geral das Disciplinas estruturado (disciplinas_basicas e disciplinas_especificas)
   * a partir do conteúdo programático retornado no Prompt 1 (suporta Schema de Array e Dicionário).
   */
  private buildMapaGeralFromConteudoProgramatico(input: any): { disciplinas_basicas: any[]; disciplinas_especificas: any[] } {
    if (!input) {
      return { disciplinas_basicas: [], disciplinas_especificas: [] };
    }

    // Desembrulha aninhamentos sucessivos de conteudo_programatico
    let root = input;
    while (root?.conteudo_programatico && typeof root.conteudo_programatico === 'object') {
      root = root.conteudo_programatico;
    }

    // Se já é um mapa completo com disciplinas_basicas / especificas
    if (root?.disciplinas_basicas || root?.disciplinas_especificas) {
      return {
        disciplinas_basicas: Array.isArray(root.disciplinas_basicas) ? root.disciplinas_basicas : [],
        disciplinas_especificas: Array.isArray(root.disciplinas_especificas) ? root.disciplinas_especificas : []
      };
    }

    const parseCategory = (categoryInput: any): any[] => {
      if (!categoryInput) return [];
      const result: any[] = [];

      // NOVO SCHEMA: Array de objetos { disciplina: "...", topicos: [{ nome: "...", subtopicos: [...] }] }
      if (Array.isArray(categoryInput)) {
        for (const item of categoryInput) {
          if (!item) continue;
          const discName = item.disciplina || item.nome || item.name || 'Disciplina';
          const rawTopicos = Array.isArray(item.topicos) ? item.topicos : (Array.isArray(item.topics) ? item.topics : (Array.isArray(item.camada_2_topicos) ? item.camada_2_topicos : []));

          const topicosList = rawTopicos.map((t: any) => ({
            nome: typeof t === 'string' ? t : (t.nome || t.name || t.titulo || String(discName)),
            subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : (Array.isArray(t.camada_3_subtopicos) ? t.camada_3_subtopicos : []))
          }));

          result.push({
            nome: String(discName).trim(),
            percentual_questoes: item.percentual_questoes ?? 0,
            topicos: topicosList.length > 0 ? topicosList : [{ nome: String(discName).trim(), subtopicos: [] }]
          });
        }
        return result;
      }

      // FORMATO DICIONÁRIO (Legado / Fallback): { "Disciplina": { "subtopicos": [...] } }
      if (typeof categoryInput === 'object') {
        for (const [discName, discVal] of Object.entries(categoryInput)) {
          if (!discName || typeof discName !== 'string') continue;

          let topicosList: any[] = [];

          if (discVal && typeof discVal === 'object') {
            if (Array.isArray((discVal as any).topicos)) {
              topicosList = (discVal as any).topicos.map((t: any) => ({
                nome: typeof t === 'string' ? t : (t.nome || t.titulo || discName),
                subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : [])
              }));
            } else if (Array.isArray((discVal as any).subtopicos)) {
              topicosList = [{
                nome: discName,
                subtopicos: (discVal as any).subtopicos
              }];
            } else if (Array.isArray(discVal)) {
              topicosList = [{
                nome: discName,
                subtopicos: discVal
              }];
            } else {
              for (const [topicoKey, topicoVal] of Object.entries(discVal as Record<string, any>)) {
                if (topicoKey === 'subtopicos' && Array.isArray(topicoVal)) {
                  topicosList.push({ nome: discName, subtopicos: topicoVal });
                } else if (Array.isArray(topicoVal)) {
                  topicosList.push({ nome: topicoKey, subtopicos: topicoVal });
                } else if (topicoVal && typeof topicoVal === 'object' && Array.isArray(topicoVal.subtopicos)) {
                  topicosList.push({ nome: topicoKey, subtopicos: topicoVal.subtopicos });
                } else if (typeof topicoVal === 'string') {
                  topicosList.push({ nome: topicoKey, subtopicos: [topicoVal] });
                }
              }
            }
          }

          if (topicosList.length === 0) {
            topicosList = [{ nome: discName, subtopicos: [] }];
          }

          result.push({
            nome: discName.trim(),
            percentual_questoes: (discVal as any)?.percentual_questoes ?? 0,
            topicos: topicosList
          });
        }
      }

      return result;
    };

    const basicas = parseCategory(
      root?.conhecimentos_gerais ||
      root?.conhecimentos_basicos ||
      root?.disciplinas_basicas ||
      root?.gerais ||
      root?.basicas
    );
    const especificas = parseCategory(
      root?.conhecimentos_especificos ||
      root?.disciplinas_especificas ||
      root?.especificos ||
      root?.especificas
    );

    if (basicas.length === 0 && especificas.length === 0 && Array.isArray(root)) {
      especificas.push(...parseCategory(root));
    }

    return {
      disciplinas_basicas: basicas,
      disciplinas_especificas: especificas
    };
  }

  /**
   * Converte um Mapa Geral de Disciplinas de volta para a estrutura oficial do Schema de Conteúdo Programático.
   */
  private buildConteudoProgramaticoFromMapaGeral(mapaCompleto: any): any {
    const gerais: any[] = (mapaCompleto?.disciplinas_basicas || []).map((d: any) => ({
      disciplina: d.nome,
      topicos: (d.topicos || []).map((t: any) => ({
        nome: t.nome || d.nome,
        subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : [])
      }))
    }));

    const especificas: any[] = (mapaCompleto?.disciplinas_especificas || []).map((d: any) => ({
      disciplina: d.nome,
      topicos: (d.topicos || []).map((t: any) => ({
        nome: t.nome || d.nome,
        subtopicos: Array.isArray(t.subtopicos) ? t.subtopicos : (Array.isArray(t.assuntos) ? t.assuntos : [])
      }))
    }));

    return {
      conteudo_programatico: {
        conhecimentos_gerais: gerais,
        conhecimentos_especificos: especificas
      }
    };
  }

  /**
   * Validação pós-extração: verifica se as disciplinas retornadas realmente
   * existem no texto do edital. Marca com aviso as que parecem inventadas.
   */
  private validateExtraction(parsed: any, editalText: string): void {
    if (!parsed?.mapa_completo) return;

    const lowerText = editalText.toLowerCase();
    const allDisciplines = [
      ...(parsed.mapa_completo.disciplinas_basicas ?? []),
      ...(parsed.mapa_completo.disciplinas_especificas ?? []),
    ];

    let validated = 0;
    let suspicious = 0;

    for (const disc of allDisciplines) {
      const discName = (disc.nome || '').toLowerCase().trim();
      if (!discName) continue;

      // Verifica se o nome da disciplina (ou parte significativa) aparece no texto
      const keywords = discName.split(/[\s,;:–—-]+/).filter((w: string) => w.length > 3);
      const foundCount = keywords.filter((kw: string) => lowerText.includes(kw)).length;
      const matchRatio = keywords.length > 0 ? foundCount / keywords.length : 0;

      if (matchRatio < 0.4) {
        disc._validacao = 'SUSPEITA — nome não encontrado no texto do edital';
        suspicious++;
        this.logger.warn(`[Validação] Disciplina SUSPEITA: "${disc.nome}" (${Math.round(matchRatio * 100)}% das palavras-chave encontradas no edital)`);
      } else {
        disc._validacao = 'OK';
        validated++;
      }
    }

    this.logger.log(`[Validação] ${validated} disciplinas validadas, ${suspicious} disciplinas suspeitas.`);
  }

  // ===========================================================================
  // ETAPA 2A — Classificação Pareto Recursivo (PROMPT 2)
  // ===========================================================================

  private async classifyPareto(
    mapaCompleto: any,
    cargo: string,
    editalTitle: string,
  ): Promise<any | null> {
    if (!this.provider) return null;

    try {
      const mapaGeralDisciplinas = JSON.stringify({
        conteudo_programatico: mapaCompleto.conteudo_programatico,
        mapa_geral_disciplinas: mapaCompleto.mapa_completo,
      }, null, 2);

      const prompt = `# PROMPT 2 – AGENTE DE PRIORIZAÇÃO E PLANEJAMENTO DE ESTUDOS (PARETO RECURSIVO)

Você é um especialista em preparação para concursos públicos brasileiros, análise estatística de provas e planejamento de estudos.

Sua missão é transformar o Conteúdo Programático Oficial (extraído pelo Prompt 1) em um Mapa Inteligente de Prioridades, utilizando o Princípio de Pareto aplicado de forma hierárquica e recursiva.

O objetivo não é apenas estimar frequência de cobrança, mas indicar a melhor sequência de estudo para maximizar o número de questões corretas no menor tempo possível.

## ENTRADA
CARGO: "${cargo}"
EDITAL: "${editalTitle}"

CONTEÚDO PROGRAMÁTICO (PROMPT 1):
${mapaGeralDisciplinas}

## METODOLOGIA
A análise deve considerar simultaneamente:
- frequência histórica nas provas;
- tendência recente da banca organizadora;
- peso médio da disciplina;
- incidência para o cargo;
- dependência entre assuntos;
- dificuldade média;
- custo-benefício de estudo;
- importância como pré-requisito para outros tópicos.
Nunca utilize apenas a frequência histórica.

### Camada 1 – Priorização das Disciplinas
Analise todas as disciplinas dos conhecimentos gerais (disciplinas_basicas) e específicos (disciplinas_especificas).
Para cada disciplina determine:
- percentual estimado de questões (percentual_questoes);
- percentual recomendado do tempo de estudo (percentual_tempo);
- prioridade: ESSENCIAL / PRIORITÁRIA / COMPLEMENTAR / RESIDUAL;
- índice_prioridade (0–100).

### Camada 2 – Priorização dos Tópicos
Para cada disciplina, analise todos os tópicos recebidos.
Determine:
- frequência histórica (frequencia_historica);
- tendência de crescimento ou queda;
- temperatura: ESSENCIAL / QUENTE / MORNO / FRIO;
- índice_prioridade (0–100);
- ordem_estudo (número sequencial respeitando pré-requisitos).
Não remova nenhum tópico.

### Camada 3 – Priorização dos Subtópicos
Para cada subtópico determine:
- frequencia: "Alta" | "Média" | "Baixa";
- dificuldade: "Fácil" | "Médio" | "Difícil";
- custo_beneficio: "Alto" | "Médio" | "Baixo";
- prioridade: número de 0 a 100;
- incluir: boolean (true/false);
- tempo_estimado_horas: número;
- revisoes: número;
- dependencias: array de strings com pré-requisitos;
- justificativa: motivo da priorização.

### Camada 4 – Ordem Recomendada de Estudo
A ordem de estudo não deve seguir a ordem do edital. Ela deve ser calculada considerando dependências, custo-benefício, facilidade de aprendizagem, recorrência e potencial de gerar questões (ex: não estudar Microsserviços antes de REST).

### Camada 5 – Regra de Corte
Identifique em "regua_de_corte" os assuntos que podem ser adiados (baixa incidência, baixa dependência, baixo custo-benefício). Informe o trade-off.

## REGRAS OBRIGATÓRIAS
- Nunca remover disciplinas.
- Nunca remover tópicos.
- Nunca inventar assuntos.
- Preservar exatamente os nomes recebidos do Prompt 1.
- Sempre respeitar a estrutura de conhecimentos gerais (disciplinas_basicas) e específicos (disciplinas_especificas).

## CRITÉRIOS DE DECISÃO
Sempre utilizar esta ordem de importância:
1. Dependências entre assuntos.
2. Frequência histórica.
3. Tendência recente da banca.
4. Peso da disciplina.
5. Custo-benefício.
6. Dificuldade.
7. Tempo necessário para dominar o assunto.

## VALIDAÇÃO FINAL
Confirme que NENHUMA disciplina, tópico ou subtópico foi omitido; todas as prioridades foram calculadas; a ordem de estudo respeita pré-requisitos; e o retorno é EXCLUSIVAMENTE JSON VÁLIDO (sem markdown ou textos fora do JSON).

Retorne EXCLUSIVAMENTE o seguinte formato JSON:
{
  "relevance_summary": "Resumo dos pontos vitais do Pareto Recursivo",
  "total_subjects": number,
  "high_priority_subjects": number,
  "coverage_percentage": number,
  "total_hot_topics": number,
  "total_high_cb_subtopics": number,
  "mapa_geral": {
    "disciplinas_basicas": [
      {
        "nome": "string",
        "percentual_questoes": number,
        "prioridade": "ESSENCIAL" | "PRIORITÁRIA" | "COMPLEMENTAR" | "RESIDUAL",
        "percentual_tempo": number,
        "indice_prioridade": number,
        "camada_2_topicos": [
          {
            "nome": "string",
            "frequencia_historica": "string",
            "temperatura": "ESSENCIAL" | "QUENTE" | "MORNO" | "FRIO",
            "indice_prioridade": number,
            "ordem_estudo": number,
            "camada_3_subtopicos": [
              {
                "nome": "string",
                "frequencia": "Alta" | "Média" | "Baixa",
                "dificuldade": "Fácil" | "Médio" | "Difícil",
                "custo_beneficio": "Alto" | "Médio" | "Baixo",
                "prioridade": number,
                "incluir": boolean,
                "tempo_estimado_horas": number,
                "revisoes": number,
                "dependencias": ["string"],
                "justificativa": "string"
              }
            ]
          }
        ]
      }
    ],
    "disciplinas_especificas": [
      {
        "nome": "string",
        "percentual_questoes": number,
        "prioridade": "ESSENCIAL" | "PRIORITÁRIA" | "COMPLEMENTAR" | "RESIDUAL",
        "percentual_tempo": number,
        "indice_prioridade": number,
        "camada_2_topicos": [
          {
            "nome": "string",
            "frequencia_historica": "string",
            "temperatura": "ESSENCIAL" | "QUENTE" | "MORNO" | "FRIO",
            "indice_prioridade": number,
            "ordem_estudo": number,
            "camada_3_subtopicos": [
              {
                "nome": "string",
                "frequencia": "Alta" | "Média" | "Baixa",
                "dificuldade": "Fácil" | "Médio" | "Difícil",
                "custo_beneficio": "Alto" | "Médio" | "Baixo",
                "prioridade": number,
                "incluir": boolean,
                "tempo_estimado_horas": number,
                "revisoes": number,
                "dependencias": ["string"],
                "justificativa": "string"
              }
            ]
          }
        ]
      }
    ]
  },
  "regua_de_corte": {
    "nao_estudar": [
      { "item": "string", "motivo": "string", "trade_off": "string" }
    ]
  },
  "alertas_banca": {
    "banca_identificada": "string",
    "estilo": "string",
    "ajustes_recomendados": ["string"]
  }
}`;

      this.logger.log(`[PROMPT 2] Com os dados do conteúdo programático extraído, enviando PROMPT 2 para Análise Pareto Recursiva para o cargo: "${cargo}"`);
      const content = await this.provider.invoke(prompt);
      const parsed = this.parseJsonResponse(content);

      // --- Merge de segurança para garantir integridade total do Mapa Geral ---
      if (parsed && parsed.mapa_geral && mapaCompleto?.mapa_completo) {
        const prompt1Basicas = mapaCompleto.mapa_completo.disciplinas_basicas || [];
        const prompt1Especificas = mapaCompleto.mapa_completo.disciplinas_especificas || [];

        if ((!parsed.mapa_geral.disciplinas_basicas || parsed.mapa_geral.disciplinas_basicas.length === 0) && prompt1Basicas.length > 0) {
          parsed.mapa_geral.disciplinas_basicas = prompt1Basicas.map((d: any) => ({
            ...d,
            prioridade: 'COMPLEMENTAR',
            percentual_tempo: 10,
            camada_2_topicos: (d.topicos || []).map((t: any) => ({
              nome: t.nome,
              temperatura: 'MORNO',
              camada_3_subtopicos: (t.subtopicos || []).map((sub: any) => ({
                nome: typeof sub === 'string' ? sub : (sub.nome || sub),
                frequencia: 'Média',
                dificuldade: 'Médio',
                custo_beneficio: 'Médio',
                incluir: true
              }))
            }))
          }));
        }

        if ((!parsed.mapa_geral.disciplinas_especificas || parsed.mapa_geral.disciplinas_especificas.length === 0) && prompt1Especificas.length > 0) {
          parsed.mapa_geral.disciplinas_especificas = prompt1Especificas.map((d: any) => ({
            ...d,
            prioridade: 'PRIORITÁRIA',
            percentual_tempo: 20,
            camada_2_topicos: (d.topicos || []).map((t: any) => ({
              nome: t.nome,
              temperatura: 'QUENTE',
              camada_3_subtopicos: (t.subtopicos || []).map((sub: any) => ({
                nome: typeof sub === 'string' ? sub : (sub.nome || sub),
                frequencia: 'Alta',
                dificuldade: 'Médio',
                custo_beneficio: 'Alto',
                incluir: true
              }))
            }))
          }));
        }
      }

      this.logger.log(`[PROMPT 2] ✅ Análise de Pareto Recursiva 80/20 concluída.`);
      return parsed;
    } catch (error) {
      this.logger.error(`[PROMPT 2] Falha na classificação Pareto: ${error.message}`);
      return null;
    }
  }

  // ===========================================================================
  // ETAPA 2B — Cronograma de Estudos Otimizado (PROMPT 2 - PARTE CRONOGRAMA)
  // ===========================================================================

  private async generateSchedule(
    paretoResult: any,
    userContext: EditalUserContext | undefined,
    editalTitle: string,
    semanasDisponiveis: number | null,
    horasPorDia: number | null,
    diasPorSemana: number | null,
    totalHorasSemana: number | null,
    totalHorasDisponiveis: number | null,
    dataProvaFormatada: string,
  ): Promise<any | null> {
    if (!this.provider) return null;

    try {
      const cargo = userContext?.cargo || 'Geral';
      const paretoJson = JSON.stringify({
        mapa_geral: paretoResult.mapa_geral,
        regua_de_corte: paretoResult.regua_de_corte,
      }, null, 2);

      const contextBlock = `
=== CONTEXTO DO USUÁRIO ===
- Cargo: ${cargo}
- Data da prova: ${dataProvaFormatada}${semanasDisponiveis ? ` (${semanasDisponiveis} semanas disponíveis)` : ''}
- Horas disponíveis por dia: ${horasPorDia ? `${horasPorDia}h/dia` : '[Não informada]'}
- Dias disponíveis por semana: ${diasPorSemana ? `${diasPorSemana} dias/semana` : '[Não informados]'}
- Total de horas/semana: ${totalHorasSemana ? `${totalHorasSemana}h` : '[Não calculated]'}
- Total de horas até a prova: ${totalHorasDisponiveis ? `${totalHorasDisponiveis}h` : '[Não calculado]'}
${semanasDisponiveis ? `O cronograma deve ter exatamente ${semanasDisponiveis} semanas.` : 'Gere um cronograma de 6 semanas por padrão.'}
${horasPorDia && diasPorSemana ? `Cada semana comporta ${totalHorasSemana}h de estudo (${horasPorDia}h/dia × ${diasPorSemana} dias).` : ''}
===========================`;

      const prompt = `# PROMPT 2 — GERADOR DE CRONOGRAMA DE ESTUDOS OTIMIZADO (PARETO RECURSIVO)

Você é um especialista em preparação para concursos públicos brasileiros.
Sua missão é montar um cronograma de estudos otimizado por subtópico com base na Análise Pareto 80/20 Recursiva já realizada.

${contextBlock}

## ANÁLISE PARETO JÁ REALIZADA:
${paretoJson}

## REGRAS OBRIGATÓRIAS DO CRONOGRAMA DE ESTUDOS
- Distribuído em semanas até a data da prova.
- Organizado por subtópico (não por "estudar português").
- Cada bloco de estudo deve ter:
  - Subtópico exato
  - Carga horária sugerida
  - Tipo de atividade: teoria / exercicios / revisao
  - Semana de revisão espaçada programada
- Siga RIGOROSAMENTE esta proporção por bloco de estudo:
  - 30% teoria
  - 50% exercícios (questões de prova) - monte simulados somente usando o banco de questões, caso tenha, conforme a teoria de cada bloco.
  - 20% revisão
- O cronograma deve ser realista para as horas disponíveis informadas.

Retorne EXCLUSIVAMENTE um JSON (sem texto adicional, sem markdown):
{
  "cronograma_estudos": {
    "semanas": [
      {
        "numero": number,
        "titulo": "string",
        "blocos": [
          {
            "subtopico": "string",
            "disciplina": "string",
            "carga_horaria": "string (ex: 2h)",
            "tipo_atividade": "teoria" | "exercicios" | "revisao",
            "semana_revisao_espacada": number | null,
            "usa_banco_questoes": boolean
          }
        ]
      }
    ]
  },
  "sprints": [
    {
      "id": "string",
      "title": "string",
      "duration": "string",
      "progress": 0,
      "topics": [
        { "id": "string", "subject": "string", "name": "string", "is_pareto": boolean, "weight": "Alto" | "Médio" | "Baixo", "completed": false }
      ]
    }
  ]
}`;

      this.logger.log(`[PROMPT 2] Gerando cronograma de estudos otimizado (30% teoria, 50% exercícios, 20% revisão) e sprints para: "${cargo}"`);
      const content = await this.provider.invoke(prompt);
      const parsed = this.parseJsonResponse(content);
      this.logger.log(`[PROMPT 2] ✅ Cronograma gerado com ${parsed?.cronograma_estudos?.semanas?.length ?? 0} semanas e ${parsed?.sprints?.length ?? 0} sprints.`);
      return parsed;
    } catch (error) {
      this.logger.error(`[PROMPT 2] Falha na geração do cronograma: ${error.message}`);
      return null;
    }
  }

  // ===========================================================================
  // Orquestrador Principal — Análise Pareto em Etapas
  // ===========================================================================

  /**
   * ETAPA 1 EXCLUSIVA — Extrai a Tabela Completa do Mapa Geral de Disciplinas (Prompt 1)
   * sem executar a classificação Pareto imediata.
   */
  async extractEditalMapaOnly(
    editalText: string,
    editalTitle: string,
    userContext?: EditalUserContext,
    fileBuffer?: Buffer,
    link?: string,
  ): Promise<any> {
    let dataProvaFormatada = '[Não informada]';
    if (userContext?.dataProva) {
      const prova = new Date(userContext.dataProva);
      dataProvaFormatada = prova.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const cargo = userContext?.cargo || 'Geral';

    let etapa1Result: any = null;
    try {
      etapa1Result = await this.extractEditalComplete(editalText, editalTitle, cargo, undefined, fileBuffer, link);
    } catch (e) {
      this.logger.error(`[Extração Mapa Geral] Etapa 1 falhou: ${e.message}`);
      return this.buildErrorResult(editalTitle, cargo, dataProvaFormatada, `Não foi possível extrair o conteúdo programático do edital: ${e.message}`);
    }

    if (!etapa1Result) {
      return this.buildErrorResult(editalTitle, cargo, dataProvaFormatada, 'Não foi possível extrair o conteúdo programático do edital.');
    }

    const partial = this.buildPartialResult(etapa1Result, editalTitle, cargo, dataProvaFormatada);
    partial.pareto_analisado = false;
    return partial;
  }

  /**
   * ETAPA 2 EXCLUSIVA — Executa a Análise Pareto (Prompt 2) sob demanda sobre a Tabela Completa já existente.
   * Atualiza as prioridades e o cronograma in-place sem perder nenhuma disciplina da tabela original.
   */
  async analyzeEditalParetoOnly(existingData: any, editalTitle: string, userContext?: EditalUserContext): Promise<any> {
    let semanasDisponiveis: number | null = null;
    let dataProvaFormatada = '[Não informada]';
    if (userContext?.dataProva) {
      const hoje = new Date();
      const prova = new Date(userContext.dataProva);
      const diffMs = prova.getTime() - hoje.getTime();
      semanasDisponiveis = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
      dataProvaFormatada = prova.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const horasPorDia = userContext?.horasPorDia ?? null;
    const diasPorSemana = userContext?.diasPorSemana ?? null;
    const totalHorasSemana = horasPorDia && diasPorSemana ? horasPorDia * diasPorSemana : null;
    const totalHorasDisponiveis = totalHorasSemana && semanasDisponiveis ? totalHorasSemana * semanasDisponiveis : null;
    const cargo = userContext?.cargo || 'Geral';

    const etapa1Input = {
      concurso_info: existingData?.concurso_info || { concurso: editalTitle, cargo },
      conteudo_programatico: existingData?.conteudo_programatico,
      mapa_completo: existingData?.mapa_geral_extraido || existingData?.mapa_geral || existingData?.mapa_completo
    };

    const paretoResult = await this.classifyPareto(etapa1Input, cargo, editalTitle);
    if (!paretoResult) {
      return existingData;
    }

    const scheduleResult = await this.generateSchedule(
      paretoResult,
      userContext,
      editalTitle,
      semanasDisponiveis,
      horasPorDia,
      diasPorSemana,
      totalHorasSemana,
      totalHorasDisponiveis,
      dataProvaFormatada,
    );

    const mergedResult = {
      ...existingData,
      relevance_summary: paretoResult.relevance_summary,
      total_subjects: paretoResult.total_subjects || existingData.total_subjects,
      high_priority_subjects: paretoResult.high_priority_subjects || existingData.high_priority_subjects,
      coverage_percentage: paretoResult.coverage_percentage || existingData.coverage_percentage,
      total_hot_topics: paretoResult.total_hot_topics || 0,
      total_high_cb_subtopics: paretoResult.total_high_cb_subtopics || 0,
      mapa_geral: paretoResult.mapa_geral || existingData.mapa_geral,
      camada_1_mapa_prioridades: paretoResult.camada_1_mapa_prioridades || existingData.camada_1_mapa_prioridades,
      regua_de_corte: paretoResult.regua_de_corte || existingData.regua_de_corte,
      alertas_banca: paretoResult.alertas_banca || existingData.alertas_banca,
      cronograma_estudos: scheduleResult?.cronograma_estudos ?? existingData.cronograma_estudos ?? { semanas: [] },
      sprints: scheduleResult?.sprints ?? existingData.sprints ?? [],
      pareto_analisado: true,
      _metadata: {
        provider: this.provider?.name || 'unknown',
        etapas_concluidas: ['extração', 'pareto', 'cronograma'],
        observacoes_extrator: existingData?._metadata?.observacoes_extrator ?? [],
      },
    };

    return mergedResult;
  }

  /**
   * Analyze an Edital PDF using a multi-phase approach:
   * - Phase 1: Complete faithful extraction of all disciplines/topics
   * - Phase 2A: Pareto classification (priority, temperature, cost-benefit)
   * - Phase 2B: Study schedule + sprints generation
   */
  async analyzeEditalPareto(editalText: string, editalTitle: string, userContext?: EditalUserContext): Promise<any> {
    // --- Calcula semanas disponíveis até a prova ---
    let semanasDisponiveis: number | null = null;
    let dataProvaFormatada = '[Não informada]';
    if (userContext?.dataProva) {
      const hoje = new Date();
      const prova = new Date(userContext.dataProva);
      const diffMs = prova.getTime() - hoje.getTime();
      semanasDisponiveis = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
      dataProvaFormatada = prova.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const horasPorDia = userContext?.horasPorDia ?? null;
    const diasPorSemana = userContext?.diasPorSemana ?? null;
    const totalHorasSemana = horasPorDia && diasPorSemana ? horasPorDia * diasPorSemana : null;
    const totalHorasDisponiveis = totalHorasSemana && semanasDisponiveis ? totalHorasSemana * semanasDisponiveis : null;
    const cargo = userContext?.cargo || 'Geral';

    // =========================================================================
    // ETAPA 1 — Extração Completa e Fiel
    // =========================================================================
    let etapa1Result: any = null;
    try {
      etapa1Result = await this.extractEditalComplete(editalText, editalTitle, cargo);
    } catch (e) {
      this.logger.error(`[Análise Pareto] Etapa 1 falhou: ${e.message}`);
      return this.buildErrorResult(editalTitle, cargo, dataProvaFormatada, `Não foi possível extrair o conteúdo programático do edital: ${e.message}. Tente usar um edital com formatação mais simples ou dividi-lo.`);
    }

    if (!etapa1Result) {
      // Modelo indisponível ou falha total — retorna ERRO EXPLÍCITO
      this.logger.error('[Análise Pareto] Etapa 1 falhou silenciosamente. Retornando erro.');
      return this.buildErrorResult(editalTitle, cargo, dataProvaFormatada, 'Não foi possível extrair o conteúdo programático do edital. O modelo não retornou dados.');
    }

    // =========================================================================
    // ETAPA 2A — Classificação Pareto
    // =========================================================================
    const paretoResult = await this.classifyPareto(etapa1Result, cargo, editalTitle);

    if (!paretoResult) {
      // Etapa 2A falhou — retorna resultado parcial com extração pura, SEM dados inventados
      this.logger.warn('[Análise Pareto] Etapa 2A falhou. Retornando mapa de extração sem classificação Pareto.');
      return this.buildPartialResult(etapa1Result, editalTitle, cargo, dataProvaFormatada);
    }

    // =========================================================================
    // ETAPA 2B — Cronograma + Sprints
    // =========================================================================
    const scheduleResult = await this.generateSchedule(
      paretoResult,
      userContext,
      editalTitle,
      semanasDisponiveis,
      horasPorDia,
      diasPorSemana,
      totalHorasSemana,
      totalHorasDisponiveis,
      dataProvaFormatada,
    );

    // =========================================================================
    // Montagem do resultado final
    // =========================================================================
    const result = {
      concurso_info: etapa1Result.concurso_info,
      conteudo_programatico: etapa1Result.conteudo_programatico,
      mapa_geral_extraido: etapa1Result.mapa_completo,
      relevance_summary: paretoResult.relevance_summary,
      total_subjects: paretoResult.total_subjects,
      high_priority_subjects: paretoResult.high_priority_subjects,
      coverage_percentage: paretoResult.coverage_percentage,
      total_hot_topics: paretoResult.total_hot_topics,
      total_high_cb_subtopics: paretoResult.total_high_cb_subtopics,
      mapa_geral: paretoResult.mapa_geral,
      camada_1_mapa_prioridades: paretoResult.camada_1_mapa_prioridades,
      regua_de_corte: paretoResult.regua_de_corte,
      alertas_banca: paretoResult.alertas_banca,
      cronograma_estudos: scheduleResult?.cronograma_estudos ?? { semanas: [] },
      sprints: scheduleResult?.sprints ?? [],
      _metadata: {
        provider: this.provider?.name || 'unknown',
        etapas_concluidas: scheduleResult ? ['extração', 'pareto', 'cronograma'] : ['extração', 'pareto'],
        observacoes_extrator: etapa1Result.observacoes_extrator ?? [],
      },
    };

    // --- Normalização de segurança ---
    if (!result.mapa_geral) {
      result.mapa_geral = { disciplinas_basicas: [], disciplinas_especificas: [] };
    }
    if (Array.isArray((result.mapa_geral as any).disciplinas)) {
      const discs = (result.mapa_geral as any).disciplinas;
      result.mapa_geral.disciplinas_basicas = discs.filter(
        (d: any) => d.prioridade === 'COMPLEMENTAR' || d.prioridade === 'RESIDUAL',
      );
      result.mapa_geral.disciplinas_especificas = discs.filter(
        (d: any) => d.prioridade === 'ESSENCIAL' || d.prioridade === 'PRIORITÁRIA' || !d.prioridade,
      );
    }
    if (!result.mapa_geral.disciplinas_basicas) result.mapa_geral.disciplinas_basicas = [];
    if (!result.mapa_geral.disciplinas_especificas) result.mapa_geral.disciplinas_especificas = [];

    // Fallback: se mapa_geral do Prompt 2 veio vazio, restaura a partir da extração do Prompt 1
    if (
      result.mapa_geral.disciplinas_basicas.length === 0 &&
      result.mapa_geral.disciplinas_especificas.length === 0 &&
      etapa1Result?.mapa_completo
    ) {
      this.logger.warn('[Análise Pareto] mapa_geral do Prompt 2 veio vazio. Restaurando disciplinas do Prompt 1.');
      result.mapa_geral = {
        disciplinas_basicas: (etapa1Result.mapa_completo.disciplinas_basicas || []).map((d: any) => ({
          nome: d.nome,
          percentual_questoes: d.percentual_questoes ?? 0,
          prioridade: 'COMPLEMENTAR',
          camada_2_topicos: (d.topicos || []).map((t: any, i: number) => ({
            nome: t.nome,
            temperatura: 'MORNO',
            ordem_estudo: i + 1,
            camada_3_subtopicos: (t.subtopicos || []).map((s: any) => ({
              nome: typeof s === 'string' ? s : (s.nome || String(s)),
              custo_beneficio: 'Médio',
              incluir: true
            }))
          }))
        })),
        disciplinas_especificas: (etapa1Result.mapa_completo.disciplinas_especificas || []).map((d: any) => ({
          nome: d.nome,
          percentual_questoes: d.percentual_questoes ?? 0,
          prioridade: 'PRIORITÁRIA',
          camada_2_topicos: (d.topicos || []).map((t: any, i: number) => ({
            nome: t.nome,
            temperatura: 'QUENTE',
            ordem_estudo: i + 1,
            camada_3_subtopicos: (t.subtopicos || []).map((s: any) => ({
              nome: typeof s === 'string' ? s : (s.nome || String(s)),
              custo_beneficio: 'Médio',
              incluir: true
            }))
          }))
        }))
      };
    }

    const sanitizeTopics = (discs: any[]) => {
      discs.forEach((d: any) => {
        if (!Array.isArray(d.camada_2_topicos)) {
          d.camada_2_topicos = d.topicos || [];
        }
        d.camada_2_topicos.forEach((t: any) => {
          if (!Array.isArray(t.camada_3_subtopicos)) {
            t.camada_3_subtopicos = t.subtopicos || t.assuntos || [];
          }
        });
      });
    };
    sanitizeTopics(result.mapa_geral.disciplinas_basicas);
    sanitizeTopics(result.mapa_geral.disciplinas_especificas);

    if (!result.camada_1_mapa_prioridades) {
      result.camada_1_mapa_prioridades = { disciplinas: [] };
    }
    if (!result.camada_1_mapa_prioridades.disciplinas?.length) {
      result.camada_1_mapa_prioridades.disciplinas = [
        ...result.mapa_geral.disciplinas_especificas,
        ...result.mapa_geral.disciplinas_basicas,
      ];
    }

    result.total_subjects =
      result.mapa_geral.disciplinas_basicas.length + result.mapa_geral.disciplinas_especificas.length;

    this.logger.log(`[Análise Pareto] ✅ Concluída com sucesso. Total de disciplinas: ${result.total_subjects} | Provider: ${this.provider?.name}`);
    return result;
  }

  // ===========================================================================
  // Resultados de Erro e Parciais (SEM DADOS FICTÍCIOS)
  // ===========================================================================

  /**
   * Retorna um objeto de erro explícito quando a análise falha completamente.
   * NUNCA retorna dados inventados — o frontend deve exibir a mensagem de erro.
   */
  private buildErrorResult(editalTitle: string, cargo: string, dataProvaFormatada: string, errorMessage: string): any {
    return {
      concurso_info: {
        concurso: editalTitle,
        cargo: cargo,
        data_prova: dataProvaFormatada,
        banca: '[VERIFICAR NO EDITAL]',
      },
      _error: true,
      _error_message: errorMessage,
      total_subjects: 0,
      high_priority_subjects: 0,
      coverage_percentage: 0,
      total_hot_topics: 0,
      total_high_cb_subtopics: 0,
      relevance_summary: `⚠️ ${errorMessage}`,
      mapa_geral: { disciplinas_basicas: [], disciplinas_especificas: [] },
      camada_1_mapa_prioridades: { disciplinas: [] },
      cronograma_estudos: { semanas: [] },
      regua_de_corte: { nao_estudar: [] },
      alertas_banca: { banca_identificada: '[VERIFICAR NO EDITAL]', estilo: '', ajustes_recomendados: [] },
      sprints: [],
      _metadata: {
        provider: this.provider?.name || 'none',
        etapas_concluidas: [],
        observacoes_extrator: [errorMessage],
      },
    };
  }

  /**
   * Retorna resultado parcial quando a Etapa 1 funcionou mas a Etapa 2 falhou.
   * Exibe os dados reais extraídos, sem classificação Pareto inventada.
   */
  private buildPartialResult(etapa1Result: any, editalTitle: string, cargo: string, dataProvaFormatada: string): any {
    const mapaCompleto = etapa1Result?.mapa_completo || this.buildMapaGeralFromConteudoProgramatico(etapa1Result?.conteudo_programatico || etapa1Result);

    const formatCategory = (list: any[], isBasica: boolean) => {
      return (list || []).map((d: any) => ({
        nome: String(d.nome || d.disciplina || d.name || 'Disciplina').trim(),
        percentual_questoes: d.percentual_questoes ?? 0,
        prioridade: d.prioridade || (isBasica ? 'COMPLEMENTAR' : 'PRIORITÁRIA'),
        percentual_tempo: 0,
        camada_2_topicos: (d.topicos || d.camada_2_topicos || []).map((t: any, i: number) => ({
          nome: typeof t === 'string' ? t : String(t.nome || t.name || t.titulo || 'Tópico').trim(),
          frequencia_historica: '[ANÁLISE PARETO PENDENTE]',
          temperatura: t.temperatura || (isBasica ? 'MORNO' : 'QUENTE'),
          ordem_estudo: i + 1,
          camada_3_subtopicos: (t.subtopicos || t.camada_3_subtopicos || t.assuntos || []).map((s: any) => {
            const subName = typeof s === 'string' ? s : String(s.nome || s.name || s.titulo || 'Assunto').trim();
            return {
              nome: subName,
              frequencia: 'Média',
              dificuldade: 'Médio',
              custo_beneficio: 'Médio',
              incluir: true,
              justificativa: '[Aguardando Análise Pareto]',
            };
          }),
        })),
      }));
    };

    const basicasFormatted = formatCategory(mapaCompleto?.disciplinas_basicas || [], true);
    const especificasFormatted = formatCategory(mapaCompleto?.disciplinas_especificas || [], false);

    const formattedMapa = {
      disciplinas_basicas: basicasFormatted,
      disciplinas_especificas: especificasFormatted
    };

    return {
      concurso_info: etapa1Result?.concurso_info || { concurso: editalTitle, cargo, data_prova: dataProvaFormatada, banca: '[VERIFICAR NO EDITAL]' },
      conteudo_programatico: etapa1Result?.conteudo_programatico || this.buildConteudoProgramaticoFromMapaGeral(formattedMapa),
      mapa_completo: formattedMapa,
      mapa_geral: formattedMapa,
      mapa_geral_extraido: formattedMapa,
      pareto_analisado: false,
      total_subjects: basicasFormatted.length + especificasFormatted.length,
      high_priority_subjects: 0,
      coverage_percentage: 100,
      total_hot_topics: 0,
      total_high_cb_subtopics: 0,
      regua_de_corte: { nao_estudar: [] },
      alertas_banca: { banca_identificada: '[VERIFICAR NO EDITAL]', estilo: '', ajustes_recomendados: [] },
      sprints: [],
      _metadata: {
        provider: this.provider?.name || 'unknown',
        etapas_concluidas: ['extração'],
        observacoes_extrator: etapa1Result.observacoes_extrator ?? ['Classificação Pareto falhou. Dados são somente de extração.'],
      },
    };
  }

  // ===========================================================================
  // AGENTE 1 — EXTRATOR DE LEGISLAÇÃO BRASILEIRA
  // Usa Gemini File API para PDFs e fallback para texto bruto
  // ===========================================================================

  async extractLegislacao(pdfBuffer: Buffer | null, pdfText: string, fileName: string): Promise<any> {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada para o Agente Extrator.');
    }

    const PROMPT_EXTRATOR = `# AGENTE EXTRATOR DE LEGISLAÇÃO BRASILEIRA

## 1. PAPEL DO AGENTE

Você é um **Agente Especialista em Extração e Estruturação de Legislação Brasileira**.

Sua função é receber uma legislação brasileira e transformá-la em uma estrutura de dados organizada, hierárquica e semanticamente preservada.

### REGRA FUNDAMENTAL

Você é um **EXTRATOR**, não um comentarista jurídico.

* NÃO interprete o conteúdo;
* NÃO explique os artigos;
* NÃO faça comentários jurídicos;
* NÃO invente artigos, incisos, parágrafos ou alíneas;
* NÃO corrija silenciosamente erros existentes no documento.

## 2. HIERARQUIA DO DOCUMENTO

Identifique e preserve: Título → Capítulo → Seção → Subseção → Artigo → Caput → Parágrafo → Inciso → Alínea → Item.

## 3. ARTIGOS

Para cada artigo extraia:
- número (ex: "1º", "1º-A")
- título (se existir)
- texto_original completo
- status_dispositivo ("vigente_no_documento" ou "revogado")
- dispositivos (caput, parágrafos, incisos, alíneas, itens)

## 4. DISPOSITIVOS

Tipos: caput | paragrafo | paragrafo_unico | inciso | alinea | item | subitem

## 5. QUALIDADE DA EXTRAÇÃO

Identifique problemas encontrados (trecho ilegível, artigo incompleto, etc.).

## 6. SAÍDA

A resposta deve ser **EXCLUSIVAMENTE JSON válido**. Sem introdução, sem Markdown, sem explicações.

Estrutura obrigatória:

{
  "legislacao": {
    "tipo": null,
    "numero": null,
    "ano": null,
    "titulo": null,
    "ementa": null,
    "data_publicacao": null,
    "data_vigencia": null,
    "orgao_emissor": null,
    "fonte": null
  },
  "estrutura": {
    "preambulo": null,
    "titulos": [],
    "capitulos": [],
    "secoes": [],
    "subsecoes": []
  },
  "artigos": [
    {
      "ordem": 1,
      "numero": "1º",
      "titulo": null,
      "texto_original": "...",
      "status_dispositivo": "vigente_no_documento",
      "dispositivos": [
        {
          "ordem": 1,
          "tipo": "caput",
          "numero": null,
          "texto_original": "..."
        }
      ]
    }
  ],
  "qualidade_extracao": {
    "status": "completa",
    "problemas": []
  }
}`;

    const genAI = new GoogleGenerativeAI(googleKey);
    const modelNames = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

    // Tenta com Gemini File API (upload do PDF binário) se buffer disponível
    if (pdfBuffer && pdfBuffer.length > 0) {
      const { GoogleAIFileManager } = await import('@google/generative-ai/server');
      const fileManager = new GoogleAIFileManager(googleKey);

      for (const modelName of modelNames) {
        let uploadResult: any = null;
        let tmpPath: string | null = null;
        try {
          this.logger.log(`[Extrator] Tentando Gemini File API com modelo ${modelName}...`);

          // Salva temporariamente o buffer para upload
          const os = await import('os');
          const path = await import('path');
          const fs = await import('fs');
          tmpPath = path.join(os.tmpdir(), `legis_${Date.now()}.pdf`);
          fs.writeFileSync(tmpPath, pdfBuffer);

          uploadResult = await fileManager.uploadFile(tmpPath, {
            mimeType: 'application/pdf',
            displayName: fileName,
          });

          // Cleanup local file immediately
          try { fs.unlinkSync(tmpPath); tmpPath = null; } catch {}

          const fileUri = uploadResult.file.uri;
          const mimeType = uploadResult.file.mimeType;

          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.0,
              maxOutputTokens: 8192000, // Máximo suportado — necessário para leis extensas
              responseMimeType: 'application/json',
            },
          });

          const result = await model.generateContent([
            { fileData: { fileUri, mimeType } },
            { text: PROMPT_EXTRATOR },
          ]);

          const text = result.response.text();
          if (text && text.trim().length > 10) {
            const parsed = this.parseJsonResponse(text, 'Extrator-FileAPI');
            if (parsed && parsed.artigos && Array.isArray(parsed.artigos) && parsed.artigos.length > 0) {
              this.logger.log(`[Extrator] ✅ File API com ${modelName}: ${parsed.artigos.length} artigos extraídos.`);
              return parsed;
            }
          }
        } catch (err: any) {
          this.logger.warn(`[Extrator] File API com ${modelName} falhou: ${err.message}. Tentando próximo...`);
        } finally {
          if (tmpPath) {
            try { const fs = await import('fs'); fs.unlinkSync(tmpPath); } catch {}
          }
          if (uploadResult?.file?.name) {
            try { await fileManager.deleteFile(uploadResult.file.name); } catch {}
          }
        }
      }
    }

    // Fallback: texto bruto
    this.logger.warn('[Extrator] Usando fallback com texto bruto...');
    const textoTruncado = pdfText.substring(0, 800000); // Aumentado para cobrir leis extensas (Gemini suporta >1M tokens de entrada)

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 8192000, // Máximo suportado — necessário para leis extensas
            responseMimeType: 'application/json',
          },
        });

        const prompt = `${PROMPT_EXTRATOR}\n\n## LEGISLAÇÃO PARA EXTRAIR:\n\n${textoTruncado}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (text && text.trim().length > 10) {
          const parsed = this.parseJsonResponse(text, 'Extrator-TextFallback');
          if (parsed && parsed.artigos) {
            this.logger.log(`[Extrator] ✅ Fallback texto com ${modelName}: ${parsed.artigos?.length ?? 0} artigos.`);
            return parsed;
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Extrator] Fallback texto com ${modelName} falhou: ${err.message}`);
      }
    }

    throw new Error('Todos os modelos Gemini falharam na extração da legislação.');
  }

  // ===========================================================================
  // AGENTE 2 — COMENTADOR DE LEGISLAÇÃO BRASILEIRA
  // Processa um artigo por vez com contexto da legislação
  // ===========================================================================

  async comentarArtigo(
    artigo: { numero: string; texto_original: string; dispositivos: any[] },
    legislacaoTitulo: string,
    legislacaoTipo: string,
  ): Promise<any> {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada para o Agente Comentador.');
    }

    const dispositivosTexto = (artigo.dispositivos || [])
      .map(d => `  [${d.tipo}${d.numero ? ' ' + d.numero : ''}]: ${d.texto_original}`)
      .join('\n');

    const PROMPT_COMENTADOR = `# AGENTE 2 — COMENTADOR DE LEGISLAÇÃO BRASILEIRA

Você é o **Agente 2 — Comentador de Legislação Brasileira**.

## 1. LEGISLAÇÃO
${legislacaoTipo || 'Legislação'}: ${legislacaoTitulo}

## 2. ARTIGO A COMENTAR
Art. ${artigo.numero}

TEXTO ORIGINAL:
${artigo.texto_original}

DISPOSITIVOS:
${dispositivosTexto || '(sem dispositivos adicionais)'}

## 3. INSTRUÇÕES
Explique o conteúdo jurídico de forma clara, didática, objetiva, tecnicamente correta e adequada à preparação para concursos públicos.
Sua pergunta central é: "O que esse dispositivo significa?"

### REGRAS FUNDAMENTAIS
- Baseie-se EXCLUSIVAMENTE no texto fornecido. Não substitua por conhecimento externo.
- Rigor jurídico: preserve diferenças como poderá × deverá, pode × deve, até × a partir de, mínimo × máximo, regra × exceção.
- Não produza o campo termos_juridicos.
- Não invente jurisprudência, doutrina ou prazos.
- Se um campo não se aplicar, use [] ou null.

### FORMATO DE SAÍDA (EXCLUSIVAMENTE JSON VÁLIDO)

{
  "artigo_numero": "${artigo.numero}",
  "resumo": "Frase curta e objetiva sobre o tema do artigo",
  "explicacao_simples": "Explicação em linguagem clara e acessível.",
  "comentario_tecnico": "Análise da estrutura normativa, sujeitos, obrigações e efeitos.",
  "direitos": [],
  "obrigacoes": [],
  "proibicoes": [],
  "permissoes": [],
  "requisitos": [],
  "condicoes": [],
  "competencias": [],
  "prazos": [],
  "excecoes": [],
  "consequencias": [],
  "pontos_importantes": [],
  "pontos_atencao": [],
  "referencias": [],
  "exemplo_pratico": null,
  "relevancia_concurso": "alta",
  "observacao_interpretativa": null,
  "grau_confianca": "alta"
}

### RELEVÂNCIA PARA CONCURSOS
- "alta": prazos, competências, requisitos, exceções, proibições, penalidades, percentuais, números
- "media": informações importantes mas de menor densidade
- "baixa": informações contextuais ou de baixa incidência`;

    const genAI = new GoogleGenerativeAI(googleKey);
    const modelNames = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    for (const modelName of modelNames) {
      for (let tentativa = 1; tentativa <= 2; tentativa++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json',
            },
          });

          const result = await model.generateContent(PROMPT_COMENTADOR);
          const text = result.response.text();

          if (text && text.trim().length > 10) {
            const parsed = this.parseJsonResponse(text, `Comentador-Art.${artigo.numero}`);
            if (parsed && parsed.resumo !== undefined) {
              this.logger.log(`[Comentador] ✅ Art. ${artigo.numero} comentado com ${modelName}.`);
              return parsed;
            }
          }
        } catch (err: any) {
          const isRateLimit = err.message?.includes('429') || err.message?.includes('Quota') || err.message?.includes('503');
          this.logger.warn(`[Comentador] Art. ${artigo.numero} com ${modelName} (tentativa ${tentativa}) falhou: ${err.message}`);
          if (isRateLimit && tentativa === 1) {
            this.logger.log(`[Comentador] ⏳ Aguardando 12s para resetar janela de cota do Gemini...`);
            await new Promise(resolve => setTimeout(resolve, 12000));
          }
        }
      }
    }

    throw new Error(`Todos os modelos Gemini falharam ao comentar Art. ${artigo.numero}`);
  }

  // ===========================================================================
  // AGENTE 3 — ANALISTA ESTRATÉGICO DE CONCURSOS — LEGISLAÇÃO
  // Transforma artigos comentados em estratégia de preparação, prioridade e metas
  // ===========================================================================

  async analisarEstrategiaConcurso(
    legislacao: {
      id: string;
      titulo: string;
      tipo?: string | null;
      numero?: string | null;
      ano?: number | null;
      ementa?: string | null;
    },
    artigosComComentarios: any[],
  ): Promise<any> {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada para o Agente Analista Estratégico.');
    }

    const artigosContexto = artigosComComentarios.map(a => {
      const c = Array.isArray(a.legislacao_comentarios)
        ? a.legislacao_comentarios[0]
        : a.legislacao_comentarios;
      return {
        artigo_id: a.id,
        artigo_numero: a.numero,
        titulo: a.titulo || null,
        texto_resumo: c?.resumo || (a.texto_original ? a.texto_original.slice(0, 300) : null),
        status_dispositivo: a.status_dispositivo || 'vigente_no_documento',
        relevancia_concurso: c?.relevancia_concurso || 'media',
        prazos: c?.prazos?.length ? c.prazos : undefined,
        competencias: c?.competencias?.length ? c.competencias : undefined,
        requisitos: c?.requisitos?.length ? c.requisitos : undefined,
        excecoes: c?.excecoes?.length ? c.excecoes : undefined,
        pontos_atencao: c?.pontos_atencao?.length ? c.pontos_atencao : undefined,
      };
    });

    const PROMPT_ANALISTA = `# AGENTE 3 — ANALISTA ESTRATÉGICO DE CONCURSOS — LEGISLAÇÃO

## 1. PAPEL
Você é o **Agente 3 — Analista Estratégico de Concursos**.
Sua função é analisar estrategicamente o conteúdo para preparação para concursos públicos.
Você responde: "O que merece mais atenção na prova e quanto treinamento esse conteúdo deve receber?"

## 2. REGRAS FUNDAMENTAIS
- **Cobertura praticamente total**: todo artigo elegível deve receber algum nível de cobertura e meta de questões/flashcards.
- Para cada artigo, defina a prioridade ('alta', 'media', 'baixa'), potencial de cobrança, justificativa, riscos de erro, formas de cobrança, meta de questões e meta de flashcards.
- **Metas de Referência**:
  - Prioridade ALTA: meta de questões (min: 2, recomendado: 5, max: 8), flashcards (min: 1, recomendado: 2, max: 3).
  - Prioridade MÉDIA: meta de questões (min: 2, recomendado: 4, max: 6), flashcards (min: 1, recomendado: 1, max: 2).
  - Prioridade BAIXA: meta de questões (min: 1, recomendado: 2, max: 3), flashcards (min: 0, recomendado: 1, max: 1).
- Defina a **meta global** (soma das metas recomendadas).
- Identifique **comparações recomendadas** entre artigos semelhantes ou com risco de confusão.

## 3. DADOS DA LEGISLAÇÃO
${JSON.stringify({
  legislacao_id: legislacao.id,
  titulo: legislacao.titulo,
  tipo: legislacao.tipo,
  numero: legislacao.numero,
  ano: legislacao.ano,
  total_artigos: artigosContexto.length,
}, null, 2)}

## 4. ARTIGOS E COMENTÁRIOS DE ENTRADA
\`\`\`json
${JSON.stringify(artigosContexto, null, 2)}
\`\`\`

## 5. SAÍDA (EXCLUSIVAMENTE JSON VÁLIDO)
Responda EXCLUSIVAMENTE em JSON válido, sem markdown, sem texto fora do JSON:

{
  "legislacao_id": "${legislacao.id}",
  "meta_global": {
    "meta_questoes_total": 0,
    "meta_flashcards_total": 0
  },
  "analise_concurso": [
    {
      "artigo_id": "uuid-do-artigo",
      "artigo_numero": "1º",
      "prioridade": "alta",
      "potencial_cobranca": "alto",
      "justificativa": "...",
      "riscos_de_erro": ["..."],
      "formas_de_cobranca": ["alteração de prazo", "inversão de regra"],
      "meta_questoes": {
        "minimo": 4,
        "recomendado": 6,
        "maximo": 8
      },
      "meta_flashcards": {
        "minimo": 1,
        "recomendado": 2,
        "maximo": 3
      },
      "tipos_recomendados": [
        "questao_certo_errado",
        "questao_multipla_escolha"
      ]
    }
  ],
  "comparacoes_recomendadas": [
    {
      "artigos": ["1º", "2º"],
      "motivo": "...",
      "foco": "...",
      "tipo_questao": "comparativa"
    }
  ]
}`;

    const genAI = new GoogleGenerativeAI(googleKey);
    const modelNames = ['gemini-1.5-pro', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        this.logger.log(`[Agente 3 - Analista] Tentando analisarEstrategiaConcurso com modelo ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(PROMPT_ANALISTA);
        const text = result.response.text();

        if (text && text.trim().length > 10) {
          const parsed = this.parseJsonResponse(text, `AnalistaEstrategico-${modelName}`);
          if (parsed && parsed.analise_concurso && Array.isArray(parsed.analise_concurso) && parsed.analise_concurso.length > 0) {
            this.logger.log(`[Agente 3 - Analista] ✅ ${modelName}: ${parsed.analise_concurso.length} artigos analisados strategicamente.`);
            return parsed;
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Agente 3 - Analista] ${modelName} falhou: ${err.message}. Tentando próximo modelo...`);
      }
    }

    // Fallback de alta disponibilidade com Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqModels = ['qwen/qwen3.8-27b', 'groq/compound'];
      for (const gm of groqModels) {
        try {
          this.logger.log(`[Agente 3 - Analista] Tentando fallback com Groq (${gm})...`);
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: gm,
              messages: [{ role: 'user', content: PROMPT_ANALISTA }],
              response_format: { type: 'json_object' },
              temperature: 0.1,
            }),
          });
          const data = await groqRes.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = this.parseJsonResponse(content, `AnalistaEstrategico-Groq-${gm}`);
            if (parsed && parsed.analise_concurso && Array.isArray(parsed.analise_concurso) && parsed.analise_concurso.length > 0) {
              this.logger.log(`[Agente 3 - Analista] ✅ Fallback Groq (${gm}) sucesso: ${parsed.analise_concurso.length} artigos analisados.`);
              return parsed;
            }
          }
        } catch (groqErr: any) {
          this.logger.warn(`[Agente 3 - Analista] Fallback Groq (${gm}) falhou: ${groqErr.message}`);
        }
      }
    }

    throw new Error('Todos os modelos de IA falharam ao gerar a análise estratégica de concursos.');
  }

  // ===========================================================================
  // AGENTE 4 — PLANEJADOR E GERENCIADOR DE CRONOGRAMA DE ESTUDOS
  // Transforma estratégia do Agente 3 + preferências em plano executável
  // ===========================================================================

  async gerarPlanoCronograma(
    legislacao: {
      id: string;
      titulo: string;
      tipo?: string | null;
      numero?: string | null;
      ano?: number | null;
      ementa?: string | null;
    },
    artigosComComentarios: any[],
    preferencias: {
      data_inicio?: string;
      data_prova?: string;
      tempo_diario_minutos?: number;
      dias_disponiveis?: number[];
      nivel_estudante?: string;
      objetivo?: string;
      prioridade_legislacao?: string;
    },
    analiseEstrategica?: any,
  ): Promise<any> {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada para o Agente Planejador.');
    }

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diasStr = preferencias.dias_disponiveis?.length
      ? preferencias.dias_disponiveis.map(d => diasSemana[d] || d).join(', ')
      : 'Segunda a Sexta (padrão assumido)';

    const dataHoje = preferencias.data_inicio || new Date().toISOString().split('T')[0];

    // Mapeia estratégia do Agente 3 por artigo se disponível
    const estrategiaMap = new Map<string, any>();
    if (analiseEstrategica?.analise_concurso && Array.isArray(analiseEstrategica.analise_concurso)) {
      for (const item of analiseEstrategica.analise_concurso) {
        if (item.artigo_id) estrategiaMap.set(String(item.artigo_id), item);
        if (item.artigo_numero) estrategiaMap.set(String(item.artigo_numero), item);
      }
    }

    const artigosContexto = artigosComComentarios.map(a => {
      const c = Array.isArray(a.legislacao_comentarios)
        ? a.legislacao_comentarios[0]
        : a.legislacao_comentarios;
      const est = estrategiaMap.get(String(a.id)) || estrategiaMap.get(String(a.numero)) || {};
      return {
        artigo_id: a.id,
        numero: a.numero,
        titulo: a.titulo,
        status_dispositivo: a.status_dispositivo,
        resumo: c?.resumo || null,
        relevancia_concurso: c?.relevancia_concurso || 'media',
        prioridade_estrategica: est.prioridade || c?.relevancia_concurso || 'media',
        potencial_cobranca: est.potencial_cobranca || 'medio',
        meta_questoes_sugerida: est.meta_questoes?.recomendado || 4,
        prazos: c?.prazos?.length ? c.prazos : [],
        competencias: c?.competencias?.length ? c.competencias : [],
        requisitos: c?.requisitos?.length ? c.requisitos : [],
        excecoes: c?.excecoes?.length ? c.excecoes : [],
        pontos_atencao: c?.pontos_atencao?.length ? c.pontos_atencao : [],
      };
    });

    const PROMPT_PLANEJADOR = `# AGENTE 4 — PLANEJADOR E GERENCIADOR DE CRONOGRAMA DE ESTUDOS

## 1. PAPEL
Você é o **Agente 4 — Planejador e Gerenciador de Cronograma de Estudos**.
Você transforma a legislação estruturada (Agente 1), os comentários (Agente 2) e a análise estratégica (Agente 3) em um cronograma executável.
Você responde: "Quando, em que ordem e quanto tempo devo dedicar a cada conteúdo?"

## 2. REGRAS DE PLANEJAMENTO
- Utilize os dados do Agente 3 (prioridade, potencial de cobrança, meta de questões).
- Todo artigo elegível deve pertencer a um bloco temático.
- Distribua o estudo em sessões nos dias disponíveis, respeitando o tempo diário de ${preferencias.tempo_diario_minutos || 60} minutos.
- Incorpore nas sessões não apenas tempo de leitura, mas também a meta de questões para treinamento e revisões espaçadas (24h, 7 dias, 30 dias).
- Distribua proporcionalmente mais tempo e revisões para os conteúdos de maior prioridade.

## 3. DADOS DA LEGISLAÇÃO E ESTRATÉGIA
\`\`\`json
${JSON.stringify({
  legislacao_id: legislacao.id,
  tipo: legislacao.tipo,
  numero: legislacao.numero,
  ano: legislacao.ano,
  titulo: legislacao.titulo,
  ementa: legislacao.ementa,
  total_artigos: artigosComComentarios.length,
  preferencias: {
    data_inicio: dataHoje,
    data_prova: preferencias.data_prova || 'Não informada',
    tempo_diario_minutos: preferencias.tempo_diario_minutos || 60,
    dias_disponiveis: diasStr,
    nivel_estudante: preferencias.nivel_estudante || 'intermediário',
    objetivo: preferencias.objetivo || 'Aprovação em concurso',
  },
}, null, 2)}
\`\`\`

## 4. ARTIGOS COM COMENTÁRIOS E ESTRATÉGIA
\`\`\`json
${JSON.stringify(artigosContexto, null, 2)}
\`\`\`

## 5. SAÍDA (EXCLUSIVAMENTE JSON VÁLIDO)

{
  "plano_estudo": {
    "legislacao_id": "${legislacao.id}",
    "objetivo": "...",
    "data_inicio": "${dataHoje}",
    "data_prova": ${preferencias.data_prova ? `"${preferencias.data_prova}"` : 'null'},
    "tempo_diario_minutos": ${preferencias.tempo_diario_minutos || 60},
    "dias_disponiveis": ${JSON.stringify(preferencias.dias_disponiveis || [1,2,3,4,5])},
    "nivel_estudante": "${preferencias.nivel_estudante || 'não informado'}",
    "estrategia": "...",
    "premissas": []
  },
  "priorizacao": [
    {
      "artigo_id": "uuid-do-artigo",
      "artigo_numero": "1º",
      "prioridade": "alta",
      "complexidade": "media",
      "tempo_estimado_minutos": 20,
      "motivos": ["possui prazos", "define competências"]
    }
  ],
  "blocos": [
    {
      "id": "bloco-1",
      "ordem": 1,
      "titulo": "...",
      "assunto": "...",
      "artigos": ["1º", "2º", "3º"],
      "artigo_inicial": "1º",
      "artigo_final": "3º",
      "quantidade_artigos": 3,
      "prioridade": "alta",
      "complexidade": "media",
      "tempo_estimado_minutos": 60,
      "justificativa": "..."
    }
  ],
  "sessoes": [
    {
      "id": "sessao-1",
      "ordem": 1,
      "data": "${dataHoje}",
      "bloco_id": "bloco-1",
      "tipo": "leitura_inicial",
      "objetivo": "...",
      "artigos": ["1º", "2º"],
      "tempo_minutos": 40,
      "prioridade": "alta",
      "meta_questoes": 6
    }
  ],
  "revisoes": [
    {
      "sessao_origem_id": "sessao-1",
      "tipo": "revisao_24h",
      "data": "YYYY-MM-DD",
      "artigos": ["1º", "2º"],
      "tempo_minutos": 15
    }
  ],
  "resumo": {
    "total_artigos": ${artigosComComentarios.length},
    "artigos_planejados": 0,
    "artigos_prioridade_alta": 0,
    "artigos_prioridade_media": 0,
    "artigos_prioridade_baixa": 0,
    "total_blocos": 0,
    "total_sessoes": 0,
    "tempo_total_minutos": 0
  },
  "alertas": []
}`;

    const genAI = new GoogleGenerativeAI(googleKey);
    const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        this.logger.log(`[Agente 4 - Planejador] Tentando gerarPlanoCronograma com modelo ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(PROMPT_PLANEJADOR);
        const text = result.response.text();

        if (text && text.trim().length > 10) {
          const parsed = this.parseJsonResponse(text, `Planejador-${modelName}`);
          if (parsed && parsed.blocos && Array.isArray(parsed.blocos) && parsed.blocos.length > 0) {
            this.logger.log(`[Agente 4 - Planejador] ✅ ${modelName}: ${parsed.blocos.length} blocos, ${parsed.sessoes?.length ?? 0} sessões gerados.`);
            return parsed;
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Agente 4 - Planejador] ${modelName} falhou: ${err.message}. Tentando próximo modelo...`);
      }
    }

    throw new Error('Todos os modelos Gemini falharam ao gerar o plano de cronograma.');
  }

  // ===========================================================================
  // AGENTE 5 — GERADOR DE QUESTÕES E MATERIAL DE FIXAÇÃO
  // Cumpre as metas do Agente 3 com controle de cobertura e qualidade
  // ===========================================================================

  async gerarMaterialFixacao(
    legislacao: {
      id: string;
      titulo: string;
      tipo?: string | null;
      numero?: string | null;
      ano?: number | null;
      ementa?: string | null;
    },
    artigosComComentarios: any[],
    analiseEstrategica?: any,
    opcoes?: {
      sessao_id?: string;
      banca?: string;
      artigo_id?: string;
      artigos_filtro?: string[];
      questoes_existentes?: any[];
      modo?: 'adicionar' | 'substituir';
    },
  ): Promise<any> {
    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!googleKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada para o Agente de Fixação.');
    }

    let artigosFiltrados = artigosComComentarios;
    if (opcoes?.artigos_filtro && opcoes.artigos_filtro.length > 0) {
      artigosFiltrados = artigosComComentarios.filter(a =>
        opcoes.artigos_filtro!.includes(String(a.numero)) || opcoes.artigos_filtro!.includes(String(a.id)),
      );
    } else if (opcoes?.artigo_id) {
      artigosFiltrados = artigosComComentarios.filter(a => a.id === opcoes.artigo_id);
    }

    if (!artigosFiltrados.length) {
      artigosFiltrados = artigosComComentarios;
    }

    // Mapeia estratégia do Agente 3 por artigo
    const estrategiaMap = new Map<string, any>();
    if (analiseEstrategica?.analise_concurso && Array.isArray(analiseEstrategica.analise_concurso)) {
      for (const item of analiseEstrategica.analise_concurso) {
        if (item.artigo_id) estrategiaMap.set(String(item.artigo_id), item);
        if (item.artigo_numero) estrategiaMap.set(String(item.artigo_numero), item);
      }
    }

    const artigosContexto = artigosFiltrados.map(a => {
      const c = Array.isArray(a.legislacao_comentarios)
        ? a.legislacao_comentarios[0]
        : a.legislacao_comentarios;
      const est = estrategiaMap.get(String(a.id)) || estrategiaMap.get(String(a.numero)) || {};
      return {
        artigo_id: a.id,
        artigo_numero: a.numero,
        titulo: a.titulo || null,
        texto_original: a.texto_original,
        status_dispositivo: a.status_dispositivo || 'vigente_no_documento',
        resumo: c?.resumo || null,
        explicacao_simples: c?.explicacao_simples || null,
        comentario_tecnico: c?.comentario_tecnico || null,
        direitos: c?.direitos || [],
        obrigacoes: c?.obrigacoes || [],
        proibicoes: c?.proibicoes || [],
        permissoes: c?.permissoes || [],
        requisitos: c?.requisitos || [],
        condicoes: c?.condicoes || [],
        competencias: c?.competencias || [],
        prazos: c?.prazos || [],
        excecoes: c?.excecoes || [],
        consequencias: c?.consequencias || [],
        pontos_importantes: c?.pontos_importantes || [],
        pontos_atencao: c?.pontos_atencao || [],
        relevancia_concurso: c?.relevancia_concurso || 'media',
        // Entradas estratégicas do Agente 3
        prioridade_agente3: est.prioridade || 'media',
        potencial_cobranca: est.potencial_cobranca || 'medio',
        riscos_de_erro: est.riscos_de_erro || [],
        formas_de_cobranca: est.formas_de_cobranca || [],
        meta_questoes: est.meta_questoes || { minimo: 2, recomendado: 4, maximo: 6 },
        meta_flashcards: est.meta_flashcards || { minimo: 1, recomendado: 2, maximo: 2 },
        tipos_recomendados: est.tipos_recomendados || ['questao_certo_errado', 'questao_multipla_escolha'],
      };
    });

    const artigosJaAbordados = (opcoes as any)?.questoes_existentes?.length
      ? (opcoes as any).questoes_existentes.map((q: any) => q.artigo_numero || q.artigo_id).slice(0, 50)
      : [];

    const instrucaoIncremental = (opcoes as any)?.questoes_existentes?.length
      ? `\n## 2.1 MODO INCREMENTAL (GERAR MAIS QUESTÕES)
- Já existem ${(opcoes as any).questoes_existentes.length} questões cadastradas no banco para esta lei.
- Gere NOVAS questões inéditas, explorando outros parágrafos, incisos, exceções e artigos com menor cobertura.
- NÃO repita os mesmos enunciados ou pegadinhas já trabalhados anteriormente.`
      : '';

    const PROMPT_AGENTE_5 = `# AGENTE 5 — GERADOR DE QUESTÕES E MATERIAL DE FIXAÇÃO

## 1. PAPEL
Você é o **Agente 5 — Gerador de Questões e Material de Fixação**.
Sua função é transformar a legislação analisada pelos agentes anteriores em material de treinamento para concursos.
Você responde: "Como o aluno vai praticar e fixar esse conteúdo?"

## 2. REGRAS FUNDAMENTAIS
- **Cumprimento de Metas do Agente 3**: cumpra a meta de questões e flashcards definida para cada artigo. Não produza apenas poucas questões genéricas.
- **Cobertura praticamente integral**: trate praticamente toda a legislação elegível.
- **Distribuição dos tipos**: mescle Múltipla Escolha (com 5 alternativas A, B, C, D, E e justificativas individuais para cada alternativa), Certo/Errado e Casos Práticos.
- **Rigor de Qualidade**: 
  1. Apenas 1 resposta correta por questão de múltipla escolha.
  2. O artigo sustenta o gabarito.
  3. A justificativa explica didaticamente o acerto/erro de cada alternativa.
  4. Nunca invente jurisprudência ou doutrina externa inexistente.
- **Controle de Cobertura e Metas**: produza os blocos \`cobertura\` e \`metas\` no JSON final.${instrucaoIncremental}

## 3. DADOS DA LEGISLAÇÃO
${JSON.stringify({
  legislacao_id: legislacao.id,
  tipo: legislacao.tipo,
  numero: legislacao.numero,
  ano: legislacao.ano,
  titulo: legislacao.titulo,
  ementa: legislacao.ementa,
  total_artigos_analisados: artigosContexto.length,
  banca: opcoes?.banca || 'Geral (estilo FCC/Cebraspe/FGV)',
}, null, 2)}

## 4. ARTIGOS, COMENTÁRIOS E METAS DO AGENTE 3
\`\`\`json
${JSON.stringify(artigosContexto, null, 2)}
\`\`\`

## 5. SAÍDA (EXCLUSIVAMENTE JSON VÁLIDO)

{
  "legislacao_id": "${legislacao.id}",
  "metas": {
    "questoes_planejadas": 0,
    "questoes_geradas": 0,
    "questoes_pendentes": 0,
    "flashcards_planejados": 0,
    "flashcards_gerados": 0
  },
  "cobertura": {
    "total_artigos_elegiveis": ${artigosContexto.length},
    "artigos_com_material": 0,
    "artigos_sem_material": 0,
    "percentual_cobertura": 0
  },
  "conteudos": {
    "questoes": [
      {
        "id": "q-1",
        "tipo": "multipla_escolha",
        "artigo_id": "uuid-do-artigo",
        "artigo_numero": "1º",
        "assunto": "...",
        "dificuldade": "medio",
        "prioridade": "alta",
        "enunciado": "...",
        "alternativas": {
          "A": "...",
          "B": "...",
          "C": "...",
          "D": "...",
          "E": "..."
        },
        "gabarito": "C",
        "justificativa": "...",
        "justificativas_alternativas": {
          "A": "...",
          "B": "...",
          "C": "...",
          "D": "...",
          "E": "..."
        }
      },
      {
        "id": "q-2",
        "tipo": "certo_errado",
        "artigo_id": "uuid-do-artigo",
        "artigo_numero": "2º",
        "assunto": "...",
        "dificuldade": "dificil",
        "prioridade": "alta",
        "enunciado": "...",
        "gabarito": "errado",
        "justificativa": "..."
      }
    ],
    "flashcards": [
      {
        "id": "fc-1",
        "artigo_id": "uuid-do-artigo",
        "artigo_numero": "1º",
        "pergunta": "...",
        "resposta": "...",
        "assunto": "...",
        "dificuldade": "facil",
        "prioridade": "alta"
      }
    ],
    "casos_praticos": []
  }
}`;

    const genAI = new GoogleGenerativeAI(googleKey);
    const modelNames = ['gemini-1.5-pro', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        this.logger.log(`[Agente 5 - Fixação] Tentando gerarMaterialFixacao com modelo ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        });

        const result = await model.generateContent(PROMPT_AGENTE_5);
        const text = result.response.text();

        if (text && text.trim().length > 10) {
          const parsed = this.parseJsonResponse(text, `Agente5-Fixacao-${modelName}`);
          if (parsed && (parsed.conteudos || parsed.questoes || parsed.flashcards)) {
            const questoesCount = parsed.conteudos?.questoes?.length || parsed.questoes?.length || 0;
            const fcCount = parsed.conteudos?.flashcards?.length || parsed.flashcards?.length || 0;
            this.logger.log(`[Agente 5 - Fixação] ✅ ${modelName}: ${questoesCount} questões, ${fcCount} flashcards gerados.`);
            return parsed;
          }
        }
      } catch (err: any) {
        this.logger.warn(`[Agente 5 - Fixação] ${modelName} falhou: ${err.message}. Tentando próximo modelo...`);
      }
    }

    // Fallback de alta disponibilidade com Groq
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqModels = ['qwen/qwen3.8-27b', 'groq/compound'];
      for (const gm of groqModels) {
        try {
          this.logger.log(`[Agente 5 - Fixação] Tentando fallback com Groq (${gm})...`);
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: gm,
              messages: [{ role: 'user', content: PROMPT_AGENTE_5 }],
              response_format: { type: 'json_object' },
              temperature: 0.2,
            }),
          });
          const data = await groqRes.json();
          const content = data?.choices?.[0]?.message?.content;
          if (content) {
            const parsed = this.parseJsonResponse(content, `Agente5-Fixacao-Groq-${gm}`);
            if (parsed && (parsed.conteudos || parsed.questoes || parsed.flashcards)) {
              this.logger.log(`[Agente 5 - Fixação] ✅ Fallback Groq (${gm}) gerou material com sucesso!`);
              return parsed;
            }
          }
        } catch (groqErr: any) {
          this.logger.warn(`[Agente 5 - Fixação] Fallback Groq (${gm}) falhou: ${groqErr.message}`);
        }
      }
    }

    throw new Error('Todos os modelos de IA falharam ao gerar o material de fixação.');
  }

  /**
   * Alias de compatibilidade para gerarMaterialConcurso
   */
  async gerarMaterialConcurso(
    legislacao: any,
    artigosComComentarios: any[],
    opcoes?: any,
    analiseEstrategica?: any,
  ): Promise<any> {
    return this.gerarMaterialFixacao(legislacao, artigosComComentarios, analiseEstrategica, opcoes);
  }
}


