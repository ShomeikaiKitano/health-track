import React from 'react';
import { render, screen } from '@testing-library/react';
import HistoryList from '../../components/HistoryList';

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
  }
];

describe('HistoryList コンポーネント', () => {
  test('履歴リストが正しく表示される', () => {
    render(<HistoryList history={mockHistory} />);
    
    // 月表示が正しいことを確認（padStartで01などにフォーマットされるかも）
    expect(screen.getByText('2025年04月', { exact: false })).toBeInTheDocument();
    
    // コメントが表示されていることを確認
    expect(screen.getByText(/すごく調子がいい日/)).toBeInTheDocument();
    expect(screen.getByText(/良い感じの一日/)).toBeInTheDocument();
    expect(screen.getByText(/普通の日/)).toBeInTheDocument();
    
    // ステータスラベルが表示されていることを確認（クラス属性で絞り込み）
    expect(screen.getAllByText('最高')[0]).toBeInTheDocument();
    expect(screen.getAllByText('良い')[0]).toBeInTheDocument();
    expect(screen.getAllByText('普通')[0]).toBeInTheDocument();
  });
  
  test('空の履歴でも正しく表示される', () => {
    render(<HistoryList history={[]} />);
    
    expect(screen.getByText('この月のデータはありません')).toBeInTheDocument();
  });
  
  test('不正なデータを含んでいても正しく表示される', () => {
    const invalidHistory = [
      ...mockHistory,
      { id: 'invalid1', date: 'invalid-date', status: 'good', rating: 4 },
      { id: 'invalid2' } // 必須フィールドがない
    ];
    
    // エラーが発生しないことを確認
    expect(() => {
      render(<HistoryList history={invalidHistory} />);
    }).not.toThrow();
    
    // 正しいデータは表示されていることを確認
    expect(screen.getByText(/2025年4月1日/)).toBeInTheDocument();
    expect(screen.getByText(/すごく調子がいい日/)).toBeInTheDocument();
  });
});