import { describe, it, expect } from 'vitest'
import {
  calcOccupancy,
  calcGoalProgress,
  calcAverageTicket,
  calcExpectedCommission,
  getOccupancyLabel,
  getGoalStatus,
  getGoalStatusVariant,
  sortAlertsByPriority,
  getAlertPriorityVariant
} from './overviewRules'

describe('calcOccupancy', () => {
  it('returns correct percentage', () => {
    expect(calcOccupancy(8, 16)).toBe(50)
    expect(calcOccupancy(16, 16)).toBe(100)
    expect(calcOccupancy(0, 16)).toBe(0)
  })

  it('returns 0 for invalid total', () => {
    expect(calcOccupancy(5, 0)).toBe(0)
    expect(calcOccupancy(5, null)).toBe(0)
  })
})

describe('calcGoalProgress', () => {
  it('returns correct progress percentage', () => {
    expect(calcGoalProgress(1500, 750)).toBe(50)
    expect(calcGoalProgress(1000, 1000)).toBe(100)
    expect(calcGoalProgress(1000, 2000)).toBe(100)
  })

  it('returns 0 for invalid goal', () => {
    expect(calcGoalProgress(0, 500)).toBe(0)
    expect(calcGoalProgress(null, 500)).toBe(0)
  })
})

describe('calcAverageTicket', () => {
  it('divides revenue by count', () => {
    expect(calcAverageTicket(900, 3)).toBe(300)
    expect(calcAverageTicket(93.33, 1)).toBeCloseTo(93.33)
  })

  it('returns 0 for zero count', () => {
    expect(calcAverageTicket(500, 0)).toBe(0)
    expect(calcAverageTicket(500, null)).toBe(0)
  })
})

describe('calcExpectedCommission', () => {
  it('applies default 30% rate', () => {
    expect(calcExpectedCommission(1000)).toBeCloseTo(300)
  })

  it('applies custom rate', () => {
    expect(calcExpectedCommission(1000, 0.5)).toBeCloseTo(500)
  })

  it('returns 0 for zero revenue', () => {
    expect(calcExpectedCommission(0)).toBe(0)
    expect(calcExpectedCommission(null)).toBe(0)
  })
})

describe('getOccupancyLabel', () => {
  it('returns correct labels', () => {
    expect(getOccupancyLabel(80)).toBe('Alta')
    expect(getOccupancyLabel(50)).toBe('Média')
    expect(getOccupancyLabel(49)).toBe('Baixa')
    expect(getOccupancyLabel(0)).toBe('Baixa')
  })
})

describe('getGoalStatus', () => {
  it('classifies goal status correctly', () => {
    expect(getGoalStatus(100)).toBe('achieved')
    expect(getGoalStatus(75)).toBe('ontrack')
    expect(getGoalStatus(40)).toBe('behind')
    expect(getGoalStatus(39)).toBe('critical')
    expect(getGoalStatus(0)).toBe('critical')
  })
})

describe('getGoalStatusVariant', () => {
  it('returns correct DS badge variants', () => {
    expect(getGoalStatusVariant('achieved')).toBe('success')
    expect(getGoalStatusVariant('ontrack')).toBe('info')
    expect(getGoalStatusVariant('behind')).toBe('warning')
    expect(getGoalStatusVariant('critical')).toBe('danger')
  })
})

describe('sortAlertsByPriority', () => {
  it('sorts high before medium before low', () => {
    const alerts = [
      { id: 'l', priority: 'low' },
      { id: 'h', priority: 'high' },
      { id: 'm', priority: 'medium' }
    ]
    const sorted = sortAlertsByPriority(alerts)
    expect(sorted.map((a) => a.id)).toEqual(['h', 'm', 'l'])
  })

  it('does not mutate original array', () => {
    const alerts = [{ id: 'l', priority: 'low' }, { id: 'h', priority: 'high' }]
    sortAlertsByPriority(alerts)
    expect(alerts[0].id).toBe('l')
  })
})

describe('getAlertPriorityVariant', () => {
  it('returns DS badge variants', () => {
    expect(getAlertPriorityVariant('high')).toBe('danger')
    expect(getAlertPriorityVariant('medium')).toBe('warning')
    expect(getAlertPriorityVariant('low')).toBe('info')
    expect(getAlertPriorityVariant('unknown')).toBe('neutral')
  })
})
