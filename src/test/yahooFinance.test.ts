import { describe, it, expect } from 'vitest'
import { yahooFinanceService } from '../services/yahooFinance'

describe('YahooFinanceService', () => {
  describe('formatStockCode', () => {
    it('returns code as-is if already has .KS suffix', () => {
      expect(yahooFinanceService.formatStockCode('005930.KS')).toBe('005930.KS')
    })

    it('returns code as-is if already has .KQ suffix', () => {
      expect(yahooFinanceService.formatStockCode('035720.KQ')).toBe('035720.KQ')
    })

    it('adds .KS suffix to 6-digit Korean codes', () => {
      expect(yahooFinanceService.formatStockCode('005930')).toBe('005930.KS')
      expect(yahooFinanceService.formatStockCode('035720')).toBe('035720.KS')
    })

    it('returns non-Korean codes as-is', () => {
      expect(yahooFinanceService.formatStockCode('AAPL')).toBe('AAPL')
      expect(yahooFinanceService.formatStockCode('MSFT')).toBe('MSFT')
    })
  })

  describe('calculateHighWatermark', () => {
    it('returns the maximum price from price array', () => {
      const prices = [
        { close: 100, high: 105 },
        { close: 110, high: 115 },
        { close: 95, high: 100 },
      ]
      expect(yahooFinanceService.calculateHighWatermark(prices)).toBe(115)
    })

    it('returns 0 for empty array', () => {
      expect(yahooFinanceService.calculateHighWatermark([])).toBe(0)
    })

    it('handles single price', () => {
      const prices = [{ close: 100, high: 105 }]
      expect(yahooFinanceService.calculateHighWatermark(prices)).toBe(105)
    })
  })

  describe('calculateDropFromHigh', () => {
    it('calculates percentage drop from high', () => {
      expect(yahooFinanceService.calculateDropFromHigh(90, 100)).toBe(-10)
      expect(yahooFinanceService.calculateDropFromHigh(80, 100)).toBe(-20)
    })

    it('returns 0 when at high', () => {
      expect(yahooFinanceService.calculateDropFromHigh(100, 100)).toBe(0)
    })

    it('returns positive when above high (unusual case)', () => {
      expect(yahooFinanceService.calculateDropFromHigh(110, 100)).toBe(10)
    })

    it('returns 0 when high is 0', () => {
      expect(yahooFinanceService.calculateDropFromHigh(100, 0)).toBe(0)
    })
  })

  describe('isAlertTriggered', () => {
    it('returns true when drop exceeds threshold', () => {
      expect(yahooFinanceService.isAlertTriggered(-10)).toBe(true)
      expect(yahooFinanceService.isAlertTriggered(-15)).toBe(true)
    })

    it('returns false when drop is less than threshold', () => {
      expect(yahooFinanceService.isAlertTriggered(-5)).toBe(false)
      expect(yahooFinanceService.isAlertTriggered(0)).toBe(false)
    })

    it('respects custom threshold', () => {
      expect(yahooFinanceService.isAlertTriggered(-5, -5)).toBe(true)
      expect(yahooFinanceService.isAlertTriggered(-10, -15)).toBe(false)
    })
  })
})
