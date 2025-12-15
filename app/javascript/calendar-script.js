console.log('calendar-script.js loaded');

let calendar;

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded');
  
  const calendarEl = document.getElementById('calendar');
  
  if (!calendarEl) {
    console.log('Calendar element not found - not on calendar page');
    return;
  }
  
  console.log('Calendar element found');
  console.log('FullCalendar available:', typeof FullCalendar !== 'undefined');
  console.log('Events URL:', window.calendarEventsUrl);
  
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
      console.log('Event clicked');
      showReservationDetails(info.event);
    },
    
    dateClick: function(info) {
      console.log('Date clicked: ' + info.dateStr);
    }
  });
  
  calendar.render();
  console.log('Calendar rendered successfully');
  
  // ナビゲーションボタン
  const prevBtn = document.getElementById('prev-btn');
  const todayBtn = document.getElementById('today-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Prev clicked');
      calendar.prev();
      updateDatePicker();
    });
    console.log('Prev button listener attached');
  }
  
  if (todayBtn) {
    todayBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Today clicked');
      calendar.today();
      updateDatePicker();
    });
    console.log('Today button listener attached');
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Next clicked');
      calendar.next();
      updateDatePicker();
    });
    console.log('Next button listener attached');
  }
  
  // 日付ピッカー
  const datePicker = document.getElementById('datePicker');
  if (datePicker) {
    datePicker.addEventListener('change', function() {
      console.log('Date picker changed to:', this.value);
      calendar.gotoDate(this.value);
    });
    console.log('Date picker listener attached');
  }
  
  updateDatePicker();
  
  // モーダル
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeModal();
    });
    console.log('Close modal listener attached');
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
  console.log('Date picker updated to:', datePicker.value);
}

function showReservationDetails(event) {
  const modal = document.getElementById('reservationModal');
  const modalBody = document.getElementById('modalBody');
  
  if (!modal || !modalBody) return;
  
  const props = event.extendedProps;
  const statusBadge = getStatusBadge(props.status);
  
  // FullCalendarのイベントオブジェクトから日時を取得
  // timeZone: 'Asia/Tokyo'が設定されているので、既にJSTに変換されている
  // toLocaleStringにtimeZoneを指定すると二重変換になるため、指定しない
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
  
  html += '<hr>';
  html += '<a href="' + window.reservationsPath + '/' + event.id + '" class="btn">詳細を見る</a>';
  
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