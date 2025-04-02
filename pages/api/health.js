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
  const { userId, format } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'ユーザーIDが必要です' });
  }

  // GET: データ取得
  if (req.method === 'GET') {
    try {
      const userDataFilePath = ensureUserDataFile(userId);
      const data = fs.readFileSync(userDataFilePath, 'utf8');
      let healthData = [];
      
      try {
        healthData = JSON.parse(data);
      } catch (parseError) {
        console.error('JSONパースエラー:', parseError);
        healthData = [];
      }
      
      // CSVフォーマットが要求された場合
      if (format === 'csv') {
        // データを日付順にソート
        healthData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // CSVヘッダー
        const csvHeader = ['日付', '時間', '体調', '評価', 'キーワード', '影響要因', 'コメント', 'ID'];
        
        // CSVデータの行を作成
        const csvRows = healthData.map(entry => {
          const date = new Date(entry.date);
          const dateStr = date.toLocaleDateString('ja-JP'); // YYYY/MM/DD
          const timeStr = date.toLocaleTimeString('ja-JP'); // HH:MM:SS
          
          // 体調ステータスを日本語に変換
          let statusJa = '';
          switch (entry.status) {
            case 'excellent': statusJa = '最高'; break;
            case 'good': statusJa = '良い'; break;
            case 'average': statusJa = '普通'; break;
            case 'fair': statusJa = 'まあまあ'; break;
            case 'poor': statusJa = '悪い'; break;
            // レガシーデータ
            case 'sunny': statusJa = '晴れ'; break;
            case 'cloudy': statusJa = '曇り'; break;
            case 'rainy': statusJa = '雨'; break;
            default: statusJa = ''; break;
          }
          
          // キーワードを文字列に結合
          const keywordsStr = entry.keywords && Array.isArray(entry.keywords) 
            ? entry.keywords.join(', ') 
            : '';
          
          return [
            dateStr,
            timeStr,
            statusJa,
            entry.rating || '',
            keywordsStr,
            entry.factor || '',
            entry.comment || '',
            entry.id || '',
          ].map(field => {
            // CSV内の特殊文字をエスケープ
            // ダブルクォーテーションをダブルクォーテーション2つにエスケープ
            // フィールド内にカンマか改行があればダブルクォーテーションで囲む
            const escaped = String(field).replace(/"/g, '""');
            return (field.includes(',') || field.includes('\n') || field.includes('"')) 
              ? `"${escaped}"` 
              : escaped;
          }).join(',');
        });
        
        // ヘッダーと行を結合
        const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
        
        // CSVファイルとしてレスポンスを設定
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=health_data_${userId}.csv`);
        return res.status(200).send(csvContent);
      }
      
      // 通常のJSON形式の場合
      return res.status(200).json(healthData);
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
  
  // POST with ?action=import - CSV形式のデータをインポート
  if (req.method === 'POST' && req.query.action === 'import') {
    try {
      const userDataFilePath = ensureUserDataFile(userId);
      
      // CSVデータの解析
      const csvData = req.body.csvData;
      if (!csvData) {
        return res.status(400).json({ error: 'CSVデータが必要です' });
      }
      
      // CSVデータの行に分割
      const rows = csvData.split('\n');
      
      // ヘッダー行を取得して処理
      const header = rows[0].split(',');
      
      // データ行を処理
      const importedData = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue; // 空行はスキップ
        
        // CSV行を解析（ダブルクォーテーションの処理を含む）
        const values = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < rows[i].length; j++) {
          const char = rows[i][j];
          
          if (char === '"') {
            // エスケープされたダブルクォーテーションの場合
            if (j + 1 < rows[i].length && rows[i][j + 1] === '"') {
              currentValue += '"';
              j++; // 追加の引用符をスキップ
            } else {
              // 通常のダブルクォーテーション
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // フィールドの区切り
            values.push(currentValue);
            currentValue = '';
          } else {
            // 通常の文字
            currentValue += char;
          }
        }
        
        // 最後の値を追加
        values.push(currentValue);
        
        // 値が少なすぎる場合はスキップ
        if (values.length < 3) continue;
        
        // CSVの列を解析
        const dateStr = values[0]; // 日付
        const timeStr = values[1]; // 時間
        const statusJa = values[2]; // 体調（日本語）
        const rating = values[3] ? parseInt(values[3], 10) : null; // 評価
        const keywordsStr = values[4] || ''; // キーワード（カンマ区切り）
        const factor = values[5] || ''; // 影響要因
        const comment = values[6] || ''; // コメント
        const id = values[7] || Date.now().toString(); // ID
        
        // 日本語の体調ステータスを英語に変換
        let status = '';
        switch (statusJa) {
          case '最高': status = 'excellent'; break;
          case '良い': status = 'good'; break;
          case '普通': status = 'average'; break;
          case 'まあまあ': status = 'fair'; break;
          case '悪い': status = 'poor'; break;
          // レガシーフォーマット
          case '晴れ': status = 'sunny'; break;
          case '曇り': status = 'cloudy'; break;
          case '雨': status = 'rainy'; break;
          default: status = 'average'; break; // デフォルト値
        }
        
        // 日付と時間を結合してISO形式に変換
        const dateObj = new Date(`${dateStr} ${timeStr}`);
        const isoDate = dateObj.toISOString();
        
        // キーワードを配列に変換
        const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
        
        // 新しいエントリを作成
        const newEntry = {
          id,
          date: isoDate,
          status,
          rating: rating || (status === 'excellent' ? 5 : status === 'good' ? 4 : status === 'average' ? 3 : status === 'fair' ? 2 : 1),
          keywords,
          factor,
          comment,
          userId
        };
        
        importedData.push(newEntry);
      }
      
      // 既存のデータを読み込み、マージする
      let existingData = [];
      try {
        const dataStr = fs.readFileSync(userDataFilePath, 'utf8');
        if (dataStr.trim()) {
          existingData = JSON.parse(dataStr);
        }
      } catch (error) {
        console.error('既存データの読み込みエラー:', error);
        existingData = [];
      }
      
      // IDベースでマージ（同じIDのデータは上書き）
      const mergedData = [...existingData];
      const existingIds = new Set(existingData.map(item => item.id));
      
      for (const newItem of importedData) {
        if (existingIds.has(newItem.id)) {
          // 既存データを更新
          const index = mergedData.findIndex(item => item.id === newItem.id);
          if (index !== -1) {
            mergedData[index] = newItem;
          }
        } else {
          // 新しいデータを追加
          mergedData.push(newItem);
        }
      }
      
      // データを保存
      fs.writeFileSync(userDataFilePath, JSON.stringify(mergedData));
      
      return res.status(200).json({ 
        success: true, 
        message: `${importedData.length}件のデータをインポートしました`,
        importedCount: importedData.length 
      });
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      return res.status(500).json({ error: 'データのインポートに失敗しました' });
    }
  }
  
  // サポートしていないHTTPメソッド
  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}