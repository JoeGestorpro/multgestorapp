'use strict';

const { AbacatePayProvider, extractWalletMetadata } = require('../../src/shared/capabilities/billing/providers/abacatepay.provider');

describe('Fase 2 — Wallet Topup — Provider Layer', () => {
  let provider;

  beforeAll(() => {
    provider = new AbacatePayProvider({ apiKey: 'test-key' });
  });

  describe('extractWalletMetadata (exported function)', () => {
    it('extrai metadata de data.checkout.metadata', () => {
      const payload = {
        event: 'billing.approved',
        data: {
          id: 'bill-123',
          status: 'APPROVED',
          checkout: {
            metadata: {
              topup_request_id: 'tp-req-1',
              company_id: 'c-1',
              purpose: 'deposit',
            },
          },
        },
      };

      const meta = extractWalletMetadata(payload);
      expect(meta).toEqual({
        topup_request_id: 'tp-req-1',
        company_id: 'c-1',
        purpose: 'deposit',
      });
    });

    it('extrai metadata de data.subscription.metadata', () => {
      const payload = {
        event: 'subscription.approved',
        data: {
          id: 'sub-1',
          subscription: {
            metadata: {
              topup_request_id: 'tp-req-2',
              company_id: 'c-2',
            },
          },
        },
      };

      const meta = extractWalletMetadata(payload);
      expect(meta).toEqual({
        topup_request_id: 'tp-req-2',
        company_id: 'c-2',
        purpose: 'deposit',
      });
    });

    it('extrai metadata de top-level metadata', () => {
      const payload = {
        event: 'billing.approved',
        data: { id: 'bill-3' },
        metadata: {
          topup_request_id: 'tp-req-3',
          company_id: 'c-3',
          purpose: 'withdrawal',
        },
      };

      const meta = extractWalletMetadata(payload);
      expect(meta).toEqual({
        topup_request_id: 'tp-req-3',
        company_id: 'c-3',
        purpose: 'withdrawal',
      });
    });

    it('retorna null se nenhum metadata tem topup_request_id', () => {
      const payload = {
        event: 'billing.approved',
        data: { id: 'bill-123', checkout: { metadata: { some: 'thing' } } },
      };
      expect(extractWalletMetadata(payload)).toBeNull();
    });

    it('retorna null se nao ha metadata', () => {
      expect(extractWalletMetadata({ event: 'billing.approved', data: { id: 'bill-123' } })).toBeNull();
    });

    it('retorna null se payload vazio', () => {
      expect(extractWalletMetadata({})).toBeNull();
    });
  });

  describe('normalize inclui wallet_meta', () => {
    it('inclui wallet_meta quando metadata tem company_id (em checkout)', () => {
      const payload = {
        event: 'billing.approved',
        data: {
          id: 'bill-123',
          status: 'APPROVED',
          checkout: { metadata: { topup_request_id: 'tr-1', company_id: 'c-1', purpose: 'deposit' } },
        },
      };

      const normalized = provider.normalize(payload);
      expect(normalized.wallet_meta).toBeDefined();
      expect(normalized.wallet_meta.company_id).toBe('c-1');
      expect(normalized.wallet_meta.topup_request_id).toBe('tr-1');
    });

    it('retorna wallet_meta null quando metadata sem topup_request_id', () => {
      const payload = {
        event: 'billing.approved',
        data: { id: 'bill-456', checkout: { metadata: { some: 'thing' } } },
      };

      const normalized = provider.normalize(payload);
      expect(normalized.wallet_meta).toBeNull();
    });
  });
});
