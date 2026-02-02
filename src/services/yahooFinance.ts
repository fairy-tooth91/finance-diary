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
    previousClose: number;
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

      return {
        symbol: formattedCode,
        regularMarketPrice: result.meta.regularMarketPrice,
        regularMarketPreviousClose: result.meta.previousClose,
        fiftyTwoWeekHigh: result.meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: result.meta.fiftyTwoWeekLow,
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
}

export const yahooFinanceService = new YahooFinanceService();
