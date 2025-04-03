import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import Login from '../../pages/login';

/**
 * @jest-environment jsdom
 */

// モックの設定
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

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

describe('Login ページ', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
  });
  
  test('ページが正しく表示される', () => {
    render(<Login />);
    
    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByLabelText('ユーザー名')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新規登録はこちら' })).toBeInTheDocument();
  });
  
  test('ユーザーがすでにログインしている場合、ホームページにリダイレクトされる', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 'test-user-id', username: 'testuser' }));
    render(<Login />);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
  
  test('新規登録モードに切り替えられる', () => {
    render(<Login />);
    
    // 「新規登録はこちら」をクリック
    fireEvent.click(screen.getByText('新規登録はこちら'));
    
    // モードが新規登録に切り替わる
    expect(screen.getByText('新規登録')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登録' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログインはこちら' })).toBeInTheDocument();
  });
  
  test('ログイン成功時、ユーザー情報が保存されてホームページにリダイレクトされる', async () => {
    // ログイン成功のレスポンスをモック
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ 
        success: true, 
        userId: 'test-user-id', 
        username: 'testuser' 
      }),
    });
    
    render(<Login />);
    
    // ユーザー名とパスワードを入力
    fireEvent.change(screen.getByLabelText('ユーザー名'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'password123' } });
    
    // ログインボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    
    // APIが正しく呼ばれたことを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ action: 'login', username: 'testuser', password: 'password123' }),
        })
      );
    });
    
    // ユーザー情報がlocalStorageに保存されたことを確認
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ userId: 'test-user-id', username: 'testuser', isAdmin: false })
    );
    
    // ホームページにリダイレクトされたことを確認
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });
  
  test('ログイン失敗時、エラーメッセージが表示される', async () => {
    // ログイン失敗のレスポンスをモック
    global.fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ 
        success: false, 
        message: 'ユーザー名またはパスワードが正しくありません' 
      }),
    });
    
    render(<Login />);
    
    // ユーザー名とパスワードを入力
    fireEvent.change(screen.getByLabelText('ユーザー名'), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'wrongpass' } });
    
    // ログインボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('ユーザー名またはパスワードが正しくありません')).toBeInTheDocument();
    });
  });
  
  test('入力検証が機能する', () => {
    render(<Login />);
    
    // 空の入力でログインボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));
    
    // エラーメッセージが表示されることを確認
    expect(screen.getByText('ユーザー名とパスワードを入力してください')).toBeInTheDocument();
  });
});