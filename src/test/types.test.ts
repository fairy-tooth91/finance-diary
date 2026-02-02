import { describe, it, expect } from 'vitest'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types'

describe('types and constants', () => {
  describe('EXPENSE_CATEGORIES', () => {
    it('contains expected categories', () => {
      expect(EXPENSE_CATEGORIES).toContain('식비')
      expect(EXPENSE_CATEGORIES).toContain('교통')
      expect(EXPENSE_CATEGORIES).toContain('쇼핑')
      expect(EXPENSE_CATEGORIES).toContain('기타')
    })

    it('has at least 5 categories', () => {
      expect(EXPENSE_CATEGORIES.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe('INCOME_CATEGORIES', () => {
    it('contains expected categories', () => {
      expect(INCOME_CATEGORIES).toContain('급여')
      expect(INCOME_CATEGORIES).toContain('부수입')
      expect(INCOME_CATEGORIES).toContain('투자수익')
      expect(INCOME_CATEGORIES).toContain('기타')
    })

    it('has at least 3 categories', () => {
      expect(INCOME_CATEGORIES.length).toBeGreaterThanOrEqual(3)
    })
  })
})
