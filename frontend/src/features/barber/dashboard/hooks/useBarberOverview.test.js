import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBarberOverview } from './useBarberOverview'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('useBarberOverview', () => {
  it('starts in loading state', () => {
    const { result } = renderHook(() => useBarberOverview())
    expect(result.current.loading).toBe(true)
    expect(result.current.kpis).toBeNull()
  })

  it('resolves with mock data after timeout', async () => {
    const { result } = renderHook(() => useBarberOverview())
    vi.runAllTimers()
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.kpis).not.toBeNull()
    expect(result.current.nextAppointment).not.toBeNull()
    expect(result.current.agenda).not.toBeNull()
    expect(result.current.alerts.length).toBeGreaterThan(0)
    expect(result.current.teamPerformance.length).toBeGreaterThan(0)
    expect(result.current.revenueChart.length).toBe(7)
  })

  it('exposes empty arrays before data loads', () => {
    const { result } = renderHook(() => useBarberOverview())
    expect(result.current.alerts).toEqual([])
    expect(result.current.teamPerformance).toEqual([])
    expect(result.current.recoveryClients).toEqual([])
    expect(result.current.products).toEqual([])
    expect(result.current.revenueChart).toEqual([])
  })

  it('kpis include all required fields', async () => {
    const { result } = renderHook(() => useBarberOverview())
    vi.runAllTimers()
    await waitFor(() => expect(result.current.loading).toBe(false))

    const { kpis } = result.current
    expect(kpis).toHaveProperty('revenue')
    expect(kpis).toHaveProperty('appointments')
    expect(kpis).toHaveProperty('averageTicket')
    expect(kpis).toHaveProperty('occupancy')
    expect(kpis).toHaveProperty('clientsServed')
    expect(kpis).toHaveProperty('expectedCommission')
  })

  it('dailyGoal includes goal and realized', async () => {
    const { result } = renderHook(() => useBarberOverview())
    vi.runAllTimers()
    await waitFor(() => expect(result.current.loading).toBe(false))

    const { dailyGoal } = result.current
    expect(dailyGoal).toHaveProperty('goal')
    expect(dailyGoal).toHaveProperty('realized')
    expect(dailyGoal.goal).toBeGreaterThan(0)
  })
})
