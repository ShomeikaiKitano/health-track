import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import HistoryList from '../components/HistoryList';
import HealthChart from '../components/HealthChart';
import HealthCalendar from '../components/HealthCalendar';

export default function Admin() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHealth, setUserHealth] = useState([]);
  const [healthLoading, setHealthLoading] = useState(false);
  const [usersHealth, setUsersHealth] = useState({});
  const [activeTab, setActiveTab] = useState('history');
  const [importCsvFile, setImportCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState('');
  const router = useRouter();
  
  // ログイン状態と管理者権限をチェック
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        router.push('/login');
        return;
      }
      
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // 管理者でない場合はホームページにリダイレクト
      if (!parsedUser.isAdmin) {
        router.push('/');
      }
    };
    
    checkAuth();
  }, [router]);
  
  // ユーザーリストを取得
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || !user.isAdmin) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/users?userId=${user.userId}`);
        if (!response.ok) {
          if (response.status === 403) {
            // 権限がない場合
            setError('この機能にアクセスする権限がありません');
            router.push('/');
            return;
          }
          throw new Error('ユーザーリストの取得に失敗しました');
        }
        
        const data = await response.json();
        setUsers(data);
        
        // ユーザーリスト取得後、各ユーザーの直近の体調データを取得
        const fetchAllUsersHealth = async () => {
          const allHealthData = {};
          
          for (const userItem of data) {
            try {
              const healthResponse = await fetch(`/api/health?userId=${userItem.id}`);
              if (healthResponse.ok) {
                const userHealthData = await healthResponse.json();
                
                // 日付で降順ソート
                const sortedHealth = userHealthData.sort((a, b) => 
                  new Date(b.date) - new Date(a.date)
                );
                
                // 直近3日間のデータだけ取得
                const recentHealth = sortedHealth.slice(0, 3);
                
                allHealthData[userItem.id] = recentHealth;
              }
            } catch (error) {
              console.error(`${userItem.username}の体調データ取得エラー:`, error);
            }
          }
          
          setUsersHealth(allHealthData);
        };
        
        fetchAllUsersHealth();
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('ユーザーリストの取得中にエラーが発生しました');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user, router]);
  
  // 選択されたユーザーの体調データを取得
  useEffect(() => {
    const fetchUserHealth = async () => {
      if (!selectedUser) return;
      
      try {
        setHealthLoading(true);
        const response = await fetch(`/api/health?userId=${selectedUser.id}`);
        if (!response.ok) {
          throw new Error('ユーザーの体調データの取得に失敗しました');
        }
        
        const data = await response.json();
        setUserHealth(data);
        setHealthLoading(false);
      } catch (err) {
        console.error('体調データ取得エラー:', err);
        setError('ユーザーの体調データの取得中にエラーが発生しました');
        setHealthLoading(false);
      }
    };
    
    if (selectedUser) {
      fetchUserHealth();
    }
  }, [selectedUser]);
  
  // ユーザーを選択
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setActiveTab('history');
  };
  
  
  // ユーザーリスト画面に戻る
  const handleBackToList = () => {
    setSelectedUser(null);
    setUserHealth([]);
  };
  
  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };
  
  // ホームに戻る
  const goToHome = () => {
    router.push('/');
  }
  
  // CSVエクスポート処理
  const handleExportCsv = async () => {
    if (!selectedUser) return;
    
    try {
      // CSVファイルをダウンロード
      window.open(`/api/health?userId=${selectedUser.id}&format=csv`, '_blank');
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      setError('データのエクスポート中にエラーが発生しました');
    }
  };
  
  // CSVインポート用のファイル選択ハンドラ
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportCsvFile(e.target.files[0]);
      setImportResult(''); // 結果をリセット
    }
  };
  
  // CSVインポート処理
  const handleImportCsv = async () => {
    if (!selectedUser || !importCsvFile) return;
    
    try {
      setImportLoading(true);
      setImportResult('');
      
      // ファイルを読み込む
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const csvData = event.target.result;
        
        // APIを呼び出してインポート
        const response = await fetch(`/api/health?userId=${selectedUser.id}&action=import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ csvData }),
        });
        
        if (!response.ok) {
          throw new Error('データのインポートに失敗しました');
        }
        
        const result = await response.json();
        setImportResult(`${result.message}`);
        
        // データを再読み込み
        const healthResponse = await fetch(`/api/health?userId=${selectedUser.id}`);
        if (healthResponse.ok) {
          const data = await healthResponse.json();
          setUserHealth(data);
        }
        
        setImportLoading(false);
      };
      
      reader.onerror = () => {
        setError('ファイルの読み込みに失敗しました');
        setImportLoading(false);
      };
      
      reader.readAsText(importCsvFile);
    } catch (error) {
      console.error('CSVインポートエラー:', error);
      setError('データのインポート中にエラーが発生しました');
      setImportLoading(false);
    }
  };
  
  // 体調ステータスに応じたアイコンを返す関数
  const getHealthIcon = (status) => {
    switch (status) {
      case 'excellent': return '🌞';
      case 'good': return '☀️';
      case 'average': return '☁️';
      case 'fair': return '🌥️';
      case 'poor': return '🌧️';
      // 古いデータでも対応できるようにレガシーケースも含む
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      default: return '☀️';
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div className="container">
      <Head>
        <title>Health Track</title>
        <meta name="description" content="体調管理アプリの管理画面" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <h1 className="title">Health Track</h1>
        <div className="userInfo">
          <span>{user.username}さん（管理者）</span>
          <button 
            onClick={goToHome} 
            className="navButton"
          >
            ホームへ
          </button>
          <button 
            onClick={handleLogout} 
            className="logoutButton"
          >
            ログアウト
          </button>
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
        
        
        {selectedUser ? (
          <div className="card">
            <div className="cardHeader">
              <h2>{selectedUser.username}さんの体調データ</h2>
              <div className="cardHeaderActions">
                <div className="dataActions">
                  <button 
                    onClick={handleExportCsv} 
                    className="actionButton exportButton"
                    title="CSVデータをエクスポート"
                  >
                    📥 CSVエクスポート
                  </button>
                  <div className="importContainer">
                    <button 
                      onClick={() => document.getElementById('csvFileInput').click()} 
                      className="actionButton importButton"
                      title="CSVデータをインポート"
                    >
                      📤 CSVインポート
                    </button>
                    <input
                      type="file"
                      id="csvFileInput"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    {importCsvFile && (
                      <div className="importInfo">
                        <span className="fileName">{importCsvFile.name}</span>
                        <button 
                          onClick={handleImportCsv}
                          disabled={importLoading}
                          className="uploadButton"
                        >
                          {importLoading ? 'インポート中...' : 'インポート実行'}
                        </button>
                      </div>
                    )}
                    {importResult && (
                      <div className="importResult">
                        {importResult}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleBackToList} 
                  className="backButton"
                >
                  ← ユーザー一覧に戻る
                </button>
              </div>
            </div>
            
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
              <div 
                className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
              >
                カレンダー
              </div>
            </div>

            {healthLoading ? (
              <p>読み込み中...</p>
            ) : userHealth.length === 0 ? (
              <p>体調データがありません</p>
            ) : (
              activeTab === 'history' ? (
                <HistoryList history={userHealth} />
              ) : activeTab === 'chart' ? (
                <HealthChart history={userHealth} />
              ) : (
                <HealthCalendar history={userHealth} />
              )
            )}
          </div>
        ) : (
          <div className="card">
            <h2>ユーザー一覧</h2>
            
            {loading ? (
              <p>読み込み中...</p>
            ) : (
              <div className="usersList">
                <table>
                  <thead>
                    <tr>
                      <th>ユーザー名</th>
                      <th>権限</th>
                      <th>直近3日の体調</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(userItem => (
                      <tr key={userItem.id}>
                        <td>{userItem.username}</td>
                        <td>{userItem.isAdmin ? '管理者' : '一般'}</td>
                        <td className="healthIcons">
                          {usersHealth[userItem.id] && usersHealth[userItem.id].length > 0 ? (
                            <div className="healthIconsContainer">
                              {usersHealth[userItem.id].map((health, index) => (
                                <div key={index} className="healthIconWrapper" title={`${new Date(health.date).toLocaleDateString('ja-JP')}: ${health.comment || ''}`}>
                                  {getHealthIcon(health.status)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="noData">データなし</span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => handleSelectUser(userItem)} 
                            className="viewButton"
                          >
                            体調データを表示
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        .userInfo {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }
        .navButton,
        .logoutButton {
          margin-left: 1rem;
          background: none;
          border: 1px solid #ddd;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .navButton:hover,
        .logoutButton:hover {
          background: #f5f5f5;
        }
        .cardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .cardHeaderActions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .dataActions {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .actionButton {
          background: none;
          border: 1px solid #ddd;
          padding: 0.4rem 0.6rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .exportButton {
          background-color: #e6f7ff;
          border-color: #91d5ff;
          color: #1890ff;
        }
        .exportButton:hover {
          background-color: #bae7ff;
        }
        .importButton {
          background-color: #f6ffed;
          border-color: #b7eb8f;
          color: #52c41a;
        }
        .importButton:hover {
          background-color: #d9f7be;
        }
        .importContainer {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .importInfo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          padding: 4px 8px;
          background-color: #f9f9f9;
          border-radius: 4px;
          border: 1px dashed #d9d9d9;
        }
        .fileName {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .uploadButton {
          background-color: #52c41a;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .uploadButton:disabled {
          background-color: #d9d9d9;
          cursor: not-allowed;
        }
        .importResult {
          font-size: 0.8rem;
          color: #52c41a;
          padding: 4px 8px;
          background-color: #f6ffed;
          border: 1px solid #b7eb8f;
          border-radius: 4px;
          margin-top: 5px;
        }
        .backButton {
          background: none;
          border: 1px solid #ddd;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
        }
        .backButton:hover {
          background: #f5f5f5;
        }
        .viewButton {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .viewButton:hover {
          background: #bae7ff;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        th {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem;
        }
        .tab {
          padding: 0.5rem 1rem;
          cursor: pointer;
          margin-right: 0.5rem;
          border-bottom: 2px solid transparent;
        }
        .tab.active {
          border-bottom: 2px solid #0070f3;
          color: #0070f3;
          font-weight: bold;
        }
        .tab:hover {
          background: #f9f9f9;
        }
        .healthIcons {
          text-align: center;
        }
        .healthIconsContainer {
          display: flex;
          gap: 8px;
          justify-content: center;
        }
        .healthIconWrapper {
          font-size: 1.2rem;
          cursor: default;
        }
        .noData {
          color: #999;
          font-size: 0.9rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}