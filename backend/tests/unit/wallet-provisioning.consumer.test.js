let mockClientQuery
let mockRelease
let mockConnect

jest.mock('../../src/config/database', () => {
  mockClientQuery = jest.fn()
  mockRelease = jest.fn()
  mockConnect = jest.fn().mockResolvedValue({
    query: mockClientQuery,
    release: mockRelease,
  })
  return {
    connect: mockConnect,
    query: jest.fn(),
  }
})

const { handleWalletTopup } = require('../../src/integrations/consumers/wallet-provisioning.consumer')

describe('Wallet provisioning consumer — idempotência (M2)', () => {
  const companyId = 'c-m2-test-1'
  const topupRequestId = 'tp-m2-1'

  beforeEach(() => {
    jest.clearAllMocks()
    mockClientQuery.mockReset()
    mockRelease.mockReset()
  })

  function mockBeginCommit() {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // BEGIN
  }

  function mockCommit() {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // idempotency check (no match)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT company_wallets ON CONFLICT DO NOTHING
      .mockResolvedValueOnce({ rows: [{ id: 'w-1', balance: '0' }], rowCount: 1 })  // SELECT ... FOR UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // UPDATE company_wallets
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT wallet_transactions
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // UPDATE topup_requests
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // COMMIT
  }

  it('idempotência por gateway_transaction_id — não credita 2x', async () => {
    mockBeginCommit()
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ id: 'wt-1' }], rowCount: 1 })  // idempotency check: já existe
    mockClientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // ROLLBACK

    await handleWalletTopup({
      company_id: companyId,
      amount: 5000,
      gateway: 'test',
      gateway_transaction_id: 'gti-duplicate',
      topup_request_id: topupRequestId,
    }, { traceId: 'test' })

    const queryCalls = mockClientQuery.mock.calls
    const idempotentQuery = queryCalls.find(c => c[0].includes('gateway_transaction_id'))
    expect(idempotentQuery).toBeDefined()
    expect(queryCalls.some(c => c[0].includes('ROLLBACK'))).toBe(true)
    expect(queryCalls.some(c => String(c[0]).includes('SET balance'))).toBe(false)
  })

  it('idempotência por topup_request_id sem gateway_transaction_id — não credita 2x', async () => {
    mockBeginCommit()
    mockClientQuery
      .mockResolvedValueOnce({ rows: [{ id: 'wt-2' }], rowCount: 1 })  // idempotency check: match por reference_type/reference_id
    mockClientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // ROLLBACK

    await handleWalletTopup({
      company_id: companyId,
      amount: 5000,
      gateway: 'test',
      topup_request_id: topupRequestId,
    }, { traceId: 'test' })

    const queryCalls = mockClientQuery.mock.calls
    const refQuery = queryCalls.find(c => c[0].includes("reference_type = 'topup'"))
    expect(refQuery).toBeDefined()
    expect(queryCalls.some(c => c[0].includes('ROLLBACK'))).toBe(true)
    expect(queryCalls.some(c => String(c[0]).includes('SET balance'))).toBe(false)
  })

  it('crédito正常 sem idempotência — primeira execução', async () => {
    mockBeginCommit()
    mockClientQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // idempotency: sem match
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT company_wallets
      .mockResolvedValueOnce({ rows: [{ id: 'w-2', balance: '0' }], rowCount: 1 })  // FOR UPDATE
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // UPDATE company_wallets SET balance
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // INSERT wallet_transactions
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })  // UPDATE topup_requests
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })  // COMMIT

    await expect(handleWalletTopup({
      company_id: companyId,
      amount: 5000,
      gateway: 'test',
      gateway_transaction_id: 'gti-first',
      topup_request_id: topupRequestId,
    }, { traceId: 'test' })).resolves.toBeUndefined()

    const queryCalls = mockClientQuery.mock.calls
    expect(queryCalls.length).toBe(8)
    expect(queryCalls.some(c => String(c[0]).includes('SET balance'))).toBe(true)
  })

  it('ignora payload sem company_id ou amount', async () => {
    await handleWalletTopup({ gateway: 'test' }, { traceId: 'test' })

    expect(mockConnect).not.toHaveBeenCalled()
  })
})
