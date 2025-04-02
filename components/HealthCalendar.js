import React, { useState } from 'react';
import styles from '../styles/HealthCalendar.module.css';

const HealthCalendar = ({ history }) => {
  // 現在表示している年月の状態
  const [currentYearMonth, setCurrentYearMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-indexed to 1-indexed
    return `${year}-${month.toString().padStart(2, '0')}`;
  });

  // 年月を変更する関数
  const changeMonth = (offset) => {
    const [year, month] = currentYearMonth.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1); // 0-indexed month in Date constructor
    date.setMonth(date.getMonth() + offset);
    
    const newYear = date.getFullYear();
    const newMonth = date.getMonth() + 1; // 0-indexed to 1-indexed
    setCurrentYearMonth(`${newYear}-${newMonth.toString().padStart(2, '0')}`);
  };

  // 日付ごとの体調データを取得
  const getHealthDataByDate = () => {
    const healthByDate = {};
    
    history.forEach(item => {
      // itemやdateフィールドの検証
      if (!item || !item.date) {
        console.warn('Invalid history item:', item);
        return;
      }
      
      try {
        // 日付文字列をDate型に変換
        const date = new Date(item.date);
        
        // 無効な日付の場合はスキップ
        if (isNaN(date.getTime())) {
          console.error('Invalid date in history item:', item.date, item);
          return;
        }
        
        // YYYY-MM-DD形式に変換（ISO文字列から日付部分を抽出）
        let dateStr;
        try {
          dateStr = date.toISOString().split('T')[0];
        } catch (err) {
          // ISOStringが失敗した場合の別の方法
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
        
        // すでにその日のデータがあれば、最新のものだけを残す
        if (!healthByDate[dateStr] || new Date(healthByDate[dateStr].date) < date) {
          healthByDate[dateStr] = item;
        }
      } catch (error) {
        console.error('Error processing date in history item:', error, item);
      }
    });
    
    return healthByDate;
  };

  // 体調ステータスに応じたアイコンを返す関数
  const getIcon = (status) => {
    switch (status) {
      case 'excellent': return '🌞';
      case 'good': return '☀️';
      case 'average': return '🌥️';
      case 'fair': return '🌧️';
      case 'poor': return '⛈️';
      // 古いデータでも対応できるようにレガシーケースも含む
      case 'sunny': return '☀️';
      case 'cloudy': return '☁️';
      case 'rainy': return '🌧️';
      default: return '☀️';
    }
  };
  
  // 体調ステータスに応じたラベルを返す関数
  const getLabel = (status) => {
    switch (status) {
      case 'excellent': return '最高';
      case 'good': return '良い';
      case 'average': return '普通';
      case 'fair': return '悪い';
      case 'poor': return '最悪';
      // 古いデータでも対応できるようにレガシーケースも含む
      case 'sunny': return '晴れ';
      case 'cloudy': return '曇り';
      case 'rainy': return '雨';
      default: return '良い';
    }
  };

  // 選択された日付のデータを表示するためのstate
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // マウスオーバー時の処理
  const handleMouseOver = (e, healthData) => {
    if (healthData) {
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY
      });
      setTooltipData(healthData);
    }
  };

  // マウス移動時の処理
  const handleMouseMove = (e, healthData) => {
    if (healthData && tooltipData) {
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  // マウスアウト時の処理
  const handleMouseOut = () => {
    setTooltipData(null);
  };

  // カレンダーのレンダリング
  const renderCalendar = () => {
    const [year, month] = currentYearMonth.split('-').map(num => parseInt(num));
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // 週の始まりを日曜日(0)とする
    const startDayOfWeek = firstDay.getDay();
    
    // 日付ごとの体調データ
    const healthByDate = getHealthDataByDate();
    
    // カレンダーの行を生成
    const calendarRows = [];
    let days = [];
    
    // 前月の日を埋める
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <td key={`empty-start-${i}`} className={styles.emptyDay}>
          <div className={styles.dayContent}>
            <div className={styles.dayNumber}></div>
            <div className={styles.healthIcon}></div>
          </div>
        </td>
      );
    }
    
    // 当月の日を埋める
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const healthData = healthByDate[dateStr];
      
      const today = new Date();
      const isToday = year === today.getFullYear() && 
                      month === today.getMonth() + 1 && 
                      day === today.getDate();
      
      // 曜日に基づいて日付の色を決定するためのインデックス計算
      const dayOfWeekIndex = (startDayOfWeek + day - 1) % 7;
      const isDayOfWeekSunday = dayOfWeekIndex === 0;
      const isDayOfWeekSaturday = dayOfWeekIndex === 6;
      
      days.push(
        <td 
          key={dateStr} 
          className={`${styles.calendarDay} ${healthData ? styles[healthData.status] || '' : ''} ${isToday ? styles.today : ''}`}
          onMouseOver={(e) => handleMouseOver(e, healthData)}
          onMouseMove={(e) => handleMouseMove(e, healthData)}
          onMouseOut={handleMouseOut}
        >
          <div className={styles.dayContent}>
            <div className={`${styles.dayNumber} ${isDayOfWeekSunday ? styles.sundayText : isDayOfWeekSaturday ? styles.saturdayText : ''}`}>
              {day}
            </div>
            <div className={styles.healthIcon}>
              {healthData ? getIcon(healthData.status) : ''}
            </div>
          </div>
        </td>
      );
      
      // 週の終わり、または月の終わりに行を追加
      if ((startDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
        // 月の最後の週に空セルを追加
        if (day === daysInMonth) {
          const remainingCells = 7 - (days.length % 7);
          if (remainingCells < 7) {
            for (let i = 0; i < remainingCells; i++) {
              days.push(
                <td key={`empty-end-${i}`} className={styles.emptyDay}>
                  <div className={styles.dayContent}>
                    <div className={styles.dayNumber}></div>
                    <div className={styles.healthIcon}></div>
                  </div>
                </td>
              );
            }
          }
        }
        
        calendarRows.push(<tr key={`week-${calendarRows.length}`}>{days}</tr>);
        days = [];
      }
    }
    
    return calendarRows;
  };

  // 表示年月のフォーマット関数
  const formatYearMonth = () => {
    const [year, month] = currentYearMonth.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  // 曜日の表示
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 日付のフォーマット関数（YYYY-MM-DD → YYYY年MM月DD日）
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  return (
    <div className={styles.healthCalendar}>
      <div className={styles.calendarHeader}>
        <div className={styles.calendarControls}>
          <button 
            onClick={() => changeMonth(-1)}
            className={styles.monthButton}
            aria-label="前月"
          >
            <span className={styles.buttonIcon}>◀</span>
          </button>
          <h3 className={styles.currentMonth}>{formatYearMonth()}</h3>
          <button 
            onClick={() => changeMonth(1)}
            className={styles.monthButton}
            aria-label="次月"
          >
            <span className={styles.buttonIcon}>▶</span>
          </button>
        </div>
        <div className={styles.calendarLegend}>
          <div className={`${styles.legendItem} ${styles.excellent}`}><span className={styles.legendIconBox}></span><span className={styles.legendIcon}>🌞</span> 最高</div>
          <div className={`${styles.legendItem} ${styles.good}`}><span className={styles.legendIconBox}></span><span className={styles.legendIcon}>☀️</span> 良い</div>
          <div className={`${styles.legendItem} ${styles.average}`}><span className={styles.legendIconBox}></span><span className={styles.legendIcon}>🌥️</span> 普通</div>
          <div className={`${styles.legendItem} ${styles.fair}`}><span className={styles.legendIconBox}></span><span className={styles.legendIcon}>🌧️</span> 悪い</div>
          <div className={`${styles.legendItem} ${styles.poor}`}><span className={styles.legendIconBox}></span><span className={styles.legendIcon}>⛈️</span> 最悪</div>
        </div>
      </div>
      
      <table className={styles.calendarTable}>
        <thead>
          <tr>
            {weekDays.map((day, index) => (
              <th key={day} className={index === 0 ? styles.sunday : index === 6 ? styles.saturday : ''}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderCalendar()}
        </tbody>
      </table>

      {tooltipData && (
        <div className={styles.tooltip} style={{ 
          left: `${tooltipPosition.x}px`, 
          top: `${tooltipPosition.y}px` 
        }}>
          <div className={styles.tooltipDate}>{formatDate(tooltipData.date)}</div>
          <div className={styles.tooltipStatus}>
            {getIcon(tooltipData.status)} {getLabel(tooltipData.status)}
          </div>
          {tooltipData.rating && (
            <div className={styles.tooltipRating}>評価: {tooltipData.rating}/5</div>
          )}
          {tooltipData.comment && (
            <div className={styles.tooltipComment}>{tooltipData.comment}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthCalendar;