export interface MarketIndicator {
  symbol: string;
  label: string;
  unit: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
}

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  shortName: string;
}

interface YahooChartResult {
  meta: {
    regularMarketPrice: number;
    chartPreviousClose: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  timestamp: number[];
  indicators: {
    quote: Array<{
      close: (number | null)[];
      high: (number | null)[];
    }>;
  };
}

export class YahooFinanceService {
  // Using a CORS proxy for client-side requests
  private corsProxy = 'https://api.allorigins.win/raw?url=';

  // Format stock code for Yahoo Finance
  // Korean stocks: 005930.KS (KOSPI), 035720.KQ (KOSDAQ)
  formatStockCode(code: string): string {
    // If already formatted with .KS or .KQ, return as is
    if (code.endsWith('.KS') || code.endsWith('.KQ')) {
      return code;
    }
    // Default to KOSPI (.KS) for Korean 6-digit codes
    if (/^\d{6}$/.test(code)) {
      return `${code}.KS`;
    }
    return code;
  }

  async getQuote(stockCode: string): Promise<YahooQuote | null> {
    try {
      const formattedCode = this.formatStockCode(stockCode);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedCode}?interval=1d&range=1d`;

      const response = await fetch(this.corsProxy + encodeURIComponent(url));
      if (!response.ok) throw new Error('Failed to fetch quote');

      const data = await response.json();
      const result = data.chart.result?.[0] as YahooChartResult | undefined;

      if (!result) return null;

      const price = result.meta.regularMarketPrice;
      return {
        symbol: formattedCode,
        regularMarketPrice: price,
        regularMarketPreviousClose: result.meta.chartPreviousClose ?? price,
        fiftyTwoWeekHigh: result.meta.fiftyTwoWeekHigh ?? price,
        fiftyTwoWeekLow: result.meta.fiftyTwoWeekLow ?? price,
        shortName: formattedCode,
      };
    } catch (err) {
      console.error('Error fetching quote:', err);
      return null;
    }
  }

  async getQuotes(stockCodes: string[]): Promise<Map<string, YahooQuote>> {
    const results = new Map<string, YahooQuote>();

    // Fetch quotes in parallel
    const promises = stockCodes.map(async (code) => {
      const quote = await this.getQuote(code);
      if (quote) {
        results.set(code, quote);
      }
    });

    await Promise.all(promises);
    return results;
  }

  async getHistoricalPrices(
    stockCode: string,
    period: '1mo' | '3mo' | '6mo' | '1y' = '1mo'
  ): Promise<{ date: string; close: number; high: number }[]> {
    try {
      const formattedCode = this.formatStockCode(stockCode);
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedCode}?interval=1d&range=${period}`;

      const response = await fetch(this.corsProxy + encodeURIComponent(url));
      if (!response.ok) throw new Error('Failed to fetch historical prices');

      const data = await response.json();
      const result = data.chart.result?.[0] as YahooChartResult | undefined;

      if (!result || !result.timestamp) return [];

      const timestamps = result.timestamp;
      const closes = result.indicators.quote[0]?.close || [];
      const highs = result.indicators.quote[0]?.high || [];

      return timestamps.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i] || 0,
        high: highs[i] || 0,
      })).filter(p => p.close > 0);
    } catch (err) {
      console.error('Error fetching historical prices:', err);
      return [];
    }
  }

  // Calculate high watermark (highest price in given period)
  calculateHighWatermark(prices: { close: number; high: number }[]): number {
    if (prices.length === 0) return 0;
    return Math.max(...prices.map(p => Math.max(p.close, p.high)));
  }

  // Calculate drop from high percentage
  calculateDropFromHigh(currentPrice: number, highPrice: number): number {
    if (highPrice === 0) return 0;
    return ((currentPrice - highPrice) / highPrice) * 100;
  }

  // Check if drop exceeds threshold (default -10%)
  isAlertTriggered(dropPercent: number, threshold: number = -10): boolean {
    return dropPercent <= threshold;
  }

  // 시장 지표 조회 (코스피, 나스닥, 환율, 금)
  async getMarketIndicators(): Promise<MarketIndicator[]> {
    const TROY_OZ_TO_GRAM = 31.1035;

    const symbols: { symbol: string; label: string; unit: string; multiplier: number }[] = [
      { symbol: '^KS11', label: '코스피', unit: '', multiplier: 1 },
      { symbol: '^IXIC', label: '나스닥', unit: '', multiplier: 1 },
      { symbol: 'USDKRW=X', label: 'USD/KRW', unit: '원', multiplier: 1 },
      { symbol: 'JPYKRW=X', label: 'JPY100/KRW', unit: '원', multiplier: 100 },
    ];

    // 금 시세는 별도 처리 (USD/oz → KRW/g 변환 필요)
    const goldSymbol = 'GC=F';

    const rawQuotes = new Map<string, YahooQuote>();

    const allSymbols = [...symbols.map(s => s.symbol), goldSymbol];
    const promises = allSymbols.map(async (symbol) => {
      const quote = await this.getQuote(symbol);
      if (quote) rawQuotes.set(symbol, quote);
    });

    await Promise.all(promises);

    // 기본 지표 계산
    const results: MarketIndicator[] = [];
    for (const { symbol, label, unit, multiplier } of symbols) {
      const quote = rawQuotes.get(symbol);
      if (quote) {
        const price = quote.regularMarketPrice * multiplier;
        const prevClose = quote.regularMarketPreviousClose * multiplier;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        results.push({ symbol, label, unit, price, prevClose, change, changePercent });
      }
    }

    // 금 시세: USD/oz → KRW/g 변환
    const goldQuote = rawQuotes.get(goldSymbol);
    const usdkrwQuote = rawQuotes.get('USDKRW=X');
    if (goldQuote && usdkrwQuote) {
      const usdkrw = usdkrwQuote.regularMarketPrice;
      const usdkrwPrev = usdkrwQuote.regularMarketPreviousClose;

      const goldKrwPerGram = (goldQuote.regularMarketPrice * usdkrw) / TROY_OZ_TO_GRAM;
      const goldKrwPrevClose = (goldQuote.regularMarketPreviousClose * usdkrwPrev) / TROY_OZ_TO_GRAM;
      const goldChange = goldKrwPerGram - goldKrwPrevClose;
      const goldChangePercent = goldKrwPrevClose > 0 ? (goldChange / goldKrwPrevClose) * 100 : 0;

      results.push({
        symbol: 'GOLD_KRW',
        label: '금(KRX)',
        unit: '원/g',
        price: Math.round(goldKrwPerGram),
        prevClose: Math.round(goldKrwPrevClose),
        change: Math.round(goldChange),
        changePercent: goldChangePercent,
      });
    }

    // 표시 순서: 코스피, 나스닥, USD/KRW, JPY100/KRW, 금
    const displayOrder = [...symbols.map(s => s.symbol), 'GOLD_KRW'];
    return displayOrder
      .map(s => results.find(r => r.symbol === s))
      .filter((r): r is MarketIndicator => r !== null && r !== undefined);
  }
}

export const yahooFinanceService = new YahooFinanceService();
