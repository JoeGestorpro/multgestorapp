'use strict';

const express       = require('express');
const c             = require('../controllers/clima');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireBarberAdminAuth } = require('../middlewares/auth.middleware');
const requireCompany = require('../middlewares/requireCompany');
const requireClimaModule = require('../middlewares/requireClimaModule');
const { validateRequest, validateQuery } = require('../shared/core/validation');
const { createClimaAppointmentSchema, getClimaAvailabilitySchema } = require('../shared/core/validation/schemas/clima-requests.schema');

const router = express.Router();

router.use(authMiddleware);
router.use(requireBarberAdminAuth);
router.use(requireCompany);
router.use(requireClimaModule);

// Capability info
router.get('/info', c.getCapabilityInfo);

// Profissionais
router.get('/professionals',  c.listProfessionals);
router.post('/professionals', c.createProfessional);

// Servicos
router.get('/services',  c.listServices);
router.post('/services', c.createService);

// Disponibilidade
router.get('/availability', validateQuery(getClimaAvailabilitySchema), c.getAvailability);

// Agendamentos
router.get('/appointments',     c.listAppointments);
router.get('/appointments/:id', c.getAppointment);
router.post('/appointments', validateRequest(createClimaAppointmentSchema), c.createAppointment);
router.delete('/appointments/:id', c.cancelAppointment);

module.exports = router;
