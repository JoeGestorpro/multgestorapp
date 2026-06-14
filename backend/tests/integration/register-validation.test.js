// tests/integration/register-validation.test.js
// Garante que POST /api/auth/register rejeita HTML/script em campos de nome
// ANTES de chegar ao controller/banco (defesa contra XSS armazenado).
// A falha de validação ocorre no middleware validateRequest → 400, sem tocar no DB.

const supertest = require('supertest')
const { createIntegrationApp, registerRoutes } = require('../helpers/integration-app')
const authRoutes = require('../../src/routes/auth.routes')

let request = null

beforeAll(() => {
  const app = createIntegrationApp()
  registerRoutes(app, [{ path: '/api/auth', router: authRoutes }])
  request = supertest(app)
})

describe('POST /api/auth/register — bloqueio de HTML (XSS armazenado)', () => {
  const base = { name: 'Joao', email: 'joao@test.com', password: 'senha123' }

  it('retorna 400 quando name contém <script>', async () => {
    const res = await request.post('/api/auth/register').send({
      ...base,
      name: '<script>alert(1)</script>'
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('retorna 400 quando company_name contém < ou >', async () => {
    const res = await request.post('/api/auth/register').send({
      ...base,
      company_name: 'Empresa "> <img src=x onerror=alert(1)>'
    })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

// Nota: a regressão de nome válido ("Barbearia João & Filhos") é coberta de forma
// determinística no unit test (tests/unit/validation-schemas.test.js), sem depender
// de banco. Aqui validamos apenas o portão de rejeição (400), que não toca o DB.
