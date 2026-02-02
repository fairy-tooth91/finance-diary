import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: '대시보드', icon: '📊' },
  { path: '/transactions', label: '가계부', icon: '💰' },
  { path: '/stocks', label: '주식매매', icon: '📈' },
  { path: '/portfolio', label: '포트폴리오', icon: '💼' },
  { path: '/settings', label: '설정', icon: '⚙️' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { getDropAlerts } = useFinance();
  const alerts = getDropAlerts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Finance Diary</h1>
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">
                <span>⚠️</span>
                <span>{alerts.length}개 종목 -10% 이상 하락</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  location.pathname === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Personal Finance Manager - 가계부 & 주식 투자 일기
        </div>
      </footer>
    </div>
  );
}
