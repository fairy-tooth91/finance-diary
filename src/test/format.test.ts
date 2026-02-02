import { describe, it, expect } from 'vitest'
import {
  formatKRW,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateInput,
  getValueColor,
  getAlertBgColor,
} from '../utils/format'

describe('format utilities', () => {
  describe('formatKRW', () => {
    it('formats positive numbers as Korean Won', () => {
      expect(formatKRW(1000)).toBe('₩1,000')
      expect(formatKRW(1234567)).toBe('₩1,234,567')
    })

    it('formats zero', () => {
      expect(formatKRW(0)).toBe('₩0')
    })

    it('formats negative numbers', () => {
      expect(formatKRW(-5000)).toBe('-₩5,000')
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('formats with decimals', () => {
      expect(formatNumber(1234.5678, 2)).toBe('1,234.57')
    })
  })

  describe('formatPercent', () => {
    it('formats positive percentages with + sign', () => {
      expect(formatPercent(10.5)).toBe('+10.50%')
    })

    it('formats negative percentages', () => {
      expect(formatPercent(-5.25)).toBe('-5.25%')
    })

    it('formats zero', () => {
      expect(formatPercent(0)).toBe('+0.00%')
    })
  })

  describe('formatDate', () => {
    it('formats date in Korean locale', () => {
      const result = formatDate('2024-03-15')
      expect(result).toContain('2024')
      expect(result).toContain('3')
      expect(result).toContain('15')
    })
  })

  describe('formatDateInput', () => {
    it('returns date in YYYY-MM-DD format', () => {
      const result = formatDateInput(new Date('2024-03-15'))
      expect(result).toBe('2024-03-15')
    })
  })

  describe('getValueColor', () => {
    it('returns green for positive values', () => {
      expect(getValueColor(100)).toBe('text-green-600')
    })

    it('returns red for negative values', () => {
      expect(getValueColor(-100)).toBe('text-red-600')
    })

    it('returns gray for zero', () => {
      expect(getValueColor(0)).toBe('text-gray-600')
    })
  })

  describe('getAlertBgColor', () => {
    it('returns red for drops >= 10%', () => {
      expect(getAlertBgColor(-10)).toBe('bg-red-100 border-red-300')
      expect(getAlertBgColor(-15)).toBe('bg-red-100 border-red-300')
    })

    it('returns yellow for drops between 5% and 10%', () => {
      expect(getAlertBgColor(-5)).toBe('bg-yellow-100 border-yellow-300')
      expect(getAlertBgColor(-7)).toBe('bg-yellow-100 border-yellow-300')
    })

    it('returns white for small or no drops', () => {
      expect(getAlertBgColor(0)).toBe('bg-white border-gray-200')
      expect(getAlertBgColor(-3)).toBe('bg-white border-gray-200')
    })
  })
})
