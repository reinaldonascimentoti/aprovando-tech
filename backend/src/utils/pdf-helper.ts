import { Logger } from '@nestjs/common';

const pdfjsLib = require('pdfjs-dist');

export async function extractTextFromPdf(buffer: Buffer, filename: string, logger: Logger): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const pageTexts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      pageTexts.push(text);
    }
    return pageTexts.join('\n\n');
  } catch (err: any) {
    logger.warn(`Falha ao extrair texto do PDF (${filename}): ${err.message}`);
    return `Conteúdo do arquivo PDF de aula: ${filename}`;
  }
}
