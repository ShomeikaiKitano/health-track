/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http';
import authHandler from '../../../pages/api/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// fsモジュールをモック
jest.mock('fs');
jest.mock('path');
jest.mock('crypto');

describe('/api/auth エンドポイント', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // パスのモック
    path.join.mockReturnValue('/mocked/path/to/users.json');
    
    // ファイル存在チェックのモック
    fs.existsSync.mockReturnValue(true);
    
    // UUIDのモック
    crypto.randomUUID.mockReturnValue('mocked-uuid');
    
    // ハッシュ関数のモック
    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-password'),
    };
    crypto.createHash.mockReturnValue(mockHash);
  });
  
  test('OPTIONS リクエストが正しく処理される', async () => {
    const { req, res } = createMocks({
      method: 'OPTIONS',
    });
    
    await authHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getHeaders()).toMatchObject({
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type',
    });
  });
  
  test('ユーザー登録が成功する', async () => {
    // 空のユーザーファイルをモック
    fs.readFileSync.mockReturnValue('[]');
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'register',
        username: 'newuser',
        password: 'password123',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      userId: 'mocked-uuid',
      username: 'newuser',
    });
    
    // ファイルに書き込まれたことを確認
    expect(fs.writeFileSync).toHaveBeenCalled();
    
    // fs.writeFileSync呼び出しを特定のパラメータで呼ばれたかどうかはチェックしない
    // モック関数の実装によっては順序が異なる可能性がある
    
    // モック関数の呼び出し引数を確認してJSONを抽出
    let parsedData;
    for (const call of fs.writeFileSync.mock.calls) {
      try {
        if (typeof call[1] === 'string') {
          parsedData = JSON.parse(call[1]);
          break;
        }
      } catch (e) {
        // 解析に失敗した場合は次の呼び出しをチェック
        continue;
      }
    }
    
    expect(parsedData).toBeTruthy();
    expect(parsedData).toContainEqual({
      id: 'mocked-uuid',
      username: 'newuser',
      password: 'hashed-password',
      createdAt: expect.any(String),
      isAdmin: false,
    });
  });
  
  test('adminユーザーが登録されると管理者権限が付与される', async () => {
    // 空のユーザーファイルをモック
    fs.readFileSync.mockReturnValue('[]');
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'register',
        username: 'admin',
        password: 'adminpass',
      },
    });
    
    await authHandler(req, res);
    
    // モック関数の呼び出し引数を確認してJSONを抽出
    let parsedData;
    for (const call of fs.writeFileSync.mock.calls) {
      try {
        if (typeof call[1] === 'string') {
          parsedData = JSON.parse(call[1]);
          break;
        }
      } catch (e) {
        // 解析に失敗した場合は次の呼び出しをチェック
        continue;
      }
    }
    
    expect(parsedData).toBeTruthy();
    expect(parsedData).toContainEqual({
      id: 'mocked-uuid',
      username: 'admin',
      password: 'hashed-password',
      createdAt: expect.any(String),
      isAdmin: true, // 管理者権限が付与されている
    });
  });
  
  test('すでに存在するユーザー名での登録は失敗する', async () => {
    // 既存のユーザーをモック
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { username: 'existinguser', password: 'hashedpassword' }
    ]));
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'register',
        username: 'existinguser',
        password: 'password123',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'ユーザー名は既に使用されています',
    });
  });
  
  test('ログインが成功する', async () => {
    // 既存のユーザーをモック
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { 
        id: 'user-id-123', 
        username: 'testuser', 
        password: 'hashed-password',
        isAdmin: false
      }
    ]));
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'login',
        username: 'testuser',
        password: 'password123',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      userId: 'user-id-123',
      username: 'testuser',
      isAdmin: false,
    });
  });
  
  test('管理者ユーザーのログインが成功する', async () => {
    // 管理者ユーザーをモック
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { 
        id: 'admin-id-123', 
        username: 'admin', 
        password: 'hashed-password',
        isAdmin: true
      }
    ]));
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'login',
        username: 'admin',
        password: 'adminpass',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      userId: 'admin-id-123',
      username: 'admin',
      isAdmin: true,
    });
  });
  
  test('誤ったパスワードでのログインは失敗する', async () => {
    // ハッシュ値が異なるようにモック
    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('different-hash'),
    };
    crypto.createHash.mockReturnValue(mockHash);
    
    // 既存のユーザーをモック
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { 
        id: 'user-id-123', 
        username: 'testuser', 
        password: 'hashed-password' 
      }
    ]));
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'login',
        username: 'testuser',
        password: 'wrongpassword',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'ユーザー名またはパスワードが正しくありません',
    });
  });
  
  test('存在しないユーザーでのログインは失敗する', async () => {
    // 既存のユーザーをモック（ログインしようとするユーザーは含まれていない）
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { username: 'otheruser', password: 'hashedpassword' }
    ]));
    
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'login',
        username: 'nonexistentuser',
        password: 'password123',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'ユーザー名またはパスワードが正しくありません',
    });
  });
  
  test('無効なアクションは400エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'invalid-action',
        username: 'testuser',
        password: 'password123',
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: '無効なアクション',
    });
  });
  
  test('ユーザー名とパスワードが必須である', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        action: 'login',
        // username と password が未指定
      },
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      message: 'ユーザー名とパスワードは必須です',
    });
  });
  
  test('未対応のHTTPメソッドでのリクエストは405エラーを返す', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });
    
    await authHandler(req, res);
    
    // レスポンスの検証
    expect(res._getStatusCode()).toBe(405);
    expect(res._getHeaders()).toMatchObject({
      allow: ['POST'],
    });
  });
});