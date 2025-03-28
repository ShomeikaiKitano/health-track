import React from 'react';

const HistoryList = ({ history }) => {
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
      weekday: 'long'
    });
  };
  
  // 時間をフォーマット (HH:MM)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 日付部分だけを取得 (YYYY-MM-DD)
  const getDateOnly = (dateString) => {
    return dateString.split('T')[0];
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

  // 日付順にソート
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
  
  return (
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
                  <span style={styles.timeLabel}>{formatTime(item.date)}</span>
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
              </div>
            ))}
          </li>
        );
      })}
    </ul>
  );
};

export default HistoryList;