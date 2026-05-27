# Backend Rules — MultGestor / BarberGestor

## Stack

- Node.js + Express
- CommonJS (`require` / `module.exports`)
- PostgreSQL via `pg` (SQL direto, sem ORM)
- JWT (`jsonwebtoken`)
- Resend para e-mail
- Multer para upload
- Supabase Storage para arquivos

## Regras de Express

1. **Separação de responsabilidades:**
   - Rota → valida entrada e chama controller
   - Controller → orquestra a lógica e chama serviços
   - Service → regras de negócio
   - Query → SQL puro

2. **Tratamento de erro:**
   - Usar `try/catch` em toda rota async
   - Middleware global de erro: `(err, req, res, next)`
   - Nunca expor stack trace em produção

3. **Respostas padronizadas:**
   ```js
   // Sucesso
   res.json({ success: true, data: { ... } })
   // Erro
   res.status(400).json({ success: false, error: 'Mensagem clara' })
   ```

## Validação Backend (REGRRA CRÍTICA)

1. **Toda entrada DEVE ser validada no backend.** O frontend nunca é confiável.
2. Validar tipos, formatos, tamanhos, valores obrigatórios.
3. Validar permissões do usuário para cada ação.
4. Validar se o recurso pertence ao `company_id` do usuário.
5. Sanitizar strings (espaços extras, injeção SQL via parametrização).

## Autenticação e Autorização

1. JWT é gerado no login e verificado por middleware.
2. O token contém: `userId`, `companyId` (se tenant), `role`, `email`.
3. Middleware `auth.js` extrai e valida o JWT.
4. Middleware `tenant.js` garante que `company_id` da requisição bate com o do token.
5. PIN adicional pode ser exigido para ações sensíveis (excluir venda, fechar caixa).

## company_id Obrigatório (REGRRA DE SEGURANÇA)

1. Toda query em tabelas tenant DEVE ter `WHERE company_id = $companyId`.
2. O `company_id` vem do token JWT, nunca do corpo da requisição.
3. INSERT em tabelas tenant DEVE incluir `company_id`.
4. DELETE em tabelas tenant DEVE verificar `company_id`.
5. Exceção: tabelas do sistema master e tabelas públicas (sem `company_id`).

## Segurança de Rotas

1. Rotas públicas (`/agendamento/*`, `/auth/*`) — sem JWT.
2. Rotas tenant (`/barber/*`) — JWT obrigatório + `company_id`.
3. Rotas master (`/master/*`) — JWT master admin.
4. Verificar role do usuário antes de ações administrativas.
5. Colaborador não pode acessar configurações da empresa.

## Logs

1. Logar erros com `console.error`.
2. Logar ações críticas (login, exclusão, fechamento de caixa).
3. Nunca logar tokens, senhas ou dados sensíveis.

## WhatsApp

1. Access token criptografado no banco usando `WHATSAPP_TOKEN_ENCRYPTION_KEY`.
2. GET da integração NUNCA retorna o token real.
3. Apenas retornar metadados (número vinculado, status, etc.).

## Resend (E-mail)

1. Usar SDK oficial do Resend.
2. Usar `FRONTEND_URL` para links nos e-mails.
3. Templates de e-mail para: primeiro acesso, reset de senha, confirmações.
4. Nunca expor `RESEND_API_KEY` no frontend.

## Cuidados para Produção

1. Nunca usar `localhost` em produção.
2. Verificar `NODE_ENV` para comportamentos diferentes (dev vs prod).
3. Pool de conexão com banco configurado com `ssl: { rejectUnauthorized: true }`.
4. CORS configurado com origens autorizadas.
5. Headers de segurança ativos.
6. Erros não tratados não devem crashar o processo (usar `process.on('uncaughtException')`).
