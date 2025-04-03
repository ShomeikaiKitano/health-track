import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HealthIcon from '../../components/HealthIcon';

describe('HealthIcon コンポーネント', () => {
  const mockOnClick = jest.fn();
  
  test('type に応じた正しいアイコンとラベルが表示される', () => {
    // excellent (デフォルト) ステータスのテスト
    const { rerender } = render(<HealthIcon onClick={mockOnClick} />);
    expect(screen.getByText('🌞')).toBeInTheDocument();
    expect(screen.getByText('最高')).toBeInTheDocument();
    
    // good ステータスのテスト
    rerender(<HealthIcon type="good" onClick={mockOnClick} />);
    expect(screen.getByText('☀️')).toBeInTheDocument();
    expect(screen.getByText('良い')).toBeInTheDocument();
    
    // average ステータスのテスト
    rerender(<HealthIcon type="average" onClick={mockOnClick} />);
    expect(screen.getByText('🌥️')).toBeInTheDocument();
    expect(screen.getByText('普通')).toBeInTheDocument();
    
    // fair ステータスのテスト
    rerender(<HealthIcon type="fair" onClick={mockOnClick} />);
    expect(screen.getByText('🌧️')).toBeInTheDocument();
    expect(screen.getByText('悪い')).toBeInTheDocument();
    
    // poor ステータスのテスト
    rerender(<HealthIcon type="poor" onClick={mockOnClick} />);
    expect(screen.getByText('⛈️')).toBeInTheDocument();
    expect(screen.getByText('最悪')).toBeInTheDocument();
  });
  
  test('クリックイベントが正しく発生する', () => {
    const mockOnClick = jest.fn();
    render(<HealthIcon type="good" onClick={mockOnClick} />);
    
    // アイコンコンテナをクリック（div.statusIconを取得）
    const statusIcon = screen.getByText('☀️').closest('.statusIcon');
    fireEvent.click(statusIcon);
    
    // クリックハンドラが呼ばれること
    expect(mockOnClick).toHaveBeenCalled();
  });
  
  test('active プロパティを渡すと適切なクラスが適用される', () => {
    const { container } = render(<HealthIcon type="good" active={true} onClick={mockOnClick} />);
    
    // activeクラスが適用されていることを確認
    const iconElement = container.querySelector('.statusIcon');
    expect(iconElement.classList).toContain('active');
  });
});