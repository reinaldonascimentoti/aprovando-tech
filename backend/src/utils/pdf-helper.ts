import { Logger } from '@nestjs/common';

const pdfjsLib = require('pdfjs-dist');

/**
 * Extrai texto de um buffer PDF preservando a estrutura do documento.
 *
 * Melhorias em relação à versão anterior:
 * - Detecta quebras de parágrafo via posição Y dos itens de texto
 * - Preserva numeração de itens (1., 2., a), b))
 * - Trata hifenização de palavras quebradas entre linhas
 * - Adiciona separador de página para contexto
 */
export async function extractTextFromPdf(buffer: Buffer, filename: string, logger: Logger): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = content.items as any[];

      if (items.length === 0) {
        pageTexts.push('');
        continue;
      }

      // Agrupa itens por linha baseado na posição Y
      const lines: { y: number; items: any[] }[] = [];
      const Y_THRESHOLD = 3; // Itens dentro de 3px são considerados da mesma linha

      for (const item of items) {
        if (!item.str || item.str.trim() === '') continue;

        const y = Math.round(item.transform?.[5] ?? 0);
        const existingLine = lines.find(l => Math.abs(l.y - y) < Y_THRESHOLD);

        if (existingLine) {
          existingLine.items.push(item);
        } else {
          lines.push({ y, items: [item] });
        }
      }

      // Ordena linhas de cima para baixo (Y decresce em PDF)
      lines.sort((a, b) => b.y - a.y);

      const pageLines: string[] = [];
      let prevY: number | null = null;
      const PARAGRAPH_GAP = 15; // Gap maior que 15px = novo parágrafo

      for (const line of lines) {
        // Ordena itens da esquerda para direita
        line.items.sort((a: any, b: any) => (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0));

        // Monta texto da linha com espaçamento apropriado
        let lineText = '';
        for (let j = 0; j < line.items.length; j++) {
          const item = line.items[j];
          const text = item.str;
          
          if (j > 0) {
            // Adiciona espaço entre itens se necessário
            const prevItem = line.items[j - 1];
            const prevEnd = (prevItem.transform?.[4] ?? 0) + (prevItem.width ?? 0);
            const currentStart = item.transform?.[4] ?? 0;
            const gap = currentStart - prevEnd;

            if (gap > 5) {
              lineText += '  '; // Tabulação para gaps grandes
            } else if (gap > 0.5) {
              lineText += ' ';
            }
          }
          lineText += text;
        }

        lineText = lineText.trim();
        if (!lineText) continue;

        // Detecta se há um gap de parágrafo
        if (prevY !== null) {
          const yGap = prevY - line.y;
          if (yGap > PARAGRAPH_GAP) {
            pageLines.push(''); // Linha vazia = separador de parágrafo
          }
        }

        // Trata hifenização: se a linha anterior termina com hífen, junta
        if (pageLines.length > 0) {
          const lastLine = pageLines[pageLines.length - 1];
          if (lastLine.endsWith('-') && lineText.length > 0 && lineText[0] === lineText[0].toLowerCase()) {
            pageLines[pageLines.length - 1] = lastLine.slice(0, -1) + lineText;
            prevY = line.y;
            continue;
          }
        }

        pageLines.push(lineText);
        prevY = line.y;
      }

      pageTexts.push(`--- Página ${i} ---\n${pageLines.join('\n')}`);
    }

    const fullText = pageTexts.join('\n\n');
    logger.log(`PDF "${filename}" extraído: ${doc.numPages} páginas, ${fullText.length} caracteres.`);
    return fullText;
  } catch (err: any) {
    logger.warn(`Falha ao extrair texto do PDF (${filename}): ${err.message}`);
    return `[ERRO NA EXTRAÇÃO] Não foi possível extrair o texto do PDF: ${filename}. Erro: ${err.message}`;
  }
}
