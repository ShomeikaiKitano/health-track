import React from 'react';

const HistoryList = ({ history, onEdit }) => {
  // スタイル定義
  const styles = {
    historyHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '6px'
    },
    historyIcon: {
      fontSize: '24px',
      marginRight: '12px',
      display: 'flex',
      alignItems: 'center'
    },
    statusLabel: {
      fontWeight: '500',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      backgroundColor: 'rgba(255,255,255,0.5)'
    },
    timeLabel: {
      marginLeft: 'auto',
      fontSize: '0.8rem',
      color: 'var(--text-light)',
      background: 'rgba(0,0,0,0.05)',
      padding: '2px 8px',
      borderRadius: '10px'
    },
    entryNumberBadge: {
      marginLeft: '8px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.1)',
      fontSize: '0.7rem',
      fontWeight: 'bold'
    },
    dateGroup: {
      borderLeft: '3px solid var(--primary-light)',
      paddingLeft: '12px',
      marginBottom: '20px'
    },
    dateGroupHeader: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
      padding: '5px 0'
    },
    dateLabel: {
      fontWeight: '600',
      fontSize: '1rem',
      color: 'var(--text-dark)'
    },
    entriesCount: {
      marginLeft: '10px',
      fontSize: '0.8rem',
      color: 'var(--text-light)',
      background: 'var(--primary-light)',
      padding: '2px 8px',
      borderRadius: '10px'
    },
    historyItem: {
      marginBottom: '15px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      paddingBottom: '15px'
    },
    comment: {
      marginLeft: '36px',
      fontSize: '0.9rem',
      color: 'var(--text-light)',
      fontStyle: 'italic'
    },
    keywords: {
      marginLeft: '36px',
      marginTop: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px'
    },
    keyword: {
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-dark)',
      fontWeight: '500'
    },
    factor: {
      marginLeft: '36px',
      marginTop: '10px',
      fontSize: '0.85rem',
      color: 'var(--text)',
      display: 'flex',
      alignItems: 'center'
    },
    factorLabel: {
      fontWeight: '500',
      marginRight: '6px',
      color: 'var(--secondary)',
      fontSize: '0.8rem'
    }
  };
  const getIcon = (status) => {
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

  const getLabel = (status) => {
    switch (status) {
      case 'excellent': return '最高';
      case 'good': return '良い';
      case 'average': return '普通';
      case 'fair': return 'まあまあ';
      case 'poor': return '悪い';
      // 古いデータでも対応できるようにレガシーケースも含む
      case 'sunny': return '晴れ';
      case 'cloudy': return '曇り';
      case 'rainy': return '雨';
      default: return '良い';
    }
  };

  // 日付のみをフォーマット (yyyy年MM月dd日 曜日)
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'Asia/Tokyo'
    });
  };
  
  // 時間をフォーマット (HH:MM)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
  };
  
  // 日付部分だけを取得 (YYYY-MM-DD)
  const getDateOnly = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Tokyo' };
    const parts = new Intl.DateTimeFormat('fr-CA', options).format(date).split('-');
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  };

  // 現在表示中の年月を状態として持つ（日本時間）
  const [currentYearMonth, setCurrentYearMonth] = React.useState(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en', {
      year: 'numeric', 
      month: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(part => part.type === 'year').value;
    const month = parts.find(part => part.type === 'month').value;
    return `${year}-${month}`;
  });

  // 年月を変更する関数
  const changeMonth = (offset) => {
    const [year, month] = currentYearMonth.split('-').map(num => parseInt(num));
    // タイムゾーンを考慮した日付操作
    const date = new Date(`${year}-${month}-01T00:00:00+09:00`);
    date.setMonth(date.getMonth() + offset);
    
    const formatter = new Intl.DateTimeFormat('en', {
      year: 'numeric', 
      month: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
    const parts = formatter.formatToParts(date);
    const newYear = parts.find(part => part.type === 'year').value;
    const newMonth = parts.find(part => part.type === 'month').value;
    setCurrentYearMonth(`${newYear}-${newMonth}`);
  };

  // 表示年月のフォーマット関数
  const formatYearMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-');
    return `${year}年${month}月`;
  };

  // 日付でデータをグループ化する
  const groupedByDate = history.reduce((groups, item) => {
    const dateKey = getDateOnly(item.date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {});
  
  // 同じ日付内のアイテムを時間順にソート（新しい順）
  Object.keys(groupedByDate).forEach(dateKey => {
    groupedByDate[dateKey].sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // 日付順にソート
  const sortedDates = Object.keys(groupedByDate)
    .filter(dateKey => dateKey.startsWith(currentYearMonth)) // 現在の年月のデータのみをフィルタリング
    .sort((a, b) => new Date(b) - new Date(a));
  
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: '8px'
      }}>
        <button 
          onClick={() => changeMonth(-1)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'var(--primary)'
          }}
        >
          ◀ 前月
        </button>
        <h3 style={{
          margin: 0,
          fontWeight: '600',
          fontSize: '1.1rem'
        }}>{formatYearMonth(currentYearMonth)}</h3>
        <button 
          onClick={() => changeMonth(1)}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '5px 10px',
            borderRadius: '4px',
            color: 'var(--primary)'
          }}
        >
          次月 ▶
        </button>
      </div>
      
      {sortedDates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px 0',
          color: 'var(--text-light)',
          fontStyle: 'italic'
        }}>
          この月のデータはありません
        </div>
      ) : (
        <ul className="historyList">
          {sortedDates.map(dateKey => {
            const entriesForDate = groupedByDate[dateKey];
            const formattedDate = formatDate(entriesForDate[0].date);
            
            return (
              <li key={dateKey} style={styles.dateGroup} className="dateGroup">
                <div style={styles.dateGroupHeader} className="dateGroupHeader">
                  <span style={styles.dateLabel}>{formattedDate}</span>
                  {entriesForDate.length > 1 && (
                    <span style={styles.entriesCount}>
                      {entriesForDate.length}件
                    </span>
                  )}
                </div>
                
                {entriesForDate.map((item, index) => (
                  <div key={index} style={styles.historyItem} className={`historyItem ${item.status}`}>
                    <div style={styles.historyHeader} className="historyHeader">
                      <span style={styles.historyIcon} className="historyIcon">{getIcon(item.status)}</span>
                      <span style={styles.statusLabel} className={`statusLabel ${item.status}`}>{getLabel(item.status)}</span>
                      {entriesForDate.length > 1 && (
                        <span style={styles.entryNumberBadge}>{index + 1}</span>
                      )}
                      <span style={styles.timeLabel}>
                        {formatTime(item.date)}
                        {item.edited && (
                          <span style={{
                            marginLeft: '5px',
                            fontSize: '0.7rem',
                            color: 'var(--secondary)',
                            fontStyle: 'italic'
                          }}>(編集済み)</span>
                        )}
                      </span>
                    </div>
                    
                    {item.comment && (
                      <div style={styles.comment} className="comment">
                        「{item.comment}」
                      </div>
                    )}
                    
                    {item.keywords && item.keywords.length > 0 && (
                      <div style={styles.keywords} className="keywords">
                        {item.keywords.map((keyword, kidx) => (
                          <span key={kidx} style={styles.keyword} className="keyword">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {item.factor && (
                      <div style={styles.factor} className="factor">
                        <span style={styles.factorLabel}>影響要因:</span> {item.factor}
                      </div>
                    )}
                    
                    {/* 編集ボタン */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: '10px',
                      marginRight: '10px'
                    }}>
                      <button 
                        onClick={() => onEdit && onEdit(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>✏️</span>編集
                      </button>
                    </div>
                  </div>
                ))}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default HistoryList;