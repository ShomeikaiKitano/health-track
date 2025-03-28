import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 認証チェック
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(401).json({ success: false, message: '認証が必要です' });
  }

  // ユーザーリストを取得
  if (req.method === 'GET') {
    try {
      // ユーザーファイルを読み込む
      if (!fs.existsSync(usersFilePath)) {
        return res.status(200).json([]);
      }

      const fileContent = fs.readFileSync(usersFilePath, 'utf8');
      const users = JSON.parse(fileContent);
      
      // リクエスト元のユーザーが管理者かどうかを確認
      const requestingUser = users.find(user => user.id === userId);
      
      if (!requestingUser || !requestingUser.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'この操作を行うための権限がありません' 
        });
      }
      
      // パスワードを除外したユーザーリストを返す
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
        isAdmin: user.isAdmin || false
      }));
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('ユーザーリスト取得エラー:', error);
      return res.status(500).json({ success: false, message: 'サーバーエラーが発生しました' });
    }
  }

  // 許可されていないメソッド
  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}