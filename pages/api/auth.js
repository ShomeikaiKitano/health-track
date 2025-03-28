import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// データディレクトリとユーザーファイルの初期化
const ensureUsersFile = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(usersFilePath)) {
    fs.writeFileSync(usersFilePath, JSON.stringify([]));
  }
};

// パスワードのハッシュ化
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// ユーザー登録
const registerUser = (username, password) => {
  ensureUsersFile();
  
  // 既存のユーザーを読み込む
  let users = [];
  try {
    const dataStr = fs.readFileSync(usersFilePath, 'utf8');
    if (dataStr.trim()) {
      users = JSON.parse(dataStr);
    }
  } catch (err) {
    console.error('ユーザーファイル読み込みエラー:', err);
  }
  
  // ユーザー名が既に存在するか確認
  if (users.some(user => user.username === username)) {
    return { success: false, message: 'ユーザー名は既に使用されています' };
  }
  
  // 新しいユーザーを追加（管理者チェック）
  const isAdmin = username === 'admin'; // adminというユーザー名なら管理者権限を付与
  
  const newUser = {
    id: crypto.randomUUID(),
    username,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    isAdmin: isAdmin
  };
  
  users.push(newUser);
  fs.writeFileSync(usersFilePath, JSON.stringify(users));
  
  return { success: true, userId: newUser.id, username: newUser.username };
};

// ユーザーログイン
const loginUser = (username, password) => {
  ensureUsersFile();
  
  // ユーザーを読み込む
  let users = [];
  try {
    const dataStr = fs.readFileSync(usersFilePath, 'utf8');
    if (dataStr.trim()) {
      users = JSON.parse(dataStr);
    }
  } catch (err) {
    console.error('ユーザーファイル読み込みエラー:', err);
    return { success: false, message: 'ログインに失敗しました' };
  }
  
  // ユーザーを検索
  const user = users.find(u => u.username === username && u.password === hashPassword(password));
  
  if (!user) {
    return { success: false, message: 'ユーザー名またはパスワードが正しくありません' };
  }
  
  return { success: true, userId: user.id, username: user.username, isAdmin: user.isAdmin || false };
};

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { action, username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'ユーザー名とパスワードは必須です' });
    }
    
    if (action === 'register') {
      const result = registerUser(username, password);
      return res.status(result.success ? 201 : 400).json(result);
    }
    
    if (action === 'login') {
      const result = loginUser(username, password);
      return res.status(result.success ? 200 : 401).json(result);
    }
    
    return res.status(400).json({ success: false, message: '無効なアクション' });
  }
  
  res.setHeader('Allow', ['POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}