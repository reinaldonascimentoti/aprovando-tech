export interface BancaInfo {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}

export const BANCA_REGISTRY: BancaInfo[] = [
  {
    id: 'cesgranrio',
    name: 'Fundação Cesgranrio',
    shortName: 'Cesgranrio',
    logo: 'assets/logo-bancas/CESGRANRIO.svg',
  },
  {
    id: 'cebraspe',
    name: 'Cebraspe',
    shortName: 'Cebraspe',
    logo: 'assets/logo-bancas/CESBRASPE.png',
  },
  {
    id: 'fgv',
    name: 'Fundação Getulio Vargas',
    shortName: 'FGV',
    logo: 'assets/logo-bancas/FGV.svg',
  },
  {
    id: 'fcc',
    name: 'Fundação Carlos Chagas',
    shortName: 'FCC',
    logo: 'assets/logo-bancas/FCC-svg.svg',
  },
  {
    id: 'aocp',
    name: 'Instituto AOCP',
    shortName: 'AOCP',
    logo: 'assets/logo-bancas/AOCP.svg',
  },
  {
    id: 'consulplan',
    name: 'Instituto Consulplan',
    shortName: 'Consulplan',
    logo: 'assets/logo-bancas/CONSULPLAN.svg',
  },
  {
    id: 'ibfc',
    name: 'Instituto Brasileiro de Formação e Capacitação',
    shortName: 'IBFC',
    logo: 'assets/logo-bancas/IBFC.svg',
  },
  {
    id: 'funece',
    name: 'FUNECE / UECE',
    shortName: 'FUNECE',
    logo: 'assets/logo-bancas/FUNECE.svg',
  },
];

/**
 * Normaliza e identifica todas as bancas mencionadas no texto.
 * Exemplo: "Fundação Cesgranrio (ou Cebraspe no perfil múltipla escolha)" retorna [Cesgranrio, Cebraspe]
 */
export function getBancasFromText(text: string | null | undefined): BancaInfo[] {
  if (!text) return [];
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const matched: BancaInfo[] = [];

  const patterns: { id: string; regex: RegExp }[] = [
    { id: 'cesgranrio', regex: /cesgranrio/i },
    { id: 'cebraspe', regex: /(cebraspe|cespe|unb)/i },
    { id: 'fgv', regex: /(fgv|getulio\s*vargas)/i },
    { id: 'fcc', regex: /(fcc|carlos\s*chagas)/i },
    { id: 'aocp', regex: /aocp/i },
    { id: 'consulplan', regex: /consulplan/i },
    { id: 'ibfc', regex: /ibfc/i },
    { id: 'funece', regex: /(funece|uece)/i },
  ];

  for (const p of patterns) {
    if (p.regex.test(normalized)) {
      const b = BANCA_REGISTRY.find(item => item.id === p.id);
      if (b && !matched.some(m => m.id === b.id)) {
        matched.push(b);
      }
    }
  }

  return matched;
}

/**
 * Retorna a primeira banca identificada no texto ou null se nenhuma for encontrada.
 */
export function getBancaInfo(text: string | null | undefined): BancaInfo | null {
  const list = getBancasFromText(text);
  return list.length > 0 ? list[0] : null;
}

/**
 * Retorna o caminho do logo da banca ou null.
 */
export function getBancaLogo(text: string | null | undefined): string | null {
  const info = getBancaInfo(text);
  return info ? info.logo : null;
}
