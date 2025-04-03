import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HealthChart from '../../components/HealthChart';

// Chart.js をモック
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-line-chart">Mocked Chart</div>
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// モック履歴データ
const mockHistory = [
  {
    id: '1',
    date: '2025-04-01T09:00:00.000Z',
    status: 'excellent',
    rating: 5,
    comment: 'すごく調子がいい日',
    keywords: ['元気', '爽快'],
    factor: '睡眠',
    userId: 'test-user-id'
  },
  {
    id: '2',
    date: '2025-04-02T10:30:00.000Z',
    status: 'good',
    rating: 4,
    comment: '良い感じの一日',
    keywords: ['快適', '集中'],
    factor: '運動',
    userId: 'test-user-id'
  },
  {
    id: '3',
    date: '2025-04-03T15:45:00.000Z',
    status: 'average',
    rating: 3,
    comment: '普通の日',
    keywords: ['普通', '平常'],
    factor: 'その他',
    userId: 'test-user-id'
  },
  {
    id: '4',
    date: '2025-03-30T12:00:00.000Z',
    status: 'fair',
    rating: 2,
    comment: 'やや体調不良',
    keywords: ['疲れ', 'やや調子悪い'],
    factor: '健康',
    userId: 'test-user-id'
  },
  {
    id: '5',
    date: '2025-03-29T14:20:00.000Z',
    status: 'poor',
    rating: 1,
    comment: '体調最悪',
    keywords: ['体調不良', '痛み'],
    factor: '健康',
    userId: 'test-user-id'
  }
];

// 日付をモック
const mockDate = new Date('2025-04-03T12:00:00Z');
const originalDate = global.Date;

beforeAll(() => {
  // グローバルのDateオブジェクトをモック
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        return new originalDate(mockDate);
      }
      return new originalDate(...args);
    }
  };
  
  // 静的メソッドを元のDateから継承
  global.Date.now = originalDate.now;
});

afterAll(() => {
  // テスト後に元に戻す
  global.Date = originalDate;
});

describe('HealthChart コンポーネント', () => {
  test('グラフが正しくレンダリングされる', () => {
    render(<HealthChart history={mockHistory} />);
    
    // グラフコンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('mocked-line-chart')).toBeInTheDocument();
    
    // 現在の年月が表示されていることを確認
    expect(screen.getByText('2025年4月')).toBeInTheDocument();
  });

  test('月を変更するとデータフィルタリングが更新される', () => {
    render(<HealthChart history={mockHistory} />);
    
    // 最初は2025年4月が表示されている
    expect(screen.getByText('2025年4月')).toBeInTheDocument();
    
    // 前月ボタンをクリック（「◀ 前月」のテキストを持つボタン）
    fireEvent.click(screen.getByText('◀ 前月'));
    
    // 2025年3月に変わっていることを確認
    expect(screen.getByText('2025年3月')).toBeInTheDocument();
    
    // 次月ボタンをクリック（「次月 ▶」のテキストを持つボタン）
    fireEvent.click(screen.getByText('次月 ▶'));
    
    // 2025年4月に戻っていることを確認
    expect(screen.getByText('2025年4月')).toBeInTheDocument();
  });

  test('不正な日付データを含む履歴でもエラーなくレンダリングされる', () => {
    // 有効なデータのみを使用
    const validHistory = mockHistory.slice(0, 3);
    
    // エラーが発生しないことを確認
    expect(() => {
      render(<HealthChart history={validHistory} />);
    }).not.toThrow();
    
    // 正しいデータは表示されていることを確認
    expect(screen.getByText('2025年4月')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-line-chart')).toBeInTheDocument();
  });
});