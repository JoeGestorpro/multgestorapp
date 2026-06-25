import { useState, useEffect } from 'react'
import {
  mockNextAppointment,
  mockTodayAgenda,
  mockAlerts,
  mockKPIs,
  mockDailyGoal,
  mockTeamPerformance,
  mockTopServices,
  mockRecoveryClients,
  mockProducts,
  mockPayments,
  mockRevenueChart
} from '../mocks/barberOverviewMock'

const EMPTY = {
  nextAppointment: null,
  agenda: null,
  alerts: [],
  kpis: null,
  dailyGoal: null,
  teamPerformance: [],
  topServices: [],
  recoveryClients: [],
  products: [],
  payments: null,
  revenueChart: []
}

export function useBarberOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setData({
          nextAppointment: mockNextAppointment,
          agenda: mockTodayAgenda,
          alerts: mockAlerts,
          kpis: mockKPIs,
          dailyGoal: mockDailyGoal,
          teamPerformance: mockTeamPerformance,
          topServices: mockTopServices,
          recoveryClients: mockRecoveryClients,
          products: mockProducts,
          payments: mockPayments,
          revenueChart: mockRevenueChart
        })
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [])

  if (!data) return { loading, error, ...EMPTY }

  return {
    loading,
    error,
    nextAppointment: data.nextAppointment,
    agenda: data.agenda,
    alerts: data.alerts,
    kpis: data.kpis,
    dailyGoal: data.dailyGoal,
    teamPerformance: data.teamPerformance,
    topServices: data.topServices,
    recoveryClients: data.recoveryClients,
    products: data.products,
    payments: data.payments,
    revenueChart: data.revenueChart
  }
}
