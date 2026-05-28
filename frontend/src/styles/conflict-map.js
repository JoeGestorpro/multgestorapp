/* global module */
/**
 * ============================================
 * CSS CONFLICT MAP
 * ============================================
 * 
 * Mapa de conflitos potenciais entre:
 * - Barber.css (prefixo .barber-*)
 * - Design System (prefixo .ds-*)
 * - globals.css (reset/base)
 * 
 * Atualizado: 2026-05-09
 * 
 * ============================================
 */

module.exports = {
  /**
   * CONFLITOS IDENTIFICADOS
   * 
   * Cada entrada mostra:
   * - selector_antigo: Seletor do Barber.css
   * - selector_novo: Seletor equivalente do DS
   * - conflito: Descrição do conflito potencial
   * - solução: Como evitar
   */
  conflicts: [
    {
      id: 'button-radius',
      selector_antigo: '.barber-premium-shell button { border-radius: 14px; }',
      selector_novo: '.ds-button { border-radius: var(--radius-md); }',
      conflito: 'Barber.css aplica border-radius a TODOS os botões dentro do shell. DS buttons são filhos do Shell.',
      solução: 'DS usa !important ou .ds-button wins por ser mais específico. Verificar em compatibilidade.css.',
      severidade: 'baixa',
      status: 'mitigado'
    },
    {
      id: 'card-background',
      selector_antigo: '.barber-card { background: var(--barber-panel); }',
      selector_novo: '.ds-card { background: var(--bg-elevated); }',
      conflito: 'Ambos definem background. Se .ds-card estiver dentro de .barber-card, pode haver conflito.',
      solução: 'DS usa encapsulamento. Componentes DS são isolados do contexto Barber.',
      severidade: 'média',
      status: 'mitigado'
    },
    {
      id: 'sidebar-z-index',
      selector_antigo: '.barber-sidebar { z-index: 20; }',
      selector_novo: '.ds-sidebar { z-index: var(--z-sticky); }',
      conflito: 'Valores diferentes. 20 vs 200 (CSS var).',
      solução: 'DS vence por usar CSS custom properties. Convivênciaharmoniosa.',
      severidade: 'baixa',
      status: 'ok'
    },
    {
      id: 'color-text',
      selector_antigo: '.barber-premium-shell { color: var(--barber-text); }',
      selector_novo: 'body { color: var(--text-primary); }',
      conflito: 'Ambas variáveis são #f8fafc, mas vindo de fontes diferentes.',
      solução: 'Valores são idênticos. Definidos em compatibility.css como fallback.',
      severidade: 'nenhuma',
      status: 'ok'
    },
    {
      id: 'icon-size',
      selector_antigo: '.barber-icon { width: 18px; height: 18px; }',
      selector_novo: '.ds-sidebar__item-icon svg { width: 100%; height: 100%; }',
      conflito: 'DS usa ícone via componente Lucide com tamanho 100%. Barber usa SVG inline.',
      solução: 'DS Icons são via Lucide React (SVG), não afetam .barber-icon.',
      severidade: 'nenhuma',
      status: 'ok'
    },
    {
      id: 'page-padding',
      selector_antigo: '.barber-main { padding: 0 30px 34px; }',
      selector_novo: '.ds-shell__content { padding: var(--space-6); }',
      conflito: 'Valores de padding diferentes (30px vs 24px).',
      solução: 'Shell é usado em contexto separado do BarberLayout. Shell substitui BarberLayout, não coexiste.',
      severidade: 'média',
      status: 'mitigado'
    },
    {
      id: 'grid-gap',
      selector_antigo: '.barber-kpi-grid { gap: 16px; }',
      selector_novo: '.ds-shell { gap: não definido; }',
      conflito: 'Não há gap no shell, mas há nos grids do Barber.',
      solução: 'Grids do Barber continuarão usando .barber-kpi-grid. DS StatCards podem ser usados dentro desses grids.',
      severidade: 'baixa',
      status: 'ok'
    },
    {
      id: 'border-radius-cards',
      selector_antigo: '.barber-card, .barber-kpi-card { border-radius: 24px; }',
      selector_novo: '.ds-card { border-radius: var(--radius-lg); }',
      conflito: '24px vs 16px (radius-lg). Visual diferente.',
      solução: 'DS cards são componentes novos. Ao migrar, substituir gradualmente .barber-card por .ds-card.',
      severidade: 'média',
      status: 'documentado'
    },
    {
      id: 'font-family',
      selector_antigo: 'Nenhum (herda do body)',
      selector_novo: 'body { font-family: var(--font-family); }',
      conflito: 'Nenhum - mesmo valor em ambos.',
      solução: 'Inter é a fonte. harmony.',
      severidade: 'nenhuma',
      status: 'ok'
    },
    {
      id: 'font-size-scale',
      selector_antigo: 'Nenhum definido em Barber.css',
      selector_novo: '--font-size-xs: 11px até --font-size-4xl: 40px',
      conflito: 'DS define escala tipográfica completa. Barber não define, usa defaults.',
      solução: 'Barber usa browser defaults ou herda. DS escala é mais controlada.',
      severidade: 'baixa',
      status: 'ok'
    }
  ],

  /**
   * REGRAS DE COEXISTÊNCIA
   */
  coexistenceRules: [
    {
      rule: 'Prefix Separation',
      description: 'Barber usa .barber-*, DS usa .ds-*. Nunca usar mesmo nome.',
      implemented: true
    },
    {
      rule: 'Import Order',
      description: 'Barber.css primeiro, DS CSS depois. DS vence por cascata.',
      implemented: true
    },
    {
      rule: 'Specificity',
      description: 'DS usa classes mais específicas quando necessário.',
      implemented: true
    },
    {
      rule: 'CSS Variables',
      description: 'Ambos podem coexistir via custom properties. DS usa --ds-*, Barber usa --barber-*.',
      implemented: true
    },
    {
      rule: 'Component Isolation',
      description: 'Componentes DS são encapsulados. Não herdam estilos de родитель.',
      implemented: true
    }
  ],

  /**
   * PLANOS DE MITIGAÇÃO
   */
  mitigationPlans: {
    phase1: {
      name: 'Layout Shell Migration',
      completed: true,
      conflicts: [
        { id: 'page-padding', status: 'resolved' },
        { id: 'sidebar-z-index', status: 'resolved' }
      ]
    },
    phase2: {
      name: 'KPI Cards to StatCard',
      status: 'pending',
      conflicts: [
        { id: 'border-radius-cards', status: 'pending' },
        { id: 'card-background', status: 'pending' }
      ],
      mitigation: 'Usar !important temporariamente até migração completa'
    },
    phase3: {
      name: 'Charts and Lists',
      status: 'pending',
      conflicts: [],
      mitigation: 'Nenhum conflito esperado'
    }
  },

  /**
   * CHECKLIST DE VERIFICAÇÃO
   */
  verificationChecklist: [
    'Executar npm run build após cada fase',
    'Verificar console.log por warnings de CSS',
    'Testar em viewport mobile (1024px e abaixo)',
    'Testar viewport tablet (768px)',
    'Testar viewport desktop (1280px+)',
    'Verificar contraste de texto',
    'Verificar espaçamento consistente',
    'Verificar alinhamento de ícones',
    'Verificar border-radius consistente',
    'Verificar z-index de modais e overlays'
  ],

  /**
   * TOKENS COMPATÍVEIS
   * Tokens que são equivalentes em ambos sistemas
   */
  compatibleTokens: [
    { barber: '--barber-text', ds: '--text-primary', value: '#f8fafc', status: 'ok' },
    { barber: '--barber-soft', ds: '--text-secondary', value: '#d4dee8', status: 'ok' },
    { barber: '--barber-muted', ds: '--text-muted', value: '#93a6b4', status: 'harmonized' },
    { barber: '--barber-border', ds: '--border-default', value: 'rgba(151, 164, 179, 0.16)', status: 'harmonized' },
    { barber: '--barber-bg', ds: '--bg-primary', value: '#070a0d', status: 'ok' },
    { barber: '--barber-accent', ds: '--accent-primary', value: '#8cff4f', status: 'diverged', note: 'Valores levemente diferentes (8cff4f vs a3ff12). DS mais verde.' }
  ]
}