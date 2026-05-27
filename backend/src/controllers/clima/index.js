'use strict';

const { asyncHandler, success } = require('../../shared');
const ClimaGestor = require('../../services/clima-core.service');

const climaService = new ClimaGestor();

// ─── Profissionais ────────────────────────────────────────────────────────────

const listProfessionals = asyncHandler(async (req, res) => {
  return success(res, await climaService.listProfessionals(req.user.company_id));
}, 'Erro ao listar profissionais');

const createProfessional = asyncHandler(async (req, res) => {
  return success(res, await climaService.createProfessional(req.user.company_id, req.body), { statusCode: 201 });
}, 'Erro ao criar profissional');

// ─── Servicos ─────────────────────────────────────────────────────────────────

const listServices = asyncHandler(async (req, res) => {
  return success(res, await climaService.listServices(req.user.company_id));
}, 'Erro ao listar servicos');

const createService = asyncHandler(async (req, res) => {
  return success(res, await climaService.createService(req.user.company_id, req.body), { statusCode: 201 });
}, 'Erro ao criar servico');

// ─── Disponibilidade ──────────────────────────────────────────────────────────

const getAvailability = asyncHandler(async (req, res) => {
  const slots = await climaService.getAvailability(req.user.company_id, {
    professional_id: req.query.professional_id,
    date:            req.query.date,
    service_id:      req.query.service_id,
  });
  return success(res, { date: req.query.date, slots });
}, 'Erro ao buscar disponibilidade');

// ─── Agendamentos ─────────────────────────────────────────────────────────────

const listAppointments = asyncHandler(async (req, res) => {
  const filters = {
    professional_id: req.query.professional_id,
    status:          req.query.status,
    date:            req.query.date,
  };
  return success(res, await climaService.listAppointments(req.user.company_id, filters));
}, 'Erro ao listar agendamentos');

const getAppointment = asyncHandler(async (req, res) => {
  return success(res, await climaService.getAppointment(req.user.company_id, req.params.id));
}, 'Erro ao buscar agendamento');

const createAppointment = asyncHandler(async (req, res) => {
  return success(res, await climaService.createAppointment(req.user.company_id, req.body), { statusCode: 201 });
}, 'Erro ao criar agendamento');

const cancelAppointment = asyncHandler(async (req, res) => {
  return success(res, await climaService.cancelAppointment(req.user.company_id, req.params.id));
}, 'Erro ao cancelar agendamento');

// ─── Capability Info ──────────────────────────────────────────────────────────

const getCapabilityInfo = asyncHandler(async (req, res) => {
  return success(res, {
    module: 'clima',
    version: '1.0.0',
    capabilities: ['booking-engine'],
    appointment_statuses: climaService.getAppointmentStatuses(),
  });
}, 'Erro ao carregar info da capability');

module.exports = {
  listProfessionals, createProfessional,
  listServices, createService,
  getAvailability,
  listAppointments, getAppointment, createAppointment, cancelAppointment,
  getCapabilityInfo,
};
