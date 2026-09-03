import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LangChainOpenAIService } from '../../services/langchain-openai.service';
import { SupabaseService } from '../../services/supabase.service';
import { extractTextFromPdf } from '../../utils/pdf-helper';
import { EditalUserContext } from './editais.types';

@Injectable()
export class EditaisService {
  private readonly logger = new Logger(EditaisService.name);

  constructor(
    @InjectQueue('edital-pareto-queue') private paretoQueue: Queue,
    private readonly langChainService: LangChainOpenAIService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private async getPdfText(file: Express.Multer.File | undefined, link: string | undefined, title: string): Promise<string> {
    if (file?.buffer) {
      return await extractTextFromPdf(file.buffer, title, this.logger);
    }
    if (link && link.trim().startsWith('http')) {
      try {
        this.logger.log(`Baixando PDF localmente a partir do link para garantir texto em fallback: ${link}`);
        const response = await fetch(link);
        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          return await extractTextFromPdf(Buffer.from(arrayBuf), title, this.logger);
        }
      } catch (err: any) {
        this.logger.warn(`Falha ao extrair texto do link localmente: ${err.message}`);
      }
    }
    return '';
  }

  async uploadAndAnalyzeEdital(
    file: Express.Multer.File,
    title: string,
    userId: string,
    link?: string,
    userContext?: EditalUserContext,
  ) {
    this.logger.log(`Etapa 1 — Extração do Mapa Geral das Disciplinas para: ${title} | Cargo: ${userContext?.cargo}`);

    let pdfText = await this.getPdfText(file, link, title);
    if (!pdfText || pdfText.trim().length === 0) {
      pdfText = '[NENHUM PDF FORNECIDO] Não há texto do edital disponível para análise. O usuário não fez upload de um arquivo PDF.';
    }

    // Executa ETAPA 1 (Prompt 1): Extração completa de todas as disciplinas, tópicos e subtópicos via Gemini File API / LLM
    const mapaGeralExtracao = await this.langChainService.extractEditalMapaOnly(
      pdfText,
      title,
      userContext,
      file?.buffer,
      link,
    );
    
    // Salva o texto bruto do PDF no objeto pareto_data para permitir consultas e reanálises futuras
    if (mapaGeralExtracao && typeof mapaGeralExtracao === 'object') {
      mapaGeralExtracao._raw_pdf_text = pdfText;
    }

    const saved = await this.supabaseService.addEdital(title, userId, mapaGeralExtracao, userContext);
    return saved;
  }

  async analyzeParetoForEdital(id: string, userContext?: EditalUserContext) {
    this.logger.log(`Etapa 2 — Executando Análise Pareto 80/20 sob demanda para o edital ID: ${id}`);
    const edital = await this.supabaseService.getEditalById(id);
    if (!edital) {
      throw new NotFoundException(`Edital com ID ${id} não foi encontrado.`);
    }

    const effectiveContext = userContext || {
      cargo: edital.cargo || 'Cargo Principal',
      concurso: edital.concurso || edital.title,
      dataProva: edital.data_prova,
      horasPorDia: edital.horas_por_dia,
      diasPorSemana: edital.dias_por_semana,
    };

    if (userContext) {
      await this.supabaseService.updateEditalContext(id, userContext);
    }

    let existingData = edital.pareto_data || {};
    const pdfText = existingData._raw_pdf_text || '';

    // Se o mapa existente veio com 0 disciplinas, re-executa a extração no texto do PDF salvo
    const basicas = existingData.mapa_geral?.disciplinas_basicas?.length ?? 0;
    const especificas = existingData.mapa_geral?.disciplinas_especificas?.length ?? 0;
    if ((basicas === 0 && especificas === 0) && pdfText.length > 50) {
      this.logger.warn(`[Análise Pareto] Mapa existente continha 0 disciplinas. Re-executando extração no texto do PDF salvo...`);
      existingData = await this.langChainService.extractEditalMapaOnly(pdfText, edital.title, effectiveContext);
    }

    // Executa ETAPA 2 (Prompt 2): Análise Pareto sobre a tabela completa existente
    const updatedParetoData = await this.langChainService.analyzeEditalParetoOnly(existingData, edital.title, effectiveContext);
    if (updatedParetoData && typeof updatedParetoData === 'object') {
      updatedParetoData._raw_pdf_text = pdfText;
    }

    // Salva pareto_data atualizado no Supabase
    const { data, error } = await (this.supabaseService.getAdminClient()!)
      .from('editais')
      .update({ pareto_data: updatedParetoData })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar Análise Pareto: ${error.message}`);
    }
    return data;
  }

  async getAllEditais(userId?: string) {
    return this.supabaseService.getEditais(userId);
  }

  async getPublicEditais() {
    const editais = await this.supabaseService.getEditais();
    // Return full public metadata fields needed by the frontend cards
    return editais.map(e => ({
      id: e.id,
      title: e.title,
      cargo: e.cargo,
      concurso: e.concurso,
      status: e.status,
      data_prova: e.data_prova,
      horas_por_dia: e.horas_por_dia,
      dias_por_semana: e.dias_por_semana,
      // Retorna pareto_data sem o texto bruto do PDF (pode ser grande e sensível)
      pareto_data: e.pareto_data
        ? (() => {
            const { _raw_pdf_text, ...rest } = e.pareto_data ?? {};
            return rest;
          })()
        : null,
      uploaded_by: e.uploaded_by,
      uploader_name: e.uploader_name,
      created_at: e.created_at,
    }));
  }

  /**
   * Retorna os N últimos editais com status 'completed' que o userId
   * ainda NÃO adicionou ao seu perfil.
   */
  async getRecentCompletedEditais(limit = 4, userId?: string) {
    return this.supabaseService.getRecentCompletedEditais(limit, userId);
  }

  async getEditalPareto(id: string) {
    const edital = await this.supabaseService.getEditalById(id);
    if (!edital) {
      throw new NotFoundException(`Edital com ID ${id} não foi encontrado.`);
    }
    return edital;
  }

  async toggleTopicStatus(editalId: string, topicId: string, userId: string) {
    const updatedEdital = await this.supabaseService.toggleTopicCompletion(editalId, topicId, userId);
    if (!updatedEdital) {
      throw new NotFoundException(`Tópico ou Edital não encontrado.`);
    }
    return updatedEdital;
  }

  async sendEditalToUser(editalId: string, userId: string) {
    this.logger.log(`Enviando edital ${editalId} para o usuário ${userId}`);
    return this.supabaseService.sendEditalToUser(editalId, userId);
  }

  async updateEditalContext(id: string, userContext: EditalUserContext) {
    this.logger.log(`Atualizando contexto do edital ${id}`);
    const updated = await this.supabaseService.updateEditalContext(id, userContext);
    if (!updated) {
      throw new NotFoundException(`Edital com ID ${id} não foi encontrado.`);
    }
    return updated;
  }

  async reanalyzeEdital(
    id: string,
    file: Express.Multer.File | undefined,
    link: string | undefined,
    userContext: EditalUserContext,
  ) {
    this.logger.log(`Re-analisando edital ${id} com Pareto 80/20 | Cargo: ${userContext.cargo}`);
    const edital = await this.supabaseService.getEditalById(id);
    if (!edital) {
      throw new NotFoundException(`Edital com ID ${id} não foi encontrado.`);
    }

    // Atualiza contexto primeiro
    await this.supabaseService.updateEditalContext(id, userContext);

    // Re-processa o texto do edital: usa o enviado ou recupera o original
    let pdfText = '';
    if (file?.buffer || (link && link.trim().startsWith('http'))) {
      pdfText = await this.getPdfText(file, link, edital.title);
    }
    
    if (!pdfText || pdfText.trim().length === 0 || pdfText.includes('[NENHUM PDF FORNECIDO]')) {
      pdfText = edital.pareto_data?._raw_pdf_text || '';
    }

    if (!pdfText || pdfText.trim().length === 0 || pdfText.includes('[NENHUM PDF FORNECIDO]')) {
      this.logger.warn(`Edital ${id} não possui texto extraível real salvo no banco para o fallback.`);
    }

    // Sempre re-extrai o mapa de disciplinas, pois o cargo pode ter mudado.
    // O LangchainOpenAIService usará File API se houver file/link, senão fará fallback no pdfText.
    const mapaExtracao = await this.langChainService.extractEditalMapaOnly(
      pdfText,
      edital.title,
      userContext,
      file?.buffer,
      link
    );

    const paretoAnalysis = mapaExtracao
      ? await this.langChainService.analyzeEditalParetoOnly(mapaExtracao, edital.title, userContext)
      : await this.langChainService.analyzeEditalParetoOnly(edital.pareto_data, edital.title, userContext);

    // Salva novo pareto_data
    const { data, error } = await (this.supabaseService.getAdminClient()!)
      .from('editais')
      .update({ pareto_data: paretoAnalysis })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao salvar re-análise: ${error.message}`);
    }
    return data;
  }

  async dismissEdital(editalId: string, userId: string) {
    this.logger.log(`Usuário ${userId} dispensando edital ${editalId}`);
    const result = await this.supabaseService.dismissEdital(editalId, userId);
    if (result === null) {
      throw new NotFoundException(`Não foi possível dispensar o edital.`);
    }
    return result;
  }

  async deleteEdital(editalId: string) {
    this.logger.log(`Excluindo edital ${editalId} (Admin)`);
    const success = await this.supabaseService.deleteEdital(editalId);
    if (!success) {
      throw new NotFoundException(`Não foi possível excluir o edital ${editalId}.`);
    }
    return { success: true };
  }
}
