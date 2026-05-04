const authService = require('../services/auth.service');
const barberService = require('../services/barber.service');
const clientBookingService = require('../services/client-booking.service');

function sendError(res, error, fallbackMessage) {
  const statusCode = error.statusCode || 500;

  if (error.responseBody && typeof error.responseBody === 'object') {
    return res.status(statusCode).json(error.responseBody);
  }

  const message = statusCode >= 500
    ? (fallbackMessage || 'Erro interno no servidor')
    : (error.message || fallbackMessage || 'Erro interno no servidor');

  return res.status(statusCode).json({
    success: false,
    error: message
  });
}

async function collaboratorLogin(req, res) {
  try {
    const session = await authService.login(req.body);

    if (session.user.role !== 'collaborator') {
      return res.status(403).json({
        success: false,
        error: 'Este acesso e exclusivo para colaboradores'
      });
    }

    return res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Erro no login do colaborador barber:', error);
    return sendError(res, error, 'Erro ao autenticar colaborador');
  }
}

async function barberMe(req, res) {
  try {
    const profile = await barberService.getBarberMe(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Erro ao carregar perfil barber:', error);
    return sendError(res, error, 'Erro ao carregar perfil');
  }
}

async function getSettings(req, res) {
  try {
    const settings = await barberService.getSettings(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao carregar configuracoes barber:', error);
    return sendError(res, error, 'Erro ao carregar configuracoes');
  }
}

async function updateSettings(req, res) {
  try {
    const settings = await barberService.updateSettings(req.user.company_id, req.user, req.body);

    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Erro ao atualizar configuracoes barber:', error);
    return sendError(res, error, 'Erro ao atualizar configuracoes');
  }
}

async function getCompanyPlan(req, res) {
  try {
    const companyPlan = await barberService.getCompanyPlanProfile(req.user.company_id);

    return res.json({
      success: true,
      data: companyPlan
    });
  } catch (error) {
    console.error('Erro ao carregar plano da empresa barber:', error);
    return sendError(res, error, 'Erro ao carregar plano da empresa');
  }
}

async function forgotPin(req, res) {
  try {
    const result = await barberService.forgotPin(req.user.company_id, req.user, req.body);

    return res.json(result);
  } catch (error) {
    console.error('Erro ao iniciar recuperacao de PIN barber:', error);
    return sendError(res, error, 'Erro ao iniciar recuperacao de PIN');
  }
}

async function resetPin(req, res) {
  try {
    const result = await barberService.resetPin(req.user.company_id, req.user, req.body);

    return res.json(result);
  } catch (error) {
    console.error('Erro ao redefinir PIN barber:', error);
    return sendError(res, error, 'Erro ao redefinir PIN');
  }
}

async function myDashboard(req, res) {
  try {
    const dashboard = await barberService.getMyDashboard(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard do colaborador barber:', error);
    return sendError(res, error, 'Erro ao carregar dashboard pessoal');
  }
}

async function mySales(req, res) {
  try {
    const sales = await barberService.getMySales(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao listar vendas pessoais barber:', error);
    return sendError(res, error, 'Erro ao listar vendas pessoais');
  }
}

async function myReport(req, res) {
  try {
    const report = await barberService.getMyReport(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Erro ao carregar relatorio pessoal barber:', error);
    return sendError(res, error, 'Erro ao carregar relatorio pessoal');
  }
}

async function openCash(req, res) {
  try {
    const cash = await barberService.openCash(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao abrir caixa barber:', error);
    return sendError(res, error, 'Erro ao abrir caixa');
  }
}

async function getTodayCash(req, res) {
  try {
    const cash = await barberService.getTodayCash(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao carregar caixa de hoje barber:', error);
    return sendError(res, error, 'Erro ao carregar caixa de hoje');
  }
}

async function getDailyCash(req, res) {
  try {
    const cash = await barberService.getDailyCash(req.user.company_id, req.user, req.params.date);

    return res.json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao carregar caixa diario barber:', error);
    return sendError(res, error, 'Erro ao carregar caixa diario');
  }
}

async function listCashHistory(req, res) {
  try {
    const history = await barberService.listCashHistory(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erro ao listar historico de caixa barber:', error);
    return sendError(res, error, 'Erro ao listar historico de caixa');
  }
}

async function getWeeklyCash(req, res) {
  try {
    const summary = await barberService.getWeeklyCash(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erro ao carregar relatorio semanal barber:', error);
    return sendError(res, error, 'Erro ao carregar relatorio semanal');
  }
}

async function getMonthlyCash(req, res) {
  try {
    const summary = await barberService.getMonthlyCash(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erro ao carregar relatorio mensal barber:', error);
    return sendError(res, error, 'Erro ao carregar relatorio mensal');
  }
}

async function preCloseCash(req, res) {
  try {
    const cash = await barberService.preCloseCash(req.user.company_id, req.user, req.body);

    return res.json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao gerar pre-fechamento barber:', error);
    return sendError(res, error, 'Erro ao gerar pre-fechamento');
  }
}

async function closeCash(req, res) {
  try {
    const cash = await barberService.closeCash(req.user.company_id, req.user, req.body);

    return res.json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao fechar caixa barber:', error);
    return sendError(res, error, 'Erro ao fechar caixa');
  }
}

async function reopenCash(req, res) {
  try {
    const cash = await barberService.reopenCash(req.user.company_id, req.user, req.body);

    return res.json({
      success: true,
      data: cash
    });
  } catch (error) {
    console.error('Erro ao reabrir caixa barber:', error);
    return sendError(res, error, 'Erro ao reabrir caixa');
  }
}

async function listServices(req, res) {
  try {
    const services = await barberService.listServices(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erro ao listar servicos barber:', error);
    return sendError(res, error, 'Erro ao listar servicos');
  }
}

async function getServiceById(req, res) {
  try {
    const service = await barberService.getServiceById(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erro ao buscar servico barber:', error);
    return sendError(res, error, 'Erro ao buscar servico');
  }
}

async function getDashboard(req, res) {
  try {
    const dashboard = await barberService.getDashboard(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard barber:', error);
    return sendError(res, error, 'Erro ao carregar dashboard');
  }
}

async function createService(req, res) {
  try {
    const service = await barberService.createService(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erro ao criar servico barber:', error);
    return sendError(res, error, 'Erro ao criar servico');
  }
}

async function updateService(req, res) {
  try {
    const service = await barberService.updateService(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erro ao atualizar servico barber:', error);
    return sendError(res, error, 'Erro ao atualizar servico');
  }
}

async function deleteService(req, res) {
  try {
    await barberService.deleteService(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      message: 'Servico excluido com seguranca'
    });
  } catch (error) {
    console.error('Erro ao excluir servico barber:', error);
    return sendError(res, error, 'Erro ao excluir servico');
  }
}

async function updateServiceStatus(req, res) {
  try {
    const service = await barberService.updateServiceStatus(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erro ao atualizar status do servico barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do servico');
  }
}

async function listSuppliers(req, res) {
  try {
    const suppliers = await barberService.listSuppliers(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Erro ao listar fornecedores barber:', error);
    return sendError(res, error, 'Erro ao listar fornecedores');
  }
}

async function getSupplierById(req, res) {
  try {
    const supplier = await barberService.getSupplierById(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedor barber:', error);
    return sendError(res, error, 'Erro ao buscar fornecedor');
  }
}

async function createSupplier(req, res) {
  try {
    const supplier = await barberService.createSupplier(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Erro ao criar fornecedor barber:', error);
    return sendError(res, error, 'Erro ao criar fornecedor');
  }
}

async function updateSupplier(req, res) {
  try {
    const supplier = await barberService.updateSupplier(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Erro ao atualizar fornecedor barber:', error);
    return sendError(res, error, 'Erro ao atualizar fornecedor');
  }
}

async function deleteSupplier(req, res) {
  try {
    await barberService.deleteSupplier(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      message: 'Fornecedor excluido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir fornecedor barber:', error);
    return sendError(res, error, 'Erro ao excluir fornecedor');
  }
}

async function updateSupplierStatus(req, res) {
  try {
    const supplier = await barberService.updateSupplierStatus(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Erro ao atualizar status do fornecedor barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do fornecedor');
  }
}

async function listProducts(req, res) {
  try {
    const products = await barberService.listProducts(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erro ao listar produtos barber:', error);
    return sendError(res, error, 'Erro ao listar produtos');
  }
}

async function getProductById(req, res) {
  try {
    const product = await barberService.getProductById(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erro ao buscar produto barber:', error);
    return sendError(res, error, 'Erro ao buscar produto');
  }
}

async function createProduct(req, res) {
  try {
    const product = await barberService.createProduct(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erro ao criar produto barber:', error);
    return sendError(res, error, 'Erro ao criar produto');
  }
}

async function updateProduct(req, res) {
  try {
    const product = await barberService.updateProduct(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erro ao atualizar produto barber:', error);
    return sendError(res, error, 'Erro ao atualizar produto');
  }
}

async function deleteProduct(req, res) {
  try {
    await barberService.deleteProduct(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      message: 'Produto excluido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir produto barber:', error);
    return sendError(res, error, 'Erro ao excluir produto');
  }
}

async function updateProductStatus(req, res) {
  try {
    const product = await barberService.updateProductStatus(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Erro ao atualizar status do produto barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do produto');
  }
}

async function listCollaborators(req, res) {
  try {
    const collaborators = await barberService.listCollaborators(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: collaborators
    });
  } catch (error) {
    console.error('Erro ao listar colaboradores barber:', error);
    return sendError(res, error, 'Erro ao listar colaboradores');
  }
}

async function getCollaboratorById(req, res) {
  try {
    const collaborator = await barberService.getCollaboratorById(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao buscar colaborador barber:', error);
    return sendError(res, error, 'Erro ao buscar colaborador');
  }
}

async function listCollaboratorFinancialSummary(req, res) {
  try {
    const summary = await barberService.listCollaboratorFinancialSummary(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erro ao listar resumo financeiro dos colaboradores barber:', error);
    return sendError(res, error, 'Erro ao listar resumo financeiro dos colaboradores');
  }
}

async function createCollaborator(req, res) {
  try {
    const collaborator = await barberService.createCollaborator(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao criar colaborador barber:', error);
    return sendError(res, error, 'Erro ao criar colaborador');
  }
}

async function updateCollaborator(req, res) {
  try {
    const collaborator = await barberService.updateCollaborator(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao atualizar colaborador barber:', error);
    return sendError(res, error, 'Erro ao atualizar colaborador');
  }
}

async function updateCollaboratorStatus(req, res) {
  try {
    const collaborator = await barberService.updateCollaboratorStatus(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao atualizar status do colaborador barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do colaborador');
  }
}

async function updateCollaboratorPermissions(req, res) {
  try {
    const collaborator = await barberService.updateCollaboratorPermissions(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao atualizar permissoes do colaborador barber:', error);
    return sendError(res, error, 'Erro ao atualizar permissoes do colaborador');
  }
}

async function saveCollaboratorAvatar(req, res) {
  try {
    const collaborator = await barberService.saveCollaboratorAvatar(req.user.company_id, req.user, req.params.id, req.file);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao salvar avatar do colaborador barber:', error);
    return sendError(res, error, 'Erro ao salvar foto do colaborador');
  }
}

async function removeCollaboratorAvatar(req, res) {
  try {
    const collaborator = await barberService.removeCollaboratorAvatar(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      data: collaborator
    });
  } catch (error) {
    console.error('Erro ao remover avatar do colaborador barber:', error);
    return sendError(res, error, 'Erro ao remover foto do colaborador');
  }
}

async function deleteCollaborator(req, res) {
  try {
    await barberService.deleteCollaborator(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      message: 'Colaborador excluido com seguranca'
    });
  } catch (error) {
    console.error('Erro ao excluir colaborador barber:', error);
    return sendError(res, error, 'Erro ao excluir colaborador');
  }
}

async function listAdvances(req, res) {
  try {
    const advances = await barberService.listAdvances(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: advances
    });
  } catch (error) {
    console.error('Erro ao listar vales barber:', error);
    return sendError(res, error, 'Erro ao listar vales');
  }
}

async function createAdvance(req, res) {
  try {
    const advance = await barberService.createAdvance(req.user.company_id, req.body, req.user);

    return res.status(201).json({
      success: true,
      data: advance
    });
  } catch (error) {
    console.error('Erro ao criar vale barber:', error);
    return sendError(res, error, 'Erro ao criar vale');
  }
}

async function approveAdvance(req, res) {
  try {
    const advance = await barberService.updateAdvanceStatus(
      req.user.company_id,
      req.user.id,
      req.params.id,
      'approved',
      req.body
    );

    return res.json({
      success: true,
      data: advance
    });
  } catch (error) {
    console.error('Erro ao aprovar vale barber:', error);
    return sendError(res, error, 'Erro ao aprovar vale');
  }
}

async function rejectAdvance(req, res) {
  try {
    const advance = await barberService.updateAdvanceStatus(
      req.user.company_id,
      req.user.id,
      req.params.id,
      'rejected',
      req.body
    );

    return res.json({
      success: true,
      data: advance
    });
  } catch (error) {
    console.error('Erro ao rejeitar vale barber:', error);
    return sendError(res, error, 'Erro ao rejeitar vale');
  }
}

async function listSettlements(req, res) {
  try {
    const settlements = await barberService.listSettlements(
      req.user.company_id,
      req.query.collaboratorId || req.query.collaborator_id,
      req.user
    );

    return res.json({
      success: true,
      data: settlements
    });
  } catch (error) {
    console.error('Erro ao listar fechamentos barber:', error);
    return sendError(res, error, 'Erro ao listar fechamentos');
  }
}

async function createSettlement(req, res) {
  try {
    const settlement = await barberService.createSettlement(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: settlement
    });
  } catch (error) {
    console.error('Erro ao criar fechamento barber:', error);
    return sendError(res, error, 'Erro ao criar fechamento');
  }
}

async function listSales(req, res) {
  try {
    const sales = await barberService.listSales(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erro ao listar vendas barber:', error);
    return sendError(res, error, 'Erro ao listar vendas');
  }
}

async function getSalesSummary(req, res) {
  try {
    const summary = await barberService.getSalesSummary(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Erro ao carregar resumo de vendas barber:', error);
    return sendError(res, error, 'Erro ao carregar resumo de vendas');
  }
}

async function listAppointments(req, res) {
  try {
    const appointments = await barberService.listAppointments(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos barber:', error);
    return sendError(res, error, 'Erro ao listar agendamentos');
  }
}

async function createAppointment(req, res) {
  try {
    const appointment = await barberService.createAppointment(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Erro ao criar agendamento barber:', error);
    return sendError(res, error, 'Erro ao criar agendamento');
  }
}

async function updateAppointmentStatus(req, res) {
  try {
    const appointment = await barberService.updateAppointment(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do agendamento');
  }
}

async function rescheduleAppointment(req, res) {
  try {
    const appointment = await barberService.rescheduleAppointment(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Erro ao remarcar agendamento barber:', error);
    return sendError(res, error, 'Erro ao remarcar agendamento');
  }
}

async function deleteAppointment(req, res) {
  try {
    await barberService.deleteAppointment(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      message: 'Agendamento excluido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir agendamento barber:', error);
    return sendError(res, error, 'Erro ao excluir agendamento');
  }
}

async function listScheduleBlocks(req, res) {
  try {
    const blocks = await barberService.listScheduleBlocks(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    console.error('Erro ao listar bloqueios de agenda barber:', error);
    return sendError(res, error, 'Erro ao listar bloqueios de agenda');
  }
}

async function createScheduleBlock(req, res) {
  try {
    const block = await barberService.createScheduleBlock(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: block
    });
  } catch (error) {
    console.error('Erro ao criar bloqueio de agenda barber:', error);
    return sendError(res, error, 'Erro ao criar bloqueio de agenda');
  }
}

async function deleteScheduleBlock(req, res) {
  try {
    await barberService.deleteScheduleBlock(req.user.company_id, req.user, req.params.id);

    return res.json({
      success: true,
      message: 'Bloqueio excluido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir bloqueio de agenda barber:', error);
    return sendError(res, error, 'Erro ao excluir bloqueio de agenda');
  }
}

async function listWorkingHours(req, res) {
  try {
    const hours = await barberService.listWorkingHours(req.user.company_id, req.user);

    return res.json({
      success: true,
      data: hours
    });
  } catch (error) {
    console.error('Erro ao listar horários de funcionamento barber:', error);
    return sendError(res, error, 'Erro ao listar horários de funcionamento');
  }
}

async function updateWorkingHours(req, res) {
  try {
    const hours = await barberService.updateWorkingHours(req.user.company_id, req.user, req.body);

    return res.json({
      success: true,
      data: hours
    });
  } catch (error) {
    console.error('Erro ao atualizar horários de funcionamento barber:', error);
    return sendError(res, error, 'Erro ao atualizar horários de funcionamento');
  }
}

async function listCustomers(req, res) {
  try {
    const customers = await barberService.listCustomers(req.user.company_id, req.user, req.query);

    return res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Erro ao listar clientes barber:', error);
    return sendError(res, error, 'Erro ao listar clientes');
  }
}

async function getCustomerById(req, res) {
  try {
    const customer = await barberService.getCustomerById(req.user.company_id, req.params.id);

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Erro ao buscar cliente barber:', error);
    return sendError(res, error, 'Erro ao buscar cliente');
  }
}

async function updateCustomerStatus(req, res) {
  try {
    const customer = await barberService.updateCustomerStatus(req.user.company_id, req.params.id, req.body);

    return res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Erro ao atualizar status do cliente barber:', error);
    return sendError(res, error, 'Erro ao atualizar status do cliente');
  }
}

async function getPublicBooking(req, res) {
  try {
    const booking = await clientBookingService.getPublicBookingInfo(req.params.slug);

    return res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erro ao carregar link publico barber:', error);
    return sendError(res, error, 'Erro ao carregar link publico');
  }
}

async function getPublicAvailableSlots(req, res) {
  try {
    const availability = await clientBookingService.getSchedulingAvailability(req.params.slug, req.query);

    return res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Erro ao consultar agenda publica barber:', error);
    return sendError(res, error, 'Erro ao consultar disponibilidade');
  }
}

async function createPublicBookingAppointment(req, res) {
  try {
    const appointment = await clientBookingService.createPublicAppointment(req.params.slug, req.body);

    return res.status(201).json({
      success: true,
      data: appointment,
      message: 'Agendamento criado com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao criar agendamento publico barber:', error);
    return sendError(res, error, 'Erro ao criar agendamento');
  }
}

async function createSale(req, res) {
  try {
    const sale = await barberService.createSale(req.user.company_id, req.user, req.body);

    return res.status(201).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Erro ao criar venda barber:', error);
    return sendError(res, error, 'Erro ao criar venda');
  }
}

async function deleteSale(req, res) {
  try {
    await barberService.cancelSale(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      message: 'Venda cancelada com seguranca'
    });
  } catch (error) {
    console.error('Erro ao cancelar venda barber:', error);
    return sendError(res, error, 'Erro ao cancelar venda');
  }
}

async function cancelSale(req, res) {
  try {
    const sale = await barberService.cancelSale(req.user.company_id, req.user, req.params.id, req.body);

    return res.json({
      success: true,
      data: sale,
      message: 'Venda cancelada com seguranca'
    });
  } catch (error) {
    console.error('Erro ao cancelar venda barber:', error);
    return sendError(res, error, 'Erro ao cancelar venda');
  }
}

module.exports = {
  collaboratorLogin,
  barberMe,
  getSettings,
  updateSettings,
  getCompanyPlan,
  forgotPin,
  resetPin,
  myDashboard,
  mySales,
  myReport,
  openCash,
  getTodayCash,
  getDailyCash,
  listCashHistory,
  getWeeklyCash,
  getMonthlyCash,
  preCloseCash,
  closeCash,
  reopenCash,
  getDashboard,
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
  listSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierStatus,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  listCollaborators,
  listCollaboratorFinancialSummary,
  getCollaboratorById,
  createCollaborator,
  updateCollaborator,
  updateCollaboratorStatus,
  updateCollaboratorPermissions,
  saveCollaboratorAvatar,
  removeCollaboratorAvatar,
  deleteCollaborator,
  listAdvances,
  createAdvance,
  approveAdvance,
  rejectAdvance,
  listSettlements,
  createSettlement,
  listAppointments,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
  deleteAppointment,
  listScheduleBlocks,
  createScheduleBlock,
  deleteScheduleBlock,
  listWorkingHours,
  updateWorkingHours,
  listCustomers,
  getCustomerById,
  updateCustomerStatus,
  getPublicBooking,
  getPublicAvailableSlots,
  createPublicBookingAppointment,
  listSales,
  getSalesSummary,
  createSale,
  cancelSale,
  deleteSale
};
