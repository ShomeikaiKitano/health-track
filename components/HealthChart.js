import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const HealthChart = ({ history }) => {
  // 現在表示している年月の状態
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // 年月だけを取得 (YYYY-MM)
  const getYearMonth = (dateString) => {
    return dateString.split('T')[0].substring(0, 7);
  };
  
  // 日付部分だけを取得 (YYYY-MM-DD)
  const getDateOnly = (dateString) => {
    if (!dateString) return '';
    try {
      // ISO形式の場合はTで分割
      if (dateString.includes('T')) {
        return dateString.split('T')[0];
      }
      // それ以外の場合は有効なDate型に変換してフォーマット
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing date:', error, dateString);
      return '';
    }
  };
  
  // 年月を変更する関数
  const changeMonth = (offset) => {
    const [year, month] = currentYearMonth.split('-').map(num => parseInt(num));
    
    // 日付操作
    let newDate = new Date(Date.UTC(year, month - 1, 1));
    newDate.setUTCMonth(newDate.getUTCMonth() + offset);
    
    const newYear = newDate.getUTCFullYear();
    const newMonth = String(newDate.getUTCMonth() + 1).padStart(2, '0');
    
    setCurrentYearMonth(`${newYear}-${newMonth}`);
  };
  
  // 表示年月のフォーマット関数
  const formatYearMonth = () => {
    const [year, month] = currentYearMonth.split('-');
    return `${year}年${parseInt(month)}月`;
  };
  
  // 時間をフォーマット (HH:MM)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 同じ日付のエントリをグループ化
  const groupedByDate = history.reduce((groups, item) => {
    // itemやdateが不正な形式でないか確認
    if (!item || !item.date) {
      console.warn('Invalid history item:', item);
      return groups;
    }
    
    const dateKey = getDateOnly(item.date);
    if (!dateKey) {
      console.warn('Failed to get date key for item:', item);
      return groups;
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {});

  // データ用の配列を準備
  let processedData = [];
  let dateLabelMap = {};

  // 現在の年月のデータのみをフィルタリング
  const currentYearMonthData = Object.keys(groupedByDate)
    .filter(dateKey => dateKey.startsWith(currentYearMonth))
    .sort(); // 日付順にソート

  // フィルタリングされたデータを処理
  currentYearMonthData.forEach(dateKey => {
    const entries = groupedByDate[dateKey];
    
    // 同じ日付の複数エントリを時間順にソート
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 基本の日付ラベル
    const baseDate = new Date(dateKey);
    const baseLabel = baseDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    
    // 同じ日付の各エントリに対して
    entries.forEach((entry, index) => {
      // 複数エントリがある場合はラベルを区別
      let label = baseLabel;
      if (entries.length > 1) {
        label = `${baseLabel} (${index + 1})`;
      }
      
      // ラベルとデータをマッピング
      dateLabelMap[label] = {
        date: entry.date,
        entryIndex: index + 1,
        totalEntries: entries.length
      };
      
      // 処理済みデータに追加
      processedData.push({
        ...entry,
        label
      });
    });
  });

  // データを日付昇順でソート
  const sortedHistory = processedData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // ラベルを取得
  const labels = sortedHistory.map(item => item.label);

  // ステータスを数値に変換またはratingを使用
  const statusValues = sortedHistory.map(item => {
    // 新しいデータの場合はratingをそのまま使用
    if (item.rating) {
      return item.rating;
    }
    
    // 古いデータの場合はステータスを数値に変換
    switch (item.status) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'average': return 3;
      case 'fair': return 2;
      case 'poor': return 1;
      // レガシーデータ
      case 'sunny': return 4;
      case 'cloudy': return 3;
      case 'rainy': return 1;
      default: return 3;
    }
  });

  // ステータスに応じた背景色を取得
  const pointBackgroundColors = sortedHistory.map(item => {
    // 新しいデータの場合はratingに基づいて色を設定
    if (item.rating) {
      switch (item.rating) {
        case 5: return '#ffcc00'; // 最高
        case 4: return '#f6b93b'; // 良い
        case 3: return '#78909c'; // 普通
        case 2: return '#607d8b'; // まあまあ
        case 1: return '#546e7a'; // 悪い
        default: return '#999';
      }
    }
    
    // 古いデータの場合はステータスに基づいて色を設定
    switch (item.status) {
      case 'excellent': return '#ffcc00';
      case 'good': return '#f6b93b';
      case 'average': return '#78909c';
      case 'fair': return '#607d8b';
      case 'poor': return '#546e7a';
      // レガシーデータ
      case 'sunny': return '#f6b93b';
      case 'cloudy': return '#78909c';
      case 'rainy': return '#546e7a';
      default: return '#999';
    }
  });

  const data = {
    labels,
    datasets: [
      {
        label: '体調',
        data: statusValues,
        borderColor: 'var(--primary)',
        backgroundColor: pointBackgroundColors,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBorderWidth: 2,
        pointBorderColor: 'white',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 6,
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
          borderDash: [5, 5]
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            family: 'Inter'
          },
          color: 'rgba(100, 100, 100, 0.8)',
          padding: 10,
          callback: (value) => {
            switch (value) {
              case 1: return '悪い';
              case 2: return 'まあまあ';
              case 3: return '普通';
              case 4: return '良い';
              case 5: return '最高';
              default: return '';
            }
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(200, 200, 200, 0.1)',
          display: false
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter'
          },
          color: 'rgba(100, 100, 100, 0.8)'
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Health Track - ${formatYearMonth()}`,
        font: {
          size: 18,
          family: 'Inter',
          weight: 'bold'
        },
        color: 'rgba(60, 60, 80, 0.9)',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#555',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 15,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: (context) => {
            // インデックスから元のデータを取得
            const dataIndex = context[0].dataIndex;
            const item = sortedHistory[dataIndex];
            const date = new Date(item.date);
            
            // 日付と時間をフォーマット
            let formattedDate = date.toLocaleDateString('ja-JP', { 
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            });
            
            // 同じ日付の複数エントリがある場合はインデックスと時間も表示
            const label = item.label;
            const info = dateLabelMap[label];
            
            if (info && info.totalEntries > 1) {
              const time = formatTime(item.date);
              return `${formattedDate} (${info.entryIndex}件目 - ${time})`;
            }
            
            return formattedDate;
          },
          label: (context) => {
            const value = context.raw;
            let label = '';
            switch (value) {
              case 5: label = '最高'; break;
              case 4: label = '良い'; break;
              case 3: label = '普通'; break;
              case 2: label = 'まあまあ'; break;
              case 1: label = '悪い'; break;
              default: label = '';
            }
            return `体調: ${label} (${value}/5)`;
          },
          afterLabel: (context) => {
            // インデックスから元のデータを取得
            const dataIndex = context.dataIndex;
            const item = sortedHistory[dataIndex];
            
            let extraInfo = [];
            
            // 記録時間を追加
            const time = formatTime(item.date);
            extraInfo.push(`記録時間: ${time}`);
            
            // キーワードがあれば追加
            if (item.keywords && item.keywords.length > 0) {
              extraInfo.push(`キーワード: ${item.keywords.join(', ')}`);
            }
            
            // 影響要因があれば追加
            if (item.factor) {
              extraInfo.push(`影響要因: ${item.factor}`);
            }
            
            // コメントがあれば追加
            if (item.comment) {
              extraInfo.push(`コメント: 「${item.comment}」`);
            }
            
            return extraInfo.length > 0 ? extraInfo.join('\n') : '';
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        borderColor: 'rgba(74, 107, 253, 0.8)',
        fill: {
          target: 'origin',
          above: 'rgba(74, 107, 253, 0.05)'
        }
      },
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 2,
        borderColor: 'white'
      }
    }
  };

  return (
    <div className="chartContainer">
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
        }}>{formatYearMonth()}</h3>
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
      
      {sortedHistory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '30px 0',
          color: 'var(--text-light)',
          fontStyle: 'italic',
          minHeight: '300px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          この月のデータはありません
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
};

export default HealthChart;