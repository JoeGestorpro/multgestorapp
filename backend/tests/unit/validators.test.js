// Jest: globals (describe, it, expect) are available automatically
const {
  normalizeEmail,
  isValidEmail,
  isValidPassword,
  isValidPin,
  normalizePhone,
  normalizeSlug,
  normalizeDateInput,
  normalizeTimeInput,
  toNumber,
  toNullableInteger,
  isNonEmptyString,
  hasMinLength,
  isFiniteNumberValue,
} = require('../../src/utils/validators')

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  TEST@Example.COM  ')).toBe('test@example.com')
  })

  it('returns null for falsy values', () => {
    expect(normalizeEmail(null)).toBeNull()
    expect(normalizeEmail(undefined)).toBeNull()
    expect(normalizeEmail('')).toBeNull()
  })
})

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.org')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('accepts passwords with minimum length', () => {
    expect(isValidPassword('123456')).toBe(true)
    expect(isValidPassword('1234567', 7)).toBe(true)
  })

  it('rejects short passwords', () => {
    expect(isValidPassword('12345')).toBe(false)
    expect(isValidPassword('12345', 6)).toBe(false)
  })
})

describe('isValidPin', () => {
  it('accepts valid PINs', () => {
    expect(isValidPin('1234')).toBe(true)
    expect(isValidPin('123456', 6)).toBe(true)
  })

  it('rejects non-numeric PINs', () => {
    expect(isValidPin('abcd')).toBe(false)
    expect(isValidPin('12ab')).toBe(false)
  })

  it('rejects short PINs', () => {
    expect(isValidPin('123')).toBe(false)
  })
})

describe('normalizePhone', () => {
  it('removes non-digits', () => {
    expect(normalizePhone('(11) 99999-9999')).toBe('11999999999')
    expect(normalizePhone('+55 11 99999 9999')).toBe('5511999999999')
  })

  it('returns null for falsy values', () => {
    expect(normalizePhone(null)).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })
})

describe('normalizeSlug', () => {
  it('creates URL-safe slugs', () => {
    expect(normalizeSlug('Hello World')).toBe('hello-world')
    expect(normalizeSlug('Café & Bar')).toBe('cafe-bar')
    expect(normalizeSlug('  Test  ')).toBe('test')
  })

  it('returns empty string for falsy values', () => {
    expect(normalizeSlug(null)).toBe('')
    expect(normalizeSlug('')).toBe('')
  })
})

describe('normalizeDateInput', () => {
  it('accepts YYYY-MM-DD format', () => {
    expect(normalizeDateInput('2024-01-15')).toBe('2024-01-15')
  })

  it('returns fallback for empty values', () => {
    expect(normalizeDateInput(null, 'default')).toBe('default')
    expect(normalizeDateInput('', 'fallback')).toBe('fallback')
  })

  it('throws for invalid format', () => {
    expect(() => normalizeDateInput('15/01/2024')).toThrow('Data invalida')
    expect(() => normalizeDateInput('2024-1-15')).toThrow('Data invalida')
  })
})

describe('normalizeTimeInput', () => {
  it('accepts HH:MM format', () => {
    expect(normalizeTimeInput('14:30')).toBe('14:30:00')
  })

  it('accepts HH:MM:SS format', () => {
    expect(normalizeTimeInput('14:30:00')).toBe('14:30:00')
  })

  it('returns fallback for empty values', () => {
    expect(normalizeTimeInput(null, '00:00')).toBe('00:00')
  })

  it('throws for invalid format', () => {
    expect(() => normalizeTimeInput('2:30')).toThrow('Horario invalido')
  })
})

describe('toNumber', () => {
  it('converts valid numbers', () => {
    expect(toNumber('42')).toBe(42)
    expect(toNumber(42)).toBe(42)
    expect(toNumber('3.14')).toBe(3.14)
  })

  it('returns 0 for invalid values', () => {
    expect(toNumber('abc')).toBe(0)
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
  })
})

describe('toNullableInteger', () => {
  it('converts to integer', () => {
    expect(toNullableInteger('42')).toBe(42)
    expect(toNullableInteger(42.7)).toBe(43)
  })

  it('returns null for invalid values', () => {
    expect(toNullableInteger(null)).toBeNull()
    expect(toNullableInteger(undefined)).toBeNull()
    expect(toNullableInteger('')).toBeNull()
    expect(toNullableInteger('abc')).toBeNull()
  })
})

describe('isNonEmptyString', () => {
  it('returns true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true)
    expect(isNonEmptyString('  x  ')).toBe(true)
  })

  it('returns false for empty/falsy', () => {
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString(null)).toBe(false)
  })
})

describe('hasMinLength', () => {
  it('checks minimum length', () => {
    expect(hasMinLength('hello', 3)).toBe(true)
    expect(hasMinLength('hi', 3)).toBe(false)
  })
})

describe('isFiniteNumberValue', () => {
  it('accepts finite numbers', () => {
    expect(isFiniteNumberValue(42)).toBe(true)
    expect(isFiniteNumberValue('42')).toBe(true)
    expect(isFiniteNumberValue(0)).toBe(true)
  })

  it('rejects non-numbers', () => {
    expect(isFiniteNumberValue(null)).toBe(false)
    expect(isFiniteNumberValue('')).toBe(false)
    expect(isFiniteNumberValue(undefined)).toBe(false)
    expect(isFiniteNumberValue(NaN)).toBe(false)
  })
})
