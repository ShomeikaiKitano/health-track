import fs from 'fs';
import path from 'path';
import { WebClient } from '@slack/web-api';

// Slackクライアントの初期化
// 注意: 実際のトークンに置き換える必要があります
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || 'general';
const slack = SLACK_TOKEN ? new WebClient(SLACK_TOKEN) : null;

// Slackに通知を送信する関数
const sendSlackNotification = async (entry, username = '匿名ユーザー') => {
  if (!slack) return;
  
  try {
    // 体調ステータスに基づく絵文字の設定
    const statusEmoji = {
      excellent: ':star-struck:',
      good: ':smile:',
      average: ':neutral_face:',
      fair: ':slightly_frowning_face:',
      poor: ':face_with_thermometer:'
    };
    
    const emoji = statusEmoji[entry.status] || ':memo:';
    const rating = entry.rating ? `${entry.rating}/5` : '';
    
    // Slack通知を送信
    await slack.chat.postMessage({
      channel: SLACK_CHANNEL,
      text: `${emoji} *${username}さんの体調報告* ${rating}\n>${entry.comment}`,
      unfurl_links: false
    });
  } catch (error) {
    console.error('Slack通知の送信に失敗しました:', error);
  }
};

// データディレクトリが存在しない場合は作成
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// ユーザー固有のデータファイルを取得
const getUserDataFilePath = (userId) => {
  return path.join(process.cwd(), 'data', `health_${userId}.json`);
};

// データファイルが存在しない場合は作成
const ensureUserDataFile = (userId) => {
  ensureDataDir();
  const userDataFilePath = getUserDataFilePath(userId);
  if (!fs.existsSync(userDataFilePath)) {
    fs.writeFileSync(userDataFilePath, JSON.stringify([]));
  }
  return userDataFilePath;
};

export default function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ユーザーIDの取得 (URLからクエリパラメータとして取得)
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  // GET: データ取得
  if (req.method === 'GET') {
    try {
      const userDataFilePath = ensureUserDataFile(userId);
      const data = fs.readFileSync(userDataFilePath, 'utf8');
      // 空ファイルや無効なJSONの場合は空配列を返す
      try {
        return res.status(200).json(JSON.parse(data));
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError);
        return res.status(200).json([]);
      }
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);
      return res.status(200).json([]);
    }
  }
  
  // ユーザー名をIDから取得する関数
const getUsernameById = (userId) => {
  const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
  
  if (!fs.existsSync(usersFilePath)) {
    return '匿名ユーザー';
  }
  
  try {
    const fileContent = fs.readFileSync(usersFilePath, 'utf8');
    const users = JSON.parse(fileContent);
    const user = users.find(user => user.id === userId);
    return user ? user.username : '匿名ユーザー';
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    return '匿名ユーザー';
  }
};

// POST: 新規データ保存
  if (req.method === 'POST') {
    try {
      const userDataFilePath = ensureUserDataFile(userId);
      
      // リクエストボディからデータを取得
      const newEntry = req.body;
      
      // ユーザーIDを追加（セキュリティのため）
      newEntry.userId = userId;
      
      // 既存のデータを読み込む
      let data = [];
      try {
        const dataStr = fs.readFileSync(userDataFilePath, 'utf8');
        if (dataStr.trim()) {
          data = JSON.parse(dataStr);
        }
      } catch (readError) {
        console.error('ファイル読み込みエラー:', readError);
        // エラーが発生しても続行（空の配列を使用）
      }
      
      // データが配列でない場合は配列にする
      if (!Array.isArray(data)) {
        data = [];
      }
      
      // IDを生成して追加
      newEntry.id = Date.now().toString();
      
      // 新しいデータを追加
      data = [newEntry, ...data];
      
      // データをファイルに書き込む
      fs.writeFileSync(userDataFilePath, JSON.stringify(data));
      
      // ユーザー名を取得してSlack通知を送信
      const username = getUsernameById(userId);
      sendSlackNotification(newEntry, username);
      
      return res.status(200).json({ success: true, entry: newEntry });
    } catch (error) {
      console.error('保存エラー:', error);
      return res.status(500).json({ error: 'データの保存に失敗しました' });
    }
  }
  
  // PUT: データ更新
  if (req.method === 'PUT') {
    try {
      const userDataFilePath = ensureUserDataFile(userId);
      
      // リクエストボディからデータを取得
      let updatedEntry = req.body;
      
      // IDが必要
      if (!updatedEntry.id) {
        return res.status(400).json({ error: 'エントリーIDが必要です' });
      }
      
      // ユーザーIDを確認（セキュリティのため）
      updatedEntry.userId = userId;
      
      // 既存のデータを読み込む
      let data = [];
      try {
        const dataStr = fs.readFileSync(userDataFilePath, 'utf8');
        if (dataStr.trim()) {
          data = JSON.parse(dataStr);
        }
      } catch (readError) {
        console.error('ファイル読み込みエラー:', readError);
        return res.status(500).json({ error: 'データの読み込みに失敗しました' });
      }
      
      // データが配列でない場合はエラー
      if (!Array.isArray(data)) {
        return res.status(500).json({ error: 'データ形式が不正です' });
      }
      
      // リクエストのデバッグ情報
      console.log('Update entry request:', JSON.stringify(updatedEntry, null, 2));
      
      // エントリーのインデックスを検索
      // まずIDで検索し、見つからなければ日付で検索する
      let entryIndex = data.findIndex(entry => entry.id && entry.id === updatedEntry.id);
      
      // IDで見つからない場合は日付で検索
      if (entryIndex === -1) {
        console.log('Entry not found by ID, trying to find by date...');
        entryIndex = data.findIndex(entry => entry.date === updatedEntry.date);
      }
      
      // エントリーが見つからない場合
      if (entryIndex === -1) {
        console.log('Entry not found by date either');
        return res.status(404).json({ error: '更新対象のエントリーが見つかりませんでした' });
      }
      
      // 編集フラグを追加（日本時間で記録）
      updatedEntry.edited = true;
      const now = new Date();
      const jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      updatedEntry.editedAt = jstNow.toISOString();
      
      // エントリーを更新
      data[entryIndex] = updatedEntry;
      
      // データをファイルに書き込む
      fs.writeFileSync(userDataFilePath, JSON.stringify(data));
      
      return res.status(200).json({ success: true, entry: updatedEntry });
    } catch (error) {
      console.error('更新エラー:', error);
      return res.status(500).json({ error: 'データの更新に失敗しました' });
    }
  }
  
  // サポートしていないHTTPメソッド
  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}