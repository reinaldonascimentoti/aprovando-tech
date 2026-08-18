const fs = require('fs');
const path = 'c:/Dev/aprovando-tech/frontend/src/app/pages/pareto-analysis/pareto-analysis.component.ts';
let content = fs.readFileSync(path, 'utf8');

// Camada 2 - Tópicos Card Background
content = content.replace(/class="neo-raised rounded-xl/g, 'class="bg-[var(--surface-container)] border border-[var(--outline-variant)] rounded-xl');

// Camada 3 - Subtópicos Card Backgrounds (removing hardcoded light colors)
content = content.replace(/'bg-\[#eefff2\]\/60 neo-raised-sm' : 'bg-\[#fafafa\] opacity-60'/g, "'bg-[var(--surface-container-low)] border border-[var(--outline-variant)]' : 'bg-[var(--surface-container-highest)] opacity-50 border border-[var(--outline-variant)]'");

// Camada 3 - Planejamento Badges (Horas, Revisões, Dependências) to Grayscale + good text contrast
content = content.replace(/bg-\[#f3edf7\] text-\[#49454f\]/g, 'bg-[var(--surface-container-high)] text-[var(--on-surface)]');
content = content.replace(/bg-\[#e8def8\] text-\[#1d192b\]/g, 'bg-[var(--surface-container-highest)] text-[var(--on-surface)]');
content = content.replace(/bg-\[#fff8f0\] text-\[#b45309\]/g, 'bg-[var(--surface-container-high)] text-[var(--on-surface-variant)]');

// Camada 3 - Frequência Badges to Grayscale
content = content.replace(/bg-\[#eceef1\] text-\[var\(--on-surface\)\]/g, 'bg-[var(--surface-container-high)] text-[var(--on-surface)]');
content = content.replace(/bg-\[#f5f5f5\] text-\[var\(--on-surface-variant\)\]/g, 'bg-[var(--surface-container)] text-[var(--on-surface-variant)]');

// Camada 3 - Custo-Benefício Badges to Grayscale with colored text
content = content.replace(/'bg-\[#dcfce7\] text-\[#166534\]'/g, "'bg-[var(--surface-container-highest)] text-[var(--tertiary)]'");
content = content.replace(/'bg-\[#fefce8\] text-\[#854d0e\]'/g, "'bg-[var(--surface-container-highest)] text-[#ff9800]'");
content = content.replace(/'bg-\[#fee2e2\] text-\[#991b1b\]'/g, "'bg-[var(--surface-container-highest)] text-[var(--error)]'");

// Temperature Badges (Camada 2) to Grayscale with colored text (so it doesn't break in dark mode)
content = content.replace(/'bg-\[#ffdad6\] text-\[#93000a\]'/g, "'bg-[var(--surface-container-highest)] text-[var(--error)]'");
content = content.replace(/'bg-\[#fff3e0\] text-\[#e65100\]'/g, "'bg-[var(--surface-container-highest)] text-[#ff9800]'");
content = content.replace(/'bg-\[#e3f2fd\] text-\[#1565c0\]'/g, "'bg-[var(--surface-container-highest)] text-[#4da6ff]'");

fs.writeFileSync(path, content, 'utf8');
console.log('Grayscale update complete.');
