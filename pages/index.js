import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import HealthIcon from '../components/HealthIcon';
import HistoryList from '../components/HistoryList';
import HealthChart from '../components/HealthChart';

export default function Home() {
  const [currentStatus, setCurrentStatus] = useState('');
  const [showKeywords, setShowKeywords] = useState(false);
  const [showFactors, setShowFactors] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [selectedFactor, setSelectedFactor] = useState('');
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();
  
  // 体調ステータスに応じたキーワードのリスト
  const keywordsByStatus = {
    excellent: ['元気', '活力', '充実', '幸福', '爽快', '達成感', '満足', '楽しい', '安心', '最高'],
    good: ['快適', '穏やか', '良好', '調子良い', '安定', '前向き', '健康的', 'リラックス', '落ち着き', '集中'],
    average: ['普通', '平常', '変わりなし', '無難', '標準', '平均的', '可もなく不可もなく', '特筆なし', '一般的', '無事'],
    fair: ['少し疲れ', '不安', '心配', 'やや調子悪い', '不調気味', '緊張', 'ストレス', '落ち込み', '気分低下', '疲労感'],
    poor: ['疲労', '不調', '体調不良', '痛み', '辛い', '熱っぽい', '気分最悪', '具合悪い', '弱っている', '消耗']
  };
  
  // 影響要因のリスト
  const factorsList = [
    '健康', '睡眠', '食事', '運動', '趣味', '家族', '友達', '恋愛', 'パートナー', '仕事', 
    '勉強', '天気', '今日の出来事', 'お金', '政治', '世界情勢', 'SNS', 'ニュース', 'その他'
  ];
  
  // ログイン状態をチェック
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        router.push('/login');
        return;
      }
      
      setUser(JSON.parse(savedUser));
    };
    
    checkAuth();
  }, [router]);
  
  // サーバーからデータを読み込む
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/health?userId=${user.userId}`);
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();
        setHistory(data);
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
        setLoading(false);
        
        // フォールバック: ローカルストレージから読み込む
        const savedHistory = localStorage.getItem(`healthHistory_${user.userId}`);
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
      }
    };
    
    fetchData();
  }, [user]);

  // バックアップとしてローカルストレージにも保存
  useEffect(() => {
    if (user && history.length > 0) {
      localStorage.setItem(`healthHistory_${user.userId}`, JSON.stringify(history));
    }
  }, [history, user]);

  // 日付の状態を管理
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // コメント状態の管理
  const [comment, setComment] = useState('');

  // 体調のステータスをratingに変換する関数
  const getRatingFromStatus = (status) => {
    switch (status) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'average': return 3;
      case 'fair': return 2;
      case 'poor': return 1;
      // レガシー対応
      case 'sunny': return 4;
      case 'cloudy': return 3;
      case 'rainy': return 1;
      default: return 3;
    }
  };

  // 体調を記録する関数
  const recordHealth = (status) => {
    setCurrentStatus(status);
    setSelectedKeywords([]); // キーワード選択をリセット
    setSelectedFactor(''); // 影響要因選択をリセット
    setShowKeywords(true); // キーワード選択画面を表示
    setShowFactors(false); // 影響要因選択画面を非表示
  };
  
  // キーワードの選択を切り替える関数
  const toggleKeyword = (keyword) => {
    if (selectedKeywords.includes(keyword)) {
      setSelectedKeywords(selectedKeywords.filter(k => k !== keyword));
    } else {
      setSelectedKeywords([...selectedKeywords, keyword]);
    }
  };
  
  // キーワード選択完了時の処理
  const completeKeywordSelection = () => {
    setShowKeywords(false); // キーワード選択画面を閉じる
    setShowFactors(true); // 影響要因選択画面を表示
  };
  
  // 影響要因を選択する関数
  const selectFactor = (factor) => {
    setSelectedFactor(factor);
  };
  
  // キーワード選択画面を再表示する関数
  const reopenKeywordSelection = () => {
    setShowKeywords(true);
    setShowFactors(false);
  };
  
  // 影響要因選択画面を再表示する関数
  const reopenFactorSelection = () => {
    setShowFactors(true);
    setShowKeywords(false);
  };

  // 体調を保存する関数
  const saveHealth = async () => {
    if (!currentStatus || !user) return;
    
    // 現在の日付と時刻を取得
    const now = new Date();
    // 選択された日付と現在の時刻を組み合わせる
    const entryDate = new Date(selectedDate);
    entryDate.setHours(now.getHours());
    entryDate.setMinutes(now.getMinutes());
    entryDate.setSeconds(now.getSeconds());
    
    const newEntry = {
      date: entryDate.toISOString(),
      status: currentStatus,
      comment: comment,
      keywords: selectedKeywords,
      factor: selectedFactor,
      rating: getRatingFromStatus(currentStatus)
    };
    
    try {
      setLoading(true);
      const response = await fetch(`/api/health?userId=${user.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });
      
      if (!response.ok) {
        throw new Error('データの保存に失敗しました');
      }
      
      // UIを更新
      setHistory([newEntry, ...history]);
      setCurrentStatus('');
      setComment('');
      setSelectedKeywords([]);
      setSelectedFactor('');
      setShowKeywords(false);
      setShowFactors(false);
      setLoading(false);
    } catch (err) {
      console.error('保存エラー:', err);
      setError('データの保存中にエラーが発生しました');
      setLoading(false);
      
      // フォールバック: ローカルにのみ保存
      setHistory([newEntry, ...history]);
      setCurrentStatus('');
      setComment('');
      setSelectedKeywords([]);
      setSelectedFactor('');
      setShowKeywords(false);
      setShowFactors(false);
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="container">
      <Head>
        <title>Health Track</title>
        <meta name="description" content="日々の体調を記録し、健康管理をサポートするアプリ" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="header">
        <h1 className="title">Health Track</h1>
        <div className="userInfo">
          <div className="userAvatar">
            <span>{user.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="userDetails">
            <span className="userName">{user.username}さん{user.isAdmin ? ' 👑' : ''}</span>
            <div className="userActions">
              {user.isAdmin && (
                <button 
                  onClick={() => router.push('/admin')} 
                  className="adminButton"
                >
                  <span className="btnIcon">⚙️</span> 管理画面
                </button>
              )}
              <button 
                onClick={handleLogout} 
                className="logoutButton"
              >
                <span className="btnIcon">🚪</span> ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {error && (
          <div style={{ 
            background: '#ffdddd', 
            padding: '0.5rem', 
            borderRadius: '4px', 
            marginBottom: '1rem',
            color: '#cc0000'
          }}>
            {error}
          </div>
        )}
        
        <div className="card">
          <div className="cardDecoration"></div>
          <h2>体調を記録</h2>
          <div className="dateSelector">
            <label htmlFor="date-select">日付：</label>
            <input 
              type="date" 
              id="date-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="dateInput"
            />
          </div>
          <div className="healthStatus">
            <HealthIcon 
              type="excellent"
              active={currentStatus === 'excellent'}
              onClick={recordHealth}
            />
            <HealthIcon 
              type="good"
              active={currentStatus === 'good'}
              onClick={recordHealth}
            />
            <HealthIcon 
              type="average"
              active={currentStatus === 'average'}
              onClick={recordHealth}
            />
            <HealthIcon 
              type="fair"
              active={currentStatus === 'fair'}
              onClick={recordHealth}
            />
            <HealthIcon 
              type="poor"
              active={currentStatus === 'poor'}
              onClick={recordHealth}
            />
          </div>
          
          {showKeywords && currentStatus && (
            <div className="keywordSelector">
              <h3>いまの状態にふさわしいのは？</h3>
              <p className="keywordInstruction">当てはまるものを選んでください（複数選択可）</p>
              <div className="keywordList">
                {keywordsByStatus[currentStatus].map((keyword, index) => (
                  <div 
                    key={index} 
                    className={`keyword ${selectedKeywords.includes(keyword) ? 'selected' : ''}`}
                    onClick={() => toggleKeyword(keyword)}
                  >
                    {keyword}
                  </div>
                ))}
              </div>
              <button 
                className="keywordDoneButton" 
                onClick={completeKeywordSelection}
              >
                選択完了
              </button>
            </div>
          )}
          
          {showFactors && currentStatus && (
            <div className="factorSelector">
              <h3>一番大きく影響することはどれですか？</h3>
              <p className="factorInstruction">あなたの状態に影響している主な要因を選んでください</p>
              <div className="factorList">
                {factorsList.map((factor, index) => (
                  <div 
                    key={index} 
                    className={`factor ${selectedFactor === factor ? 'selected' : ''}`}
                    onClick={() => selectFactor(factor)}
                  >
                    {factor}
                  </div>
                ))}
              </div>
              <button 
                className="factorDoneButton" 
                onClick={() => setShowFactors(false)}
              >
                選択完了
              </button>
            </div>
          )}
          
          <div className="commentContainer">
            <label htmlFor="comment-input">コメント：</label>
            <input
              type="text"
              id="comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="commentInput"
              placeholder="体調に関するコメントを入力"
            />
          </div>
          <div className="selectedSummary">
            {(selectedKeywords.length > 0 || selectedFactor) && (
              <div className="selectedContent">
                <h4>選択内容</h4>
                {selectedKeywords.length > 0 && (
                  <div className="selectedKeywordsPreview">
                    <span className="previewLabel">キーワード:</span>
                    <div className="previewKeywords">
                      {selectedKeywords.map((keyword, index) => (
                        <span key={index} className="previewKeyword">{keyword}</span>
                      ))}
                    </div>
                    <button 
                      className="editButton" 
                      onClick={reopenKeywordSelection}
                      title="キーワードを編集"
                    >
                      ✏️
                    </button>
                  </div>
                )}
                {selectedFactor && (
                  <div className="selectedFactorPreview">
                    <span className="previewLabel">影響要因:</span>
                    <span className="previewFactor">{selectedFactor}</span>
                    <button 
                      className="editButton" 
                      onClick={reopenFactorSelection}
                      title="影響要因を編集"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="buttonContainer">
            <button 
              className="button" 
              onClick={saveHealth}
              disabled={!currentStatus || loading}
            >
              {loading ? '保存中...' : '記録する 📝'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              履歴
            </div>
            <div 
              className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
              onClick={() => setActiveTab('chart')}
            >
              グラフ
            </div>
          </div>

          {activeTab === 'history' ? (
            <HistoryList history={history} />
          ) : (
            <HealthChart history={history} />
          )}
        </div>
      </main>

      <style jsx>{`
        .userInfo {
          display: flex;
          align-items: center;
        }
        .userAvatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-right: 12px;
        }
        .userDetails {
          display: flex;
          flex-direction: column;
        }
        .userName {
          font-weight: 500;
          font-size: 1rem;
          margin-bottom: 4px;
        }
        .userActions {
          display: flex;
          gap: 10px;
        }
        .logoutButton, 
        .adminButton {
          background: none;
          border: none;
          padding: 5px 10px;
          border-radius: 15px;
          cursor: pointer;
          font-size: 0.8rem;
          color: var(--text-light);
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        .btnIcon {
          margin-right: 4px;
          font-size: 0.9rem;
        }
        .logoutButton:hover,
        .adminButton:hover {
          background: rgba(0,0,0,0.05);
          color: var(--text);
        }
        .adminButton {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        .adminButton:hover {
          background-color: var(--primary-light);
          color: var(--primary-dark);
        }
        .cardDecoration {
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, var(--primary-light) 0%, rgba(255,255,255,0) 70%);
          border-radius: 0 var(--border-radius) 0 100%;
          opacity: 0.8;
          z-index: 0;
        }
        .dateSelector {
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .dateInput {
          margin-left: 0.5rem;
          padding: 8px 12px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-family: inherit;
        }
        .keywordSelector, .factorSelector {
          margin-top: 2rem;
          background: rgba(255, 255, 255, 0.8);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 2;
        }
        .keywordSelector h3, .factorSelector h3 {
          margin-top: 0;
          font-weight: 600;
          color: var(--text-dark);
          text-align: center;
        }
        .keywordInstruction, .factorInstruction {
          text-align: center;
          color: var(--text-light);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .keywordList, .factorList {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .keyword, .factor {
          padding: 8px 16px;
          background: #f0f0f0;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        .keyword:hover, .factor:hover {
          background: #e8e8e8;
        }
        .keyword.selected {
          background: var(--primary-light);
          color: var(--primary-dark);
          border-color: var(--primary);
          font-weight: 500;
        }
        .factor.selected {
          background: var(--secondary-light);
          color: var(--secondary-dark);
          border-color: var(--secondary);
          font-weight: 500;
        }
        .keywordDoneButton, .factorDoneButton {
          display: block;
          margin: 0 auto;
          padding: 8px 24px;
          border: none;
          background: var(--primary);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .keywordDoneButton:hover, .factorDoneButton:hover {
          background: var(--primary-dark);
        }
        .factorDoneButton {
          background: var(--secondary);
        }
        .factorDoneButton:hover {
          background: var(--secondary-dark);
        }
        .commentContainer {
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .commentInput {
          width: 100%;
          padding: 12px 15px;
          margin-top: 0.5rem;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          font-family: inherit;
          transition: border 0.3s ease, box-shadow 0.3s ease;
        }
        .commentInput:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .selectedSummary {
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }
        .selectedContent {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          padding: 15px;
        }
        .selectedContent h4 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-dark);
        }
        .selectedKeywordsPreview,
        .selectedFactorPreview {
          margin-bottom: 10px;
          display: flex;
          align-items: flex-start;
        }
        .selectedFactorPreview {
          margin-bottom: 0;
        }
        .previewLabel {
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--text);
          margin-right: 8px;
          min-width: 80px;
        }
        .previewKeywords {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          flex: 1;
        }
        .previewKeyword {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .previewFactor {
          background-color: var(--secondary-light);
          color: var(--secondary-dark);
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .editButton {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
          margin-left: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .editButton:hover {
          background: rgba(0,0,0,0.05);
        }
        .buttonContainer {
          text-align: center;
          margin-top: 2rem;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}