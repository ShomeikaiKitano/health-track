import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // ログイン状態をチェック
  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      if (user) {
        router.push('/');
      }
    };
    
    checkAuth();
  }, [router]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username || !password) {
      setErrorMessage('ユーザー名とパスワードを入力してください');
      return;
    }
    
    setLoading(true);
    
    try {
      const action = isLogin ? 'login' : 'register';
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, username, password }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setErrorMessage(data.message || 'エラーが発生しました');
        setLoading(false);
        return;
      }
      
      // ユーザー情報をローカルストレージに保存
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        username: data.username,
        isAdmin: data.isAdmin || false
      }));
      
      // ホームページにリダイレクト
      router.push('/');
    } catch (error) {
      console.error('認証エラー:', error);
      setErrorMessage('認証処理中にエラーが発生しました');
      setLoading(false);
    }
  };
  
  return (
    <div className="container">
      <Head>
        <title>Health Track</title>
        <meta name="description" content="体調管理アプリのログインページ" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <h1 className="title">Health Track</h1>
      </header>

      <main>
        <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h2>{isLogin ? 'ログイン' : '新規登録'}</h2>
          
          {errorMessage && (
            <div style={{ 
              background: '#ffdddd', 
              padding: '0.5rem', 
              borderRadius: '4px', 
              marginBottom: '1rem',
              color: '#cc0000'
            }}>
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>
                ユーザー名
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
                disabled={loading}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
                disabled={loading}
              />
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                type="submit" 
                className="button"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '処理中...' : (isLogin ? 'ログイン' : '登録')}
              </button>
            </div>
          </form>
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="linkButton"
              disabled={loading}
            >
              {isLogin ? '新規登録はこちら' : 'ログインはこちら'}
            </button>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .linkButton {
          background: none;
          border: none;
          color: #0070f3;
          text-decoration: underline;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .linkButton:hover {
          text-decoration: none;
        }
        .linkButton:disabled {
          color: #999;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}