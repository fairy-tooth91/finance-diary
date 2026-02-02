import type { Transaction, StockTrade, PortfolioHolding, PriceHistory } from '../types';

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

interface GapiClient {
  sheets: {
    spreadsheets: {
      values: {
        get: (params: { spreadsheetId: string; range: string }) => Promise<{ result: { values?: string[][] } }>;
        append: (params: {
          spreadsheetId: string;
          range: string;
          valueInputOption: string;
          resource: { values: (string | number)[][] };
        }) => Promise<unknown>;
        update: (params: {
          spreadsheetId: string;
          range: string;
          valueInputOption: string;
          resource: { values: (string | number)[][] };
        }) => Promise<unknown>;
        batchUpdate: (params: {
          spreadsheetId: string;
          resource: {
            valueInputOption: string;
            data: { range: string; values: (string | number)[][] }[];
          };
        }) => Promise<unknown>;
      };
    };
  };
}

interface TokenClient {
  callback: (response: { error?: string }) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: GapiClient & {
        init: (config: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { error?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let gapiInited = false;
let gisInited = false;
let tokenClient: TokenClient | null = null;

// Sheet names
const SHEETS = {
  TRANSACTIONS: 'Transactions',
  STOCK_TRADES: 'StockTrades',
  PORTFOLIO: 'Portfolio',
  PRICE_HISTORY: 'PriceHistory',
};

export class GoogleSheetsService {
  private spreadsheetId: string = '';
  private apiKey: string = '';
  private clientId: string = '';
  private isInitialized = false;
  private onAuthChange: ((isAuthed: boolean) => void) | null = null;

  setConfig(spreadsheetId: string, apiKey: string, clientId: string) {
    this.spreadsheetId = spreadsheetId;
    this.apiKey = apiKey;
    this.clientId = clientId;
  }

  setAuthChangeCallback(callback: (isAuthed: boolean) => void) {
    this.onAuthChange = callback;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (!this.apiKey || !this.clientId) {
      console.warn('Google Sheets API not configured');
      return false;
    }

    return new Promise((resolve) => {
      // Load GAPI
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.apiKey,
              discoveryDocs: [DISCOVERY_DOC],
            });
            gapiInited = true;
            this.checkReady(resolve);
          } catch (err) {
            console.error('GAPI init error:', err);
            resolve(false);
          }
        });
      };
      document.head.appendChild(gapiScript);

      // Load GIS
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: SCOPES,
          callback: () => {}, // Will be set during auth
        });
        gisInited = true;
        this.checkReady(resolve);
      };
      document.head.appendChild(gisScript);
    });
  }

  private checkReady(resolve: (value: boolean) => void) {
    if (gapiInited && gisInited) {
      this.isInitialized = true;
      resolve(true);
    }
  }

  async authorize(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (!tokenClient) {
        resolve(false);
        return;
      }

      tokenClient.callback = (response) => {
        if (response.error) {
          console.error('Auth error:', response.error);
          this.onAuthChange?.(false);
          resolve(false);
        } else {
          this.onAuthChange?.(true);
          resolve(true);
        }
      };
      tokenClient.requestAccessToken({ prompt: '' });
    });
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.TRANSACTIONS}!A2:F`,
      });

      const rows = response.result.values || [];
      return rows.map((row, index) => ({
        id: `t-${index}`,
        date: row[0] || '',
        type: (row[1] as 'income' | 'expense') || 'expense',
        category: row[2] || '',
        amount: parseFloat(row[3]) || 0,
        memo: row[4] || '',
      }));
    } catch (err) {
      console.error('Error fetching transactions:', err);
      return [];
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<boolean> {
    try {
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.TRANSACTIONS}!A:F`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            transaction.date,
            transaction.type,
            transaction.category,
            transaction.amount,
            transaction.memo,
          ]],
        },
      });
      return true;
    } catch (err) {
      console.error('Error adding transaction:', err);
      return false;
    }
  }

  // Stock trade methods
  async getStockTrades(): Promise<StockTrade[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.STOCK_TRADES}!A2:I`,
      });

      const rows = response.result.values || [];
      return rows.map((row, index) => ({
        id: `st-${index}`,
        date: row[0] || '',
        stockName: row[1] || '',
        stockCode: row[2] || '',
        tradeType: (row[3] as 'buy' | 'sell') || 'buy',
        quantity: parseInt(row[4]) || 0,
        price: parseFloat(row[5]) || 0,
        total: parseFloat(row[6]) || 0,
        memo: row[7] || '',
      }));
    } catch (err) {
      console.error('Error fetching stock trades:', err);
      return [];
    }
  }

  async addStockTrade(trade: Omit<StockTrade, 'id'>): Promise<boolean> {
    try {
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.STOCK_TRADES}!A:I`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            trade.date,
            trade.stockName,
            trade.stockCode,
            trade.tradeType,
            trade.quantity,
            trade.price,
            trade.total,
            trade.memo,
          ]],
        },
      });
      return true;
    } catch (err) {
      console.error('Error adding stock trade:', err);
      return false;
    }
  }

  // Portfolio methods
  async getPortfolio(): Promise<PortfolioHolding[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.PORTFOLIO}!A2:H`,
      });

      const rows = response.result.values || [];
      return rows.map((row) => ({
        stockName: row[0] || '',
        stockCode: row[1] || '',
        quantity: parseInt(row[2]) || 0,
        avgPrice: parseFloat(row[3]) || 0,
        currentPrice: parseFloat(row[4]) || 0,
        highPrice: parseFloat(row[5]) || 0,
        dropFromHigh: parseFloat(row[6]) || 0,
        profitRate: parseFloat(row[7]) || 0,
      }));
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      return [];
    }
  }

  async updatePortfolio(holdings: PortfolioHolding[]): Promise<boolean> {
    try {
      const values = holdings.map((h) => [
        h.stockName,
        h.stockCode,
        h.quantity,
        h.avgPrice,
        h.currentPrice,
        h.highPrice,
        h.dropFromHigh,
        h.profitRate,
      ]);

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.PORTFOLIO}!A2:H${values.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });
      return true;
    } catch (err) {
      console.error('Error updating portfolio:', err);
      return false;
    }
  }

  // Price history methods
  async getPriceHistory(stockCode?: string): Promise<PriceHistory[]> {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.PRICE_HISTORY}!A2:C`,
      });

      const rows = response.result.values || [];
      let history = rows.map((row) => ({
        date: row[0] || '',
        stockCode: row[1] || '',
        closePrice: parseFloat(row[2]) || 0,
      }));

      if (stockCode) {
        history = history.filter((h) => h.stockCode === stockCode);
      }

      return history;
    } catch (err) {
      console.error('Error fetching price history:', err);
      return [];
    }
  }

  async addPriceHistory(entries: Omit<PriceHistory, 'id'>[]): Promise<boolean> {
    try {
      const values = entries.map((e) => [e.date, e.stockCode, e.closePrice]);

      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEETS.PRICE_HISTORY}!A:C`,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });
      return true;
    } catch (err) {
      console.error('Error adding price history:', err);
      return false;
    }
  }
}

export const sheetsService = new GoogleSheetsService();
