// tests/unit/security-middleware.test.js

const mockPool = { query: jest.fn() };
jest.mock('../../src/config/database', () => mockPool);

const requireBarberModuleModule = require('../../src/middlewares/requireBarberModule');
const requireBarberModule = requireBarberModuleModule;
const { invalidateBarberModuleCache } = requireBarberModuleModule;

describe('requireBarberModule', () => {
  let req, res, next;

  beforeEach(() => {
    invalidateBarberModuleCache(); // limpa cache entre testes
    req = { user: { company_id: 'company-1' }, log: { warn: jest.fn() } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar next() quando modulo barber esta ativo', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'mod-1' }] });

    await requireBarberModule(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando modulo nao esta ativo', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await requireBarberModule(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando usuario nao tem company_id', async () => {
    req.user = {};

    await requireBarberModule(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('deve usar cache e nao repetir query no segundo acesso', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'mod-1' }] });

    await requireBarberModule(req, res, next);
    await requireBarberModule(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(1); // apenas uma query
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('deve invalidar cache por company_id', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'mod-1' }] });

    await requireBarberModule(req, res, next);
    invalidateBarberModuleCache('company-1');
    await requireBarberModule(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(2); // cache foi invalidado
  });
});
