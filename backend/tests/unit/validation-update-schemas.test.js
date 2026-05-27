'use strict';

const { z } = require('zod');
const {
  updateServiceSchema,
  updateServiceStatusSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
  updateCollaboratorSchema,
  updateCollaboratorStatusSchema
} = require('../../src/shared/core/validation/schemas');

describe('Barber update schemas', () => {
  describe('updateServiceSchema', () => {
    it('aceita atualizacao parcial', () => {
      expect(() => updateServiceSchema.parse({ price: 50 })).not.toThrow();
    });

    it('rejeita objeto vazio', () => {
      expect(() => updateServiceSchema.parse({})).toThrow('Nenhum campo para atualizar');
    });

    it('rejeita preco negativo', () => {
      expect(() => updateServiceSchema.parse({ price: -10 })).toThrow();
    });
  });

  describe('updateServiceStatusSchema', () => {
    it('aceita is_active booleano', () => {
      expect(() => updateServiceStatusSchema.parse({ is_active: false })).not.toThrow();
    });

    it('rejeita string em vez de boolean', () => {
      expect(() => updateServiceStatusSchema.parse({ is_active: 'false' })).toThrow();
    });
  });

  describe('updateAppointmentStatusSchema', () => {
    it('aceita status valido', () => {
      expect(() => updateAppointmentStatusSchema.parse({ status: 'completed' })).not.toThrow();
    });

    it('rejeita status invalido', () => {
      expect(() => updateAppointmentStatusSchema.parse({ status: 'inexistente' })).toThrow();
    });
  });

  describe('rescheduleAppointmentSchema', () => {
    it('rejeita sem start_at', () => {
      expect(() => rescheduleAppointmentSchema.parse({})).toThrow('start_at');
    });
  });

  describe('updateCustomerSchema', () => {
    it('aceita atualizacao de nome', () => {
      expect(() => updateCustomerSchema.parse({ name: 'Joao Silva' })).not.toThrow();
    });

    it('rejeita objeto vazio', () => {
      expect(() => updateCustomerSchema.parse({})).toThrow('Nenhum campo para atualizar');
    });
  });

  describe('updateCustomerStatusSchema', () => {
    it('aceita status valido', () => {
      expect(() => updateCustomerStatusSchema.parse({ status: 'inactive' })).not.toThrow();
    });
  });

  describe('updateCollaboratorSchema', () => {
    it('aceita atualizacao de comissao', () => {
      expect(() => updateCollaboratorSchema.parse({ commission_rate: 15 })).not.toThrow();
    });

    it('rejeita comissao acima de 100', () => {
      expect(() => updateCollaboratorSchema.parse({ commission_rate: 101 })).toThrow();
    });
  });

  describe('updateCollaboratorStatusSchema', () => {
    it('rejeita is_active como string', () => {
      expect(() => updateCollaboratorStatusSchema.parse({ is_active: 'yes' })).toThrow();
    });
  });
});
