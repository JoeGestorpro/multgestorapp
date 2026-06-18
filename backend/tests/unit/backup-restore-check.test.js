'use strict';

const brc = require('../../scripts/backup-restore-check');

const SRC = 'postgresql://postgres.aaa:s3cr3t@db-main.example.com:5432/postgres';
const TGT = 'postgresql://postgres.bbb:s3cr3t@db-test.example.com:5432/postgres';

describe('backup-restore-check — parsing', () => {
  test('parseEndpoint extrai host/port/db', () => {
    const ep = brc.parseEndpoint(SRC);
    expect(ep.host).toBe('db-main.example.com');
    expect(ep.port).toBe('5432');
    expect(ep.database).toBe('postgres');
  });

  test('parseEndpoint rejeita string ausente/ inválida', () => {
    expect(() => brc.parseEndpoint('')).toThrow(/ausente/);
    expect(() => brc.parseEndpoint('não-é-url')).toThrow(/inválida/);
  });

  test('sameEndpoint distingue origem e destino', () => {
    expect(brc.sameEndpoint(brc.parseEndpoint(SRC), brc.parseEndpoint(SRC))).toBe(true);
    expect(brc.sameEndpoint(brc.parseEndpoint(SRC), brc.parseEndpoint(TGT))).toBe(false);
  });
});

describe('backup-restore-check — guards de topologia', () => {
  test('aborta se origem == destino', () => {
    expect(() =>
      brc.assertSafeTopology({
        source: brc.parseEndpoint(SRC),
        target: brc.parseEndpoint(SRC),
        disposableFlag: true,
        protectedHosts: [],
      })
    ).toThrow(/mesmo endpoint/);
  });

  test('aborta sem --target-is-disposable', () => {
    expect(() =>
      brc.assertSafeTopology({
        source: brc.parseEndpoint(SRC),
        target: brc.parseEndpoint(TGT),
        disposableFlag: false,
        protectedHosts: [],
      })
    ).toThrow(/target-is-disposable/);
  });

  test('aborta se destino está na denylist', () => {
    expect(() =>
      brc.assertSafeTopology({
        source: brc.parseEndpoint(SRC),
        target: brc.parseEndpoint(TGT),
        disposableFlag: true,
        protectedHosts: ['db-test.example.com'],
      })
    ).toThrow(/denylist/);
  });

  test('passa com alvo descartável válido e flag presente', () => {
    expect(() =>
      brc.assertSafeTopology({
        source: brc.parseEndpoint(SRC),
        target: brc.parseEndpoint(TGT),
        disposableFlag: true,
        protectedHosts: ['db-main.example.com'],
      })
    ).not.toThrow();
  });

  test('loadConfig sempre adiciona a origem à denylist (origem nunca pode ser destino)', () => {
    const cfg = brc.loadConfig(
      { 'target-is-disposable': true },
      { BRCHK_SOURCE_DB_URL: SRC, BRCHK_TARGET_DB_URL: TGT }
    );
    expect(cfg.protectedHosts).toContain('db-main.example.com');
  });

  test('loadConfig exige source e target', () => {
    expect(() => brc.loadConfig({}, { BRCHK_TARGET_DB_URL: TGT })).toThrow(/BRCHK_SOURCE_DB_URL/);
    expect(() => brc.loadConfig({}, { BRCHK_SOURCE_DB_URL: SRC })).toThrow(/BRCHK_TARGET_DB_URL/);
  });
});

describe('backup-restore-check — classificação de erros do restore', () => {
  test('objetos gerenciados viram warning', () => {
    expect(brc.classifyRestoreError('pg_restore: error: ... must be owner of event trigger ...')).toBe('warning');
    expect(brc.classifyRestoreError('pg_restore: warning: ... schema "auth" ...')).toBe('warning');
    expect(brc.classifyRestoreError('pg_restore: error: permission denied for schema storage')).toBe('warning');
    expect(brc.classifyRestoreError('pg_restore: warning: errors ignored on restore: 12')).toBe('warning');
  });

  test('erro real do schema public NÃO é warning', () => {
    expect(brc.classifyRestoreError('pg_restore: error: relation public.users already exists')).toBe('error');
  });

  test('linha sem error/warning é ignorada', () => {
    expect(brc.classifyRestoreError('pg_restore: creating TABLE public.companies')).toBeNull();
  });
});

describe('backup-restore-check — veredito', () => {
  const base = {
    dumpReadable: true,
    restoreExecuted: true,
    sourceStats: { public_tables: 55, public_policies: 45, rls_on: 37, rls_off: 18 },
    targetStats: { public_tables: 55, public_policies: 45, rls_on: 37, rls_off: 18 },
    sourceCounts: { companies: 8, users: 25 },
    targetCounts: { companies: 8, users: 25 },
    criticalTables: ['companies', 'users'],
  };

  test('APPROVED quando tudo bate', () => {
    expect(brc.computeVerdict(base).verdict).toBe('APPROVED');
  });

  test('BLOCKED quando public_tables diverge', () => {
    const v = brc.computeVerdict({ ...base, targetStats: { ...base.targetStats, public_tables: 54 } });
    expect(v.verdict).toBe('BLOCKED');
    expect(v.reasons.join(' ')).toMatch(/public_tables/);
  });

  test('BLOCKED quando rls_on diverge', () => {
    const v = brc.computeVerdict({ ...base, targetStats: { ...base.targetStats, rls_on: 36 } });
    expect(v.verdict).toBe('BLOCKED');
    expect(v.reasons.join(' ')).toMatch(/rls_on/);
  });

  test('BLOCKED quando contagem crítica diverge', () => {
    const v = brc.computeVerdict({ ...base, targetCounts: { companies: 8, users: 24 } });
    expect(v.verdict).toBe('BLOCKED');
    expect(v.reasons.join(' ')).toMatch(/users/);
  });

  test('BLOCKED quando dump não é legível', () => {
    expect(brc.computeVerdict({ ...base, dumpReadable: false }).verdict).toBe('BLOCKED');
  });

  test('BLOCKED quando restore não executou', () => {
    expect(brc.computeVerdict({ ...base, restoreExecuted: false }).verdict).toBe('BLOCKED');
  });
});

describe('backup-restore-check — log sem secrets (regra #7)', () => {
  test('buildLogRecord não inclui connection string, senha nem host', () => {
    const rec = brc.buildLogRecord({
      startedAt: 't0',
      finishedAt: 't1',
      sourceLabel: 'principal',
      targetLabel: 'descartavel',
      dumpFile: 'C:\\Users\\Joefe\\backups\\principal-2026-06-17.dump',
      dumpStatus: 'ok',
      restoreStatus: 'executed',
      restoreWarnings: 3,
      sourceStats: { public_tables: 55, public_policies: 45, rls_on: 37, rls_off: 18 },
      targetStats: { public_tables: 55, public_policies: 45, rls_on: 37, rls_off: 18 },
      sourceCounts: { companies: 8 },
      targetCounts: { companies: 8 },
      verdict: { verdict: 'APPROVED', reasons: [] },
    });
    const blob = JSON.stringify(rec);
    expect(blob).not.toMatch(/s3cr3t/);
    expect(blob).not.toMatch(/postgresql:\/\//);
    expect(blob).not.toMatch(/example\.com/);
    expect(blob).not.toMatch(/Users\\Joefe/); // sem caminho absoluto do dump
    expect(rec.dump_file).toBe('principal-2026-06-17.dump'); // só o basename
    expect(rec.source).toBe('principal');
    expect(rec.restore_managed_warnings).toBe(3);
    expect(rec.verdict).toBe('APPROVED');
  });
});
