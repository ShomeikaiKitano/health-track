/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http';
import usersHandler from '../../../pages/api/users';
import fs from 'fs';
import path from 'path';

// fsモジュールをモック
jest.mock('fs');
jest.mock('path');

describe('/api/users エンドポイント', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // パスのモック
    path.join.mockReturnValue('/mocked/path/to/users.json');
    
    // ファイル存在チェックのモック
    fs.existsSync.mockReturnValue(true);
  });
  
  test('OPTIONS リクエストが正しく処理される', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS',
    });
    
    await usersHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()).toMatchObject({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
  });
  
  test('認証が必要である', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {}, // ユーザーIDなし
    });
    
    await usersHandler(req, res);
    
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: '認証が必要です'
    });
  });
  
  test('管理者権限が必要である', async () => {
    // ユーザーデータ（一般ユーザー）
    const mockUsers = [
      {
        id: 'regular-user-id',
        username: 'regularuser',
        password: 'hashedpassword',
        isAdmin: false
      },
      {
        id: 'admin-id',
        username: 'admin',
        password: 'hashedpassword',
        isAdmin: true
      }
    ];
    
    fs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { userId: 'regular-user-id' }, // 一般ユーザーID
    });
    
    await usersHandler(req, res);
    
    expect(res._getStatusCode()).toBe(403);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'この操作を行うための権限がありません'
    });
  });
  
  test('管理者は全ユーザーリストを取得できる', async () => {
    // ユーザーデータ
    const mockUsers = [
      {
        id: 'user-1',
        username: 'user1',
        password: 'hashedpassword1',
        createdAt: '2025-04-01T00:00:00.000Z',
        isAdmin: false
      },
      {
        id: 'admin-id',
        username: 'admin',
        password: 'hashedpassword2',
        createdAt: '2025-04-01T00:00:00.000Z',
        isAdmin: true
      },
      {
        id: 'user-2',
        username: 'user2',
        password: 'hashedpassword3',
        createdAt: '2025-04-02T00:00:00.000Z'
        // isAdmin プロパティなし
      }
    ];
    
    fs.readFileSync.mockReturnValue(JSON.stringify(mockUsers));
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { userId: 'admin-id' }, // 管理者ID
    });
    
    await usersHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(200);
    
    // パスワードが除外されていることを確認
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveLength(3);
    responseData.forEach(user => {
      expect(user).not.toHaveProperty('password');
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('isAdmin');
    });
    
    // user-2はisAdminプロパティがないが、レスポンスではfalseとして返される
    const user2 = responseData.find(u => u.id === 'user-2');
    expect(user2.isAdmin).toBe(false);
  });
  
  test('ユーザーファイルが存在しない場合は空の配列を返す', async () => {
    // ファイルが存在しないことをモック
    fs.existsSync.mockReturnValue(false);
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { userId: 'admin-id' }, // 管理者ID
    });
    
    await usersHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual([]);
  });
  
  test('ファイル読み込みエラーの場合は500エラーを返す', async () => {
    // ファイル読み込みエラーをモック
    fs.readFileSync.mockImplementation(() => {
      throw new Error('Read file error');
    });
    
    // スパイを作成してconsole.errorをモニタリング
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { req, res } = createMocks({
      method: 'GET',
      query: { userId: 'admin-id' }, // 管理者ID
    });
    
    await usersHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'サーバーエラーが発生しました'
    });
    
    // エラーがログに記録されたことを確認
    expect(consoleSpy).toHaveBeenCalledWith('ユーザーリスト取得エラー:', expect.any(Error));
    
    // スパイをリストア
    consoleSpy.mockRestore();
  });
  
  test('未対応のHTTPメソッドでのリクエストは405エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { userId: 'admin-id' },
    });
    
    await usersHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()).toMatchObject({
      allow: ['GET'],
    });
  });
});