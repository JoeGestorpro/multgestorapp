'use strict';

// Testes da sonda TEMPORÁRIA OPS-MIGRATIONS-03B.
// ⚠️ Removidos junto com a sonda (ver revert/probe-build-connectivity-03b).
//
// Objetivo: provar que a lógica de dois clientes independentes está CORRETA
// contra um Postgres real (o efêmero do CI, sessão estável por construção).
// Isto NÃO prova o comportamento do pooler — só que um resultado negativo na
// execução real seria do pooler, não de um bug desta sonda.

const { Pool } = require('pg');
const {
  derivarEndpointSession,
  provarSessaoEstavel,
  classify,
} = require('../../scripts/probe-build-connectivity');

describe('probe-build-connectivity — derivarEndpointSession (regras 1 e 2)', () => {
  it('deriva 5432 via parser quando a origem é pooler Supabase em 6543', () => {
    const r = derivarEndpointSession('postgresql://u:p@aws-0-exemplo-9.pooler.supabase.com:6543/postgres');
    expect(r.ok).toBe(true);
    expect(new URL(r.url).port).toBe('5432');
    // host, usuário e senha preservados intactos — troca cirúrgica de porta
    expect(new URL(r.url).hostname).toBe('aws-0-exemplo-9.pooler.supabase.com');
    expect(new URL(r.url).username).toBe('u');
  });

  it('RECUSA quando o host não é pooler Supabase', () => {
    const r = derivarEndpointSession('postgresql://u:p@db.exemplo.supabase.co:6543/postgres');
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('ORIGEM_NAO_RECONHECIDA_COMO_POOLER_6543');
  });

  it('RECUSA quando a porta de origem não é 6543', () => {
    const r = derivarEndpointSession('postgresql://u:p@aws-0-exemplo-9.pooler.supabase.com:5432/postgres');
    expect(r.ok).toBe(false);
    expect(r.motivo).toBe('ORIGEM_NAO_RECONHECIDA_COMO_POOLER_6543');
  });

  it('não confunde host que apenas CONTÉM o sufixo do pooler', () => {
    const r = derivarEndpointSession('postgresql://u:p@pooler.supabase.com.atacante.test:6543/postgres');
    expect(r.ok).toBe(false);
  });

  it('trata URL inválida sem lançar', () => {
    expect(derivarEndpointSession('nao-e-url').ok).toBe(false);
    expect(derivarEndpointSession('nao-e-url').motivo).toBe('URL_INVALIDA');
  });
});

describe('probe-build-connectivity — classify (regra 9)', () => {
  it('mapeia códigos conhecidos', () => {
    expect(classify({ code: 'ENETUNREACH' })).toBe('ENETUNREACH');
    expect(classify({ code: '28P01' })).toBe('28P01');
  });

  it('nunca devolve mensagem nem stack', () => {
    const err = new Error('conexao falhou em user:senha@host-secreto:6543');
    err.code = 'ZZZ_NAO_MAPEADO';
    const out = classify(err);
    expect(out).toBe('OUTRO');
    expect(out).not.toMatch(/senha|host-secreto|6543/);
  });

  it('erro sem code vira DESCONHECIDO', () => {
    expect(classify(new Error('qualquer coisa'))).toBe('DESCONHECIDO');
  });
});

describe('probe-build-connectivity — provarSessaoEstavel (regras 4 e 5)', () => {
  const url = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  const rodar = url ? describe : describe.skip;

  rodar('contra Postgres real', () => {
    it('prova sessão estável: A trava → B bloqueado → A libera → B trava', async () => {
      const r = await provarSessaoEstavel(Pool, url, false);
      expect(r.etapa).toBe('COMPLETA');
      expect(r.estavel).toBe(true);
    }, 30000);

    it('não deixa a trava retida após a prova', async () => {
      // Se a prova anterior vazou a trava, esta aquisição falharia.
      const r = await provarSessaoEstavel(Pool, url, false);
      expect(r.estavel).toBe(true);
    }, 30000);

    it('não cria nem altera nenhuma tabela (regra 7)', async () => {
      const pool = new Pool({ connectionString: url, max: 1 });
      try {
        const antes = await pool.query(
          "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'"
        );
        await provarSessaoEstavel(Pool, url, false);
        const depois = await pool.query(
          "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'"
        );
        expect(depois.rows[0].n).toBe(antes.rows[0].n);
      } finally {
        await pool.end();
      }
    }, 30000);
  });
});
