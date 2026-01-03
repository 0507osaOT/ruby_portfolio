// 管理者用カレンダーページ（admin/reservations/calendars.html.erb）用のJavaScript

let calendar;

document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  
  if (!calendarEl) {
    return;
  }
  
  // FullCalendarが読み込まれているか確認
  if (typeof FullCalendar === 'undefined') {
    console.error('FullCalendar is not loaded');
    alert('FullCalendarが読み込まれていません');
    return;
  }
  
  // ユーザーごとに色を割り当てる関数（ハッシュベースで一貫性を保つ）
  const colorPalette = [
    { bg: '#3498db', text: '#ffffff' }, // 青
    { bg: '#e74c3c', text: '#ffffff' }, // 赤
    { bg: '#2ecc71', text: '#ffffff' }, // 緑
    { bg: '#f39c12', text: '#ffffff' }, // オレンジ
    { bg: '#9b59b6', text: '#ffffff' }, // 紫
    { bg: '#1abc9c', text: '#ffffff' }, // ターコイズ
    { bg: '#e67e22', text: '#ffffff' }, // ダークオレンジ
    { bg: '#34495e', text: '#ffffff' }, // ダークグレー
    { bg: '#16a085', text: '#ffffff' }, // ダークターコイズ
    { bg: '#c0392b', text: '#ffffff' }  // ダークレッド
  ];
  
  function getUserColor(userId) {
    if (!userId) {
      return { bg: '#95a5a6', text: '#ffffff' }; // デフォルト色（グレー）
    }
    
    // シンプルなハッシュ関数で一貫した色を生成
    let hash = 0;
    const str = String(userId);
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // 32bit整数に変換
    }
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  }
  
  // カレンダーの初期化
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'ja',
    headerToolbar: false,
    height: 'auto',
    
    events: {
      url: window.calendarEventsUrl,
      method: 'GET',
      failure: function(error) {
        console.error('Failed to load events:', error);
        alert('予約データの読み込みに失敗しました');
      }
    },
    
    eventClick: function(info) {
      showReservationDetails(info.event);
    },
    
    dateClick: function(info) {
    },
    
    // 過去の日付をグレースケール化（イベントは通常表示）
    dayCellDidMount: function(info) {
      // 過去の日付をチェック
      const cellDate = new Date(info.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      cellDate.setHours(0, 0, 0, 0);
      
      const isPastDate = cellDate < today;
      
      // 過去の日付のセル背景をグレースケール化（イベントは通常表示）
      if (isPastDate) {
        // セルの背景色をグレースケール化（イベントには影響しない）
        const dayNumber = info.el.querySelector('.fc-daygrid-day-number');
        if (dayNumber) {
          dayNumber.style.filter = 'grayscale(100%)';
          dayNumber.style.opacity = '0.6';
        }
        // セル全体の背景を少し薄くする（イベントは通常表示）
        info.el.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
        info.el.title = '過去の日付';
      }
    },
    
    eventDidMount: function(info) {
      // 過去の予約も通常通り表示（グレースケール化しない）
      const eventStart = new Date(info.event.start);
      const now = new Date();
      const isPastEvent = eventStart < now;
      
      const userId = info.event.extendedProps.user_id;
      const color = getUserColor(userId);
      
      // 過去の予約の場合は少し透明度を下げる（グレースケールは適用しない）
      if (isPastEvent) {
        info.el.style.opacity = '0.8';
      }
      
      // 背景色とテキスト色を設定
      info.el.style.backgroundColor = color.bg;
      info.el.style.borderColor = color.bg;
      info.el.style.color = color.text;
      info.el.style.fontWeight = 'bold';
      info.el.style.padding = '4px 6px';
      info.el.style.borderRadius = '4px';
      
      // イベントタイトル（名前）のスタイルを改善
      const titleEl = info.el.querySelector('.fc-event-title');
      if (titleEl) {
        titleEl.style.color = color.text;
        titleEl.style.fontWeight = 'bold';
        titleEl.style.fontSize = '13px';
        titleEl.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)';
      }
    }
  });
  
  calendar.render();
  
  // ナビゲーションボタン
  const prevBtn = document.getElementById('prev-btn');
  const todayBtn = document.getElementById('today-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      calendar.prev();
      updateDatePicker();
    });
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', function(e) {
      e.preventDefault();
      calendar.today();
      updateDatePicker();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      calendar.next();
      updateDatePicker();
    });
  }
  
  // 日付ピッカー
  const datePicker = document.getElementById('datePicker');
  if (datePicker) {
    datePicker.addEventListener('change', function() {
      calendar.gotoDate(this.value);
    });
  }
  
  updateDatePicker();
  
  // モーダル
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
  }
  
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('reservationModal');
    if (event.target === modal) {
      closeModal();
    }
  });
});

function updateDatePicker() {
  const datePicker = document.getElementById('datePicker');
  if (!datePicker || !calendar) return;
  
  const currentDate = calendar.getDate();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  datePicker.value = year + '-' + month + '-' + day;
}

function showReservationDetails(event) {
  const modal = document.getElementById('reservationModal');
  const modalBody = document.getElementById('modalBody');
  
  if (!modal || !modalBody) return;
  
  const props = event.extendedProps;
  const statusBadge = getStatusBadge(props.status);
  
  // FullCalendarのイベントオブジェクトから日時を取得
  const startDate = event.start;
  const endDate = event.end;
  
  // 年、月、日、時、分を個別に取得してフォーマット（秒は表示しない）
  const startYear = startDate.getFullYear();
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const startHour = String(startDate.getHours()).padStart(2, '0');
  const startMinute = String(startDate.getMinutes()).padStart(2, '0');
  const startTime = `${startYear}/${startMonth}/${startDay} ${startHour}:${startMinute}`;
  
  let endTime = '';
  if (endDate) {
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endHour = String(endDate.getHours()).padStart(2, '0');
    const endMinute = String(endDate.getMinutes()).padStart(2, '0');
    endTime = `${endYear}/${endMonth}/${endDay} ${endHour}:${endMinute}`;
  }
  
  let html = '<p><strong>お客様名:</strong> ' + (props.customer || 'N/A') + '</p>';
  html += '<p><strong>電話番号:</strong> ' + (props.phone || 'N/A') + '</p>';
  
  if (props.email) {
    html += '<p><strong>メール:</strong> ' + props.email + '</p>';
  }
  
  html += '<p><strong>開始時刻:</strong> ' + startTime + '</p>';
  
  if (endTime) {
    html += '<p><strong>終了時刻:</strong> ' + endTime + '</p>';
  }
  
  html += '<p><strong>ステータス:</strong> ' + statusBadge + '</p>';
  
  if (props.notes) {
    html += '<p><strong>備考:</strong> ' + props.notes + '</p>';
  }
  
  modalBody.innerHTML = html;
  modal.style.display = 'block';
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="badge pending">保留中</span>',
    'confirmed': '<span class="badge confirmed">確定</span>',
    'cancelled': '<span class="badge cancelled">キャンセル</span>'
  };
  return badges[status] || '<span class="badge">' + status + '</span>';
}

function closeModal() {
  const modal = document.getElementById('reservationModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

