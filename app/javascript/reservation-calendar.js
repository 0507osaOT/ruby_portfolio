// 予約カレンダーページ用のJavaScript

let calendar;

// DOMが既に読み込まれている場合は即座に実行、そうでない場合はDOMContentLoadedを待つ
function initCalendar() {
  const calendarEl = document.getElementById('calendar');
  
  if (!calendarEl) {
    console.warn('カレンダー要素が見つかりません');
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
  
  // 背景色の明度を計算して、適切なテキスト色を返す
  function getContrastTextColor(bgColor) {
    // 16進数カラーをRGBに変換
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // 相対的な明度を計算（0-255）
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // 明度が128より低い場合は白、高い場合は黒を返す
    return brightness < 128 ? '#ffffff' : '#000000';
  }
  
  // カレンダーの初期化
  try {
    // 必要な変数が設定されているか確認
    if (!window.calendarEventsUrl) {
      console.error('calendarEventsUrlが設定されていません');
      alert('カレンダーの設定に問題があります。ページを再読み込みしてください。');
      return;
    }
    
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
    
    eventDidMount: function(info) {
      // 過去の予約かどうかをチェック（過去の予約も通常通り表示）
      const eventStart = new Date(info.event.start);
      const now = new Date();
      const isPastEvent = eventStart < now;
      
      // 他のユーザーの予約かどうかを確認
      const isOtherUser = info.event.extendedProps.is_other_user === true;
      const eventUserId = info.event.extendedProps.user_id;
      // user_idの型を統一（数値として比較）
      const currentUserIdNum = window.currentUserId ? parseInt(window.currentUserId) : null;
      const eventUserIdNum = eventUserId ? parseInt(eventUserId) : null;
      const isMyReservation = currentUserIdNum && eventUserIdNum && eventUserIdNum === currentUserIdNum;
      
      let bgColor, textColor;
      
      if (isOtherUser) {
        // 他のユーザーの予約は緑（目立たない色）
        bgColor = '#2ecc71'; // 緑
        textColor = '#ffffff';
      } else if (isMyReservation) {
        // 自身の予約はオレンジ色（文字は白）
        bgColor = '#ff9800'; // オレンジ
        textColor = '#ffffff';
      } else {
        // 自分の予約はユーザーごとの色（より目立たせる）
        const userId = info.event.extendedProps.user_id;
        const color = getUserColor(userId);
        bgColor = color.bg;
        textColor = getContrastTextColor(color.bg);
      }
      
      // 過去の予約の場合は少し透明度を下げる（グレースケールは適用しない）
      if (isPastEvent) {
        info.el.style.opacity = '0.8';
      }
      
      // classNameからstatusクラスを削除してCSSの干渉を防ぐ（先に実行）
      if (isMyReservation || isOtherUser) {
        info.el.classList.remove('status-confirmed', 'status-pending', 'status-cancelled');
      }
      
      // 背景色とテキスト色を設定（!importantで強制適用）
      info.el.style.setProperty('background-color', bgColor, 'important');
      info.el.style.setProperty('border-color', bgColor, 'important');
      info.el.style.setProperty('color', textColor, 'important');
      info.el.style.fontWeight = 'bold';
      
      // 自身の予約をより目立たせる（ボーダーを太く、影を追加）
      if (isMyReservation) {
        info.el.style.borderWidth = '2px';
        info.el.style.borderStyle = 'solid';
        info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      } else {
        info.el.style.borderWidth = '1px';
        info.el.style.borderStyle = 'solid';
        info.el.style.boxShadow = isOtherUser ? 'none' : '0 2px 4px rgba(0,0,0,0.2)';
      }
      info.el.style.padding = '4px 6px';
      info.el.style.borderRadius = '4px';
      
      // イベントタイトル（名前）のスタイルを改善
      const titleEl = info.el.querySelector('.fc-event-title');
      if (titleEl) {
        titleEl.style.color = textColor;
        titleEl.style.fontWeight = 'bold';
        titleEl.style.fontSize = '13px';
        // テキストの視認性を向上させるため、背景色に応じてシャドウを調整
        if (isOtherUser) {
          titleEl.style.textShadow = 'none';
        } else if (textColor === '#ffffff') {
          titleEl.style.textShadow = '0 1px 3px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.3)';
        } else {
          titleEl.style.textShadow = '0 1px 2px rgba(255,255,255,0.5)';
        }
      }
    },
    
    eventClick: function(info) {
      // 一般ユーザーの場合、他のユーザーの予約はクリックできないようにする
      const props = info.event.extendedProps;
      const isOtherUser = props.is_other_user === true;
      const eventUserId = props.user_id;
      const currentUserIdNum = window.currentUserId ? parseInt(window.currentUserId) : null;
      const eventUserIdNum = eventUserId ? parseInt(eventUserId) : null;
      const isMyReservation = currentUserIdNum && eventUserIdNum && eventUserIdNum === currentUserIdNum;
      
      // 管理者の場合は全ての予約を見れる
      const isAdmin = window.currentUserIsAdmin === true;
      
      // 一般ユーザーで他のユーザーの予約の場合は、モーダルを表示しない
      if (!isAdmin && (isOtherUser || !isMyReservation)) {
        return;
      }
      
      showReservationDetails(info.event);
    },
    
    dateClick: function(info) {
    },
    
    // 日付ダブルクリックで予約フォームを開く
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
        info.el.style.cursor = 'not-allowed';
        info.el.title = '過去の日付は予約できません';
      }
      
      let clickTimer = null;
      info.el.addEventListener('click', function(e) {
        if (isPastDate) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        if (clickTimer === null) {
          clickTimer = setTimeout(function() {
            clickTimer = null;
            // シングルクリックの処理（必要に応じて）
          }, 300);
        }
      });
      
      info.el.addEventListener('dblclick', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 過去の日付の場合は予約フォームを開かない
        if (isPastDate) {
          alert('過去の日付は予約できません');
          if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
          }
          return false;
        }
        
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        openReservationForm(info.date);
      });
    }
  });
  
  calendar.render();
  console.log('カレンダーが正常に初期化されました');
  } catch (error) {
    console.error('カレンダーの初期化に失敗しました:', error);
    alert('カレンダーの表示に失敗しました。ページを再読み込みしてください。');
    return;
  }
  
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
  
  // 予約作成モーダルの閉じるボタン
  const closeCreateModalBtn = document.getElementById('close-create-modal');
  const cancelCreateBtn = document.getElementById('cancel-create-btn');
  
  if (closeCreateModalBtn) {
    closeCreateModalBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeCreateModal();
    });
  }
  
  if (cancelCreateBtn) {
    cancelCreateBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeCreateModal();
    });
  }
  
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('reservationModal');
    const createModal = document.getElementById('createReservationModal');
    
    if (event.target === modal) {
      closeModal();
    }
    
    if (event.target === createModal) {
      closeCreateModal();
    }
  });
  
  // エラーメッセージがある場合、予約作成モーダルを自動的に開く
  const errorMessages = document.querySelector('.error-messages');
  const createModal = document.getElementById('createReservationModal');
  if (errorMessages && createModal) {
    createModal.style.display = 'block';
    // フォームの値を復元（window.reservationParamsから）
    if (window.reservationParams && window.reservationParams.start_time) {
      const startTimeInput = document.getElementById('reservation_start_time');
      const endTimeInput = document.getElementById('reservation_end_time');
      const dateDisplay = document.getElementById('reservation_date_display');
      
      // サーバーから送られてきた日時をローカルタイムゾーンで解釈
      const startTime = new Date(window.reservationParams.start_time);
      const endTime = new Date(window.reservationParams.end_time);
      
      const startHourPicker = document.getElementById('start_hour_input');
      const startMinutePicker = document.getElementById('start_minute_input');
      const endHourPicker = document.getElementById('end_hour_input');
      const endMinutePicker = document.getElementById('end_minute_input');
      
      if (startHourPicker && startMinutePicker && endHourPicker && endMinutePicker) {
        // 10分刻みに丸める
        const startHour = startTime.getHours();
        const startMinute = Math.round(startTime.getMinutes() / 10) * 10;
        const endHour = endTime.getHours();
        const endMinute = Math.round(endTime.getMinutes() / 10) * 10;
        
        // select要素に値を設定
        if (startHourPicker.querySelector(`option[value="${startHour}"]`)) {
          startHourPicker.value = String(startHour);
        }
        if (startMinutePicker.querySelector(`option[value="${startMinute}"]`)) {
          startMinutePicker.value = String(startMinute);
        }
        if (endHourPicker.querySelector(`option[value="${endHour}"]`)) {
          endHourPicker.value = String(endHour);
        }
        if (endMinutePicker.querySelector(`option[value="${endMinute}"]`)) {
          endMinutePicker.value = String(endMinute);
        }
      }
      
      if (dateDisplay) {
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0');
        const day = String(startTime.getDate()).padStart(2, '0');
        dateDisplay.textContent = year + '年' + month + '月' + day + '日';
      }
      
      // 日付のhiddenフィールドにも値を設定
      const dateInput = document.getElementById('reservation_date');
      if (dateInput) {
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0');
        const day = String(startTime.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
      }
      
      // updateHiddenTimeFields()を呼び出して、正しい形式でhiddenフィールドを更新
      // これにより、ローカルタイムゾーンの日時が正しく送信される
      setTimeout(function() {
        updateHiddenTimeFields();
      }, 100);
    }
  }
}

// DOMが既に読み込まれている場合は即座に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalendar);
} else {
  // DOMが既に読み込まれている場合は即座に実行
  initCalendar();
}

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
  
  // 一般ユーザーの場合、他のユーザーの予約は表示しない（念のため二重チェック）
  const props = event.extendedProps;
  const isOtherUser = props.is_other_user === true;
  const eventUserId = props.user_id;
  const currentUserIdNum = window.currentUserId ? parseInt(window.currentUserId) : null;
  const eventUserIdNum = eventUserId ? parseInt(eventUserId) : null;
  const isMyReservation = currentUserIdNum && eventUserIdNum && eventUserIdNum === currentUserIdNum;
  
  // 管理者の場合は全ての予約を見れる
  const isAdmin = window.currentUserIsAdmin === true;
  
  // 一般ユーザーで他のユーザーの予約の場合は、モーダルを表示しない
  if (!isAdmin && (isOtherUser || !isMyReservation)) {
    return;
  }
  
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

function openReservationForm(date) {
  // FullCalendarから渡されるdateはDateオブジェクトなので、そのまま使用
  // ただし、タイムゾーンの問題を避けるため、年月日を直接取得
  const selectedDate = new Date(date);
  
  // 年月日をUTCではなくローカルタイムゾーンで取得
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-11
  const day = selectedDate.getDate();
  
  // 日付比較用に新しいDateオブジェクトを作成（時間を00:00:00に設定）
  const selectedDateForCompare = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDateForCompare.setHours(0, 0, 0, 0);
  
  if (selectedDateForCompare < today) {
    alert('過去の日付は予約できません');
    return;
  }
  
  // 選択された日付の9:00-10:00をデフォルトに設定
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  
  // デフォルト時間: 今日の場合は現在時刻以降、明日以降は9:00-10:00
  const now = new Date();
  let defaultStartHour = 9;
  let defaultStartMinute = 0;
  let defaultEndHour = 10;
  let defaultEndMinute = 0;
  
  // 今日の場合は現在時刻以降の最初の10分刻みを設定
  if (selectedDateForCompare.getTime() === today.getTime()) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // 次の10分刻みを計算
    let nextMinute = Math.ceil(currentMinute / 10) * 10;
    if (nextMinute >= 60) {
      nextMinute = 0;
      defaultStartHour = currentHour + 1;
    } else {
      defaultStartHour = currentHour;
    }
    defaultStartMinute = nextMinute;
    
    // 終了時間は開始時間の1時間後
    defaultEndHour = defaultStartHour + 1;
    defaultEndMinute = defaultStartMinute;
    
    // 営業時間外の場合は翌日の9:00-10:00に設定
    if (defaultStartHour >= 18 || (defaultStartHour === 17 && defaultStartMinute > 0)) {
      alert('本日の営業時間（9:00-18:00）を過ぎています。明日以降の日付を選択してください。');
      return;
    }
  }
  
  const startTime = new Date(year, month, day, defaultStartHour, defaultStartMinute, 0);
  const endTime = new Date(year, month, day, defaultEndHour, defaultEndMinute, 0);
  
  const startTimeInput = document.getElementById('reservation_start_time');
  const endTimeInput = document.getElementById('reservation_end_time');
  const startHourPicker = document.getElementById('start_hour_input');
  const startMinutePicker = document.getElementById('start_minute_input');
  const endHourPicker = document.getElementById('end_hour_input');
  const endMinutePicker = document.getElementById('end_minute_input');
  const dateDisplay = document.getElementById('reservation_date_display');
  
  // 必要な要素の存在確認
  if (!startTimeInput || !endTimeInput || !startHourPicker || !startMinutePicker || !endHourPicker || !endMinutePicker) {
    console.error('必要なフォーム要素が見つかりません');
    return;
  }
  
  // dateDisplayが存在しない場合は作成するか、エラーを表示
  if (!dateDisplay) {
    console.error('dateDisplay要素が見つかりません');
    return;
  }
  
  // 日付表示を設定（必ず設定する）
  const dateText = year + '年' + monthStr + '月' + dayStr + '日';
  dateDisplay.textContent = dateText;
  
  // 日付のhiddenフィールドにも値を設定（YYYY-MM-DD形式）
  const dateInput = document.getElementById('reservation_date');
  if (dateInput) {
    dateInput.value = `${year}-${monthStr}-${dayStr}`;
  }
  
  // 時間ピッカーにデフォルト値を設定
  startHourPicker.value = String(defaultStartHour);
  startMinutePicker.value = String(defaultStartMinute);
  endHourPicker.value = String(defaultEndHour);
  endMinutePicker.value = String(defaultEndMinute);
  
  // 過去の時間を選択できないようにする
  const nowForTimeCheck = new Date();
  const isToday = selectedDateForCompare.getTime() === today.getTime();
  
  if (isToday) {
    // 今日の場合は過去の時間を無効化
    Array.from(startHourPicker.options).forEach(function(option) {
      const hour = parseInt(option.value);
      if (hour < nowForTimeCheck.getHours()) {
        option.disabled = true;
      } else if (hour === nowForTimeCheck.getHours()) {
        // 現在時刻と同じ時間の場合、過去の分を無効化
        Array.from(startMinutePicker.options).forEach(function(minOption) {
          const minute = parseInt(minOption.value);
          if (minute < Math.ceil(nowForTimeCheck.getMinutes() / 10) * 10) {
            minOption.disabled = true;
          }
        });
      }
    });
    
    Array.from(endHourPicker.options).forEach(function(option) {
      const hour = parseInt(option.value);
      if (hour < nowForTimeCheck.getHours()) {
        option.disabled = true;
      } else if (hour === nowForTimeCheck.getHours()) {
        Array.from(endMinutePicker.options).forEach(function(minOption) {
          const minute = parseInt(minOption.value);
          if (minute < Math.ceil(nowForTimeCheck.getMinutes() / 10) * 10) {
            minOption.disabled = true;
          }
        });
      }
    });
  }
  
  // hiddenフィールドに初期値を設定
  updateHiddenTimeFields();
  
  // モーダルを開く前に、再度dateDisplayが設定されていることを確認
  if (dateDisplay && !dateDisplay.textContent) {
    dateDisplay.textContent = dateText;
  }
  
  // モーダルを開く
  const createModal = document.getElementById('createReservationModal');
  if (createModal) {
    createModal.style.display = 'block';
    
    // モーダルが開かれた後、再度確認
    setTimeout(function() {
      if (dateDisplay && !dateDisplay.textContent) {
        dateDisplay.textContent = dateText;
      }
      if (dateInput && !dateInput.value) {
        dateInput.value = `${year}-${monthStr}-${dayStr}`;
      }
      updateHiddenTimeFields();
    }, 100);
  }
}

  // 時間ピッカーの変更時にhiddenフィールドを更新
function updateHiddenTimeFields() {
  const startHourPicker = document.getElementById('start_hour_input');
  const startMinutePicker = document.getElementById('start_minute_input');
  const endHourPicker = document.getElementById('end_hour_input');
  const endMinutePicker = document.getElementById('end_minute_input');
  const startTimeInput = document.getElementById('reservation_start_time');
  const endTimeInput = document.getElementById('reservation_end_time');
  const dateDisplay = document.getElementById('reservation_date_display');
  const dateInput = document.getElementById('reservation_date');
  
  if (!startHourPicker || !startMinutePicker || !endHourPicker || !endMinutePicker || !startTimeInput || !endTimeInput) {
    console.error('必要な要素が見つかりません');
    return;
  }
  
  // 日付を取得（優先順位: dateInput > dateDisplay > 現在の日付）
  let year = null, month = null, day = null;
  
  // まず、日付のhiddenフィールドから取得を試みる
  if (dateInput && dateInput.value) {
    const dateMatch = dateInput.value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dateMatch) {
      year = parseInt(dateMatch[1]);
      month = parseInt(dateMatch[2]) - 1; // 月は0から始まる
      day = parseInt(dateMatch[3]);
    }
  }
  
  // dateInputから取得できない場合、dateDisplayから取得を試みる
  if ((year === null || month === null || day === null) && dateDisplay && dateDisplay.textContent) {
    const dateText = dateDisplay.textContent;
    const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    
    if (dateMatch) {
      year = parseInt(dateMatch[1]);
      month = parseInt(dateMatch[2]) - 1; // 月は0から始まる
      day = parseInt(dateMatch[3]);
      
      // dateInputにも値を設定（次回のために）
      if (dateInput) {
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        dateInput.value = `${year}-${monthStr}-${dayStr}`;
      }
    }
  }
  
  // どちらからも取得できない場合は、現在の日付を使用（フォールバック）
  if (year === null || month === null || day === null) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
    day = now.getDate();
    
    // dateInputにも値を設定
    if (dateInput) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      dateInput.value = `${year}-${monthStr}-${dayStr}`;
    }
  }
  
  // 時間と分を取得
  const startHour = parseInt(startHourPicker.value) || 9;
  const startMinute = parseInt(startMinutePicker.value) || 0;
  const endHour = parseInt(endHourPicker.value) || 10;
  const endMinute = parseInt(endMinutePicker.value) || 0;
  
  // Dateオブジェクトを作成（ローカルタイムゾーン）
  const startTime = new Date(year, month, day, startHour, startMinute, 0);
  const endTime = new Date(year, month, day, endHour, endMinute, 0);
  
  // ローカルタイムゾーンの日時を正しく送信する形式に変換
  // YYYY-MM-DDTHH:mm:ss 形式で送信（タイムゾーンオフセットなし、サーバー側でTokyoタイムゾーンとして解釈）
  function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // タイムゾーンオフセットを含めずに送信（サーバー側でTokyoタイムゾーンとして解釈される）
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
  
  const startTimeStr = formatLocalDateTime(startTime);
  const endTimeStr = formatLocalDateTime(endTime);
  startTimeInput.value = startTimeStr;
  endTimeInput.value = endTimeStr;
}

// 時間ピッカーにイベントリスナーを追加
document.addEventListener('DOMContentLoaded', function() {
  const startHourPicker = document.getElementById('start_hour_input');
  const startMinutePicker = document.getElementById('start_minute_input');
  const endHourPicker = document.getElementById('end_hour_input');
  const endMinutePicker = document.getElementById('end_minute_input');
  
  // 時間選択時にhiddenフィールドを更新
  if (startHourPicker) {
    startHourPicker.addEventListener('change', updateHiddenTimeFields);
  }
  if (startMinutePicker) {
    startMinutePicker.addEventListener('change', updateHiddenTimeFields);
  }
  if (endHourPicker) {
    endHourPicker.addEventListener('change', updateHiddenTimeFields);
  }
  if (endMinutePicker) {
    endMinutePicker.addEventListener('change', updateHiddenTimeFields);
  }
  
  // フォーム送信前に最終確認
  const form = document.getElementById('reservationForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      // 日付表示が空でないことを確認
      const dateDisplay = document.getElementById('reservation_date_display');
      const dateInput = document.getElementById('reservation_date');
      
      if (!dateDisplay || !dateDisplay.textContent || dateDisplay.textContent.trim() === '') {
        e.preventDefault();
        alert('予約日が設定されていません。カレンダーから日付を選択してください。');
        return false;
      }
      
      // hiddenフィールドを確実に更新
      updateHiddenTimeFields();
      
      // hiddenフィールドが正しく設定されているか確認
      const startTimeInput = document.getElementById('reservation_start_time');
      const endTimeInput = document.getElementById('reservation_end_time');
      
      if (!startTimeInput || !startTimeInput.value) {
        e.preventDefault();
        alert('開始時間が設定されていません。');
        return false;
      }
      
      if (!endTimeInput || !endTimeInput.value) {
        e.preventDefault();
        alert('終了時間が設定されていません。');
        return false;
      }
      
      // 日付のhiddenフィールドも確認
      if (!dateInput || !dateInput.value) {
        e.preventDefault();
        alert('予約日が設定されていません。');
        return false;
      }
      
      // バリデーション: 共通のバリデーション関数を使用
      if (!window.ReservationValidation.validateReservationForm(
        'reservation_date_display',
        'start_hour_input',
        'start_minute_input',
        'end_hour_input',
        'end_minute_input'
      )) {
        e.preventDefault();
        return false;
      }
    });
  }
});

function closeCreateModal() {
  const modal = document.getElementById('createReservationModal');
  if (modal) {
    modal.style.display = 'none';
    // フォームをリセット
    const form = document.getElementById('reservationForm');
    if (form) {
      form.reset();
    }
  }
}

