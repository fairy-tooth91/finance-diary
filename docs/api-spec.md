# API Specification (Data Contract)

Service 함수들이 정의하는 데이터 계약입니다.
현재 Supabase를 직접 호출하며, 향후 자체 백엔드 전환 시에도 동일한 함수 시그니처를 유지합니다.

## Entities

### Transaction
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| date | string | O | 날짜 (YYYY-MM-DD) |
| type | `'income' \| 'expense'` | O | 수입/지출 |
| category | string | O | 카테고리 |
| amount | number | O | 금액 |
| memo | string | O | 메모 |
| paymentMethod | `'cash' \| 'card'` | - | 결제수단 (지출만) |
| cardId | string | - | 카드 ID |
| installmentId | string | - | 할부 ID |

### Asset
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| name | string | O | 자산명 |
| type | `'cash' \| 'savings' \| 'investment' \| 'realestate' \| 'other'` | O | 유형 |
| amount | number | O | 금액 |
| institution | string | - | 금융기관 |
| memo | string | O | 메모 |
| updatedAt | string | O | 수정일 |

### Loan
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| name | string | O | 대출명 |
| type | `'mortgage' \| 'credit' \| 'personal' \| 'other'` | O | 유형 |
| principal | number | O | 원금 |
| remainingBalance | number | O | 잔액 |
| interestRate | number | O | 이자율 (%) |
| monthlyPayment | number | O | 월 상환액 |
| startDate | string | O | 시작일 |
| endDate | string | - | 종료일 |
| institution | string | O | 금융기관 |
| memo | string | O | 메모 |

### Card
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| name | string | O | 카드명 |
| company | string | O | 카드사 |
| type | `'debit' \| 'credit'` | O | 체크/신용 |
| billingDay | number | - | 결제일 (1-31) |
| linkedAssetId | string | - | 연결 계좌 ID |
| memo | string | O | 메모 |

### Installment
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| itemName | string | O | 품목명 |
| cardId | string | O | 카드 ID |
| cardName | string | O | 카드명 (표시용) |
| category | string | O | 카테고리 |
| totalAmount | number | O | 총 금액 |
| monthlyAmount | number | O | 월 납입액 |
| totalMonths | number | O | 총 할부 개월 |
| paidMonths | number | O | 납입 완료 개월 |
| startDate | string | O | 첫 결제일 |
| paymentDay | number | O | 매월 결제일 |
| memo | string | O | 메모 |

### StockTrade
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | O | 고유 ID |
| date | string | O | 매매일 |
| stockName | string | O | 종목명 |
| stockCode | string | O | 종목코드 |
| tradeType | `'buy' \| 'sell'` | O | 매수/매도 |
| quantity | number | O | 수량 |
| price | number | O | 단가 |
| total | number | O | 총액 |
| memo | string | O | 메모 (투자 일기) |

### PortfolioHolding
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| stockName | string | O | 종목명 |
| stockCode | string | O | 종목코드 (PK) |
| quantity | number | O | 보유수량 |
| avgPrice | number | O | 평균단가 |
| currentPrice | number | O | 현재가 |
| highPrice | number | O | 고점 (3개월 HWM) |
| dropFromHigh | number | O | 고점 대비 하락률 |
| profitRate | number | O | 수익률 |

### PriceHistory
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| date | string | O | 날짜 |
| stockCode | string | O | 종목코드 |
| closePrice | number | O | 종가 |

## Service Functions

### Standard CRUD (도메인별)
| 함수 | 설명 | 비고 |
|------|------|------|
| `fetchXxx(userId)` | 전체 조회 | 사용자별 필터 |
| `createXxx(userId, entity)` | 추가 | |
| `updateXxx(id, partial)` | 부분 수정 | Asset, Loan, Card, Installment |
| `deleteXxx(id)` | 삭제 | |

### 특수 Functions
| 서비스 | 함수 | 설명 |
|--------|------|------|
| portfolio | `upsertPortfolio(userId, holdings[])` | 전체 포트폴리오 upsert |
| portfolio | `deletePortfolioByStockCode(userId, code)` | 종목코드로 삭제 |
| priceHistory | `upsertPriceHistory(userId, entries[])` | 가격 이력 upsert |
| connection | `testConnection(userId)` | 연결 상태 확인 |
| auth | `loginWithSocial(provider)` | 소셜 로그인 |
| auth | `logout()` | 로그아웃 |
| auth | `getCurrentUser()` | 현재 사용자 조회 |
| auth | `onAuthStateChange(callback)` | 인증 상태 구독 |

## 향후 REST API 설계 (백엔드 분리 시)

```
GET    /api/transactions          → fetchTransactions()
POST   /api/transactions          → createTransaction()
DELETE /api/transactions/:id      → deleteTransaction()

GET    /api/assets                → fetchAssets()
POST   /api/assets                → createAsset()
PATCH  /api/assets/:id            → updateAsset()
DELETE /api/assets/:id            → deleteAsset()

// ... 동일 패턴으로 loans, cards, installments, stock-trades

PUT    /api/portfolio             → upsertPortfolio()
DELETE /api/portfolio/:stockCode  → deletePortfolioByStockCode()

PUT    /api/price-history         → upsertPriceHistory()

GET    /api/health                → testConnection()
```
