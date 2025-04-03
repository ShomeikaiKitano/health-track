import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import Home from '../../pages/index';

// モックの設定
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Chart.jsをモック
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-chart">Chart Mocked</div>
}));

// HealthChartコンポーネントをモック
jest.mock('../../components/HealthChart', () => () => (
  <div data-testid="mocked-health-chart">Health Chart Component</div>
));

// HealthCalendarコンポーネントをモック
jest.mock('../../components/HealthCalendar', () => () => (
  <div data-testid="mocked-health-calendar">Health Calendar Component</div>
));

// HistoryListコンポーネントをモック
jest.mock('../../components/HistoryList', () => () => (
  <div data-testid="mocked-history-list">History List Component</div>
));

// localStorageのモック
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// fetchのモック
global.fetch = jest.fn();

describe('Home ページ', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockUser = {
    userId: 'test-user-id',
    username: 'testuser',
    isAdmin: false,
  };
  
  const mockHealthData = [
    {
      id: '1',
      date: '2025-04-01T10:00:00.000Z',
      status: 'good',
      comment: 'テストコメント',
      keywords: ['快適', '集中'],
      factor: '睡眠',
      rating: 4
    },
    {
      id: '2',
      date: '2025-03-31T10:00:00.000Z',
      status: 'average',
      comment: '普通の日',
      keywords: ['普通'],
      factor: '仕事',
      rating: 3
    }
  ];
  
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
    useRouter.mockReturnValue(mockRouter);
    
    // fetchのモック
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockHealthData,
    });
  });
  
  test('ユーザーがログインしていない場合、ログインページにリダイレクトされる', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<Home />);
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
  
  test('ユーザーがログインしている場合、ページが正しく表示される', async () => {
    // モック関数を準備
    const fetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthData)
    });
    global.fetch.mockImplementation(() => fetchPromise);
    
    // actでレンダリング
    render(<Home />);
    
    // 非同期処理の完了を待機
    await waitFor(() => {
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
    });
    
    // 体調記録セクションが表示されていることを確認
    expect(screen.getByText('今日の体調')).toBeInTheDocument();
    
    // 体調記録が表示されていることを確認
    expect(screen.getByText('体調を記録')).toBeInTheDocument();
    
    // fetchが呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith(`/api/health?userId=${mockUser.userId}`);
  });
  
  test('健康データが正しくフェッチされる', async () => {
    // fetchの初期レスポンスを設定
    const fetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthData)
    });
    global.fetch.mockImplementation(() => fetchPromise);
    
    render(<Home />);
    
    // データロードの完了を待機
    await waitFor(() => {
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
    });
    
    // APIが呼ばれたことを確認
    expect(global.fetch).toHaveBeenCalledWith(`/api/health?userId=${mockUser.userId}`);
  });
  
  test('コメント入力欄がレンダリングされる', async () => {
    // fetchの初期レスポンスを設定
    const fetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthData)
    });
    global.fetch.mockImplementation(() => fetchPromise);
    
    render(<Home />);
    
    // データロードの完了を待機
    await waitFor(() => {
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
    });
    
    // コメント入力欄が表示されていることを確認
    expect(screen.getByPlaceholderText('体調に関するコメントを入力')).toBeInTheDocument();
  });
  
  test('タブナビゲーションが存在する', async () => {
    // fetchの初期レスポンスを設定
    const fetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthData)
    });
    global.fetch.mockImplementation(() => fetchPromise);
    
    render(<Home />);
    
    // データロードの完了を待機
    await waitFor(() => {
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
    });
    
    // タブが存在することを確認
    expect(screen.getByText('履歴')).toBeInTheDocument();
    expect(screen.getByText('グラフ')).toBeInTheDocument();
    expect(screen.getByText('カレンダー')).toBeInTheDocument();
  });
  
  test('ログアウトボタンが機能する', async () => {
    // fetchの初期レスポンスを設定
    const fetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthData)
    });
    global.fetch.mockImplementation(() => fetchPromise);
    
    render(<Home />);
    
    // データロードの完了を待機
    await waitFor(() => {
      expect(screen.getByText(/testuser/)).toBeInTheDocument();
    });
    
    // ログアウトボタンをクリック
    fireEvent.click(screen.getByText('ログアウト'));
    
    // localStorageからユーザー情報が削除されたことを確認
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    
    // ログインページにリダイレクトされたことを確認
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});