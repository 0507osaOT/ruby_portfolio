/* user-reservation-schedule.js - 一般ユーザー用予約スケジュールJavaScript */

(function() {
  'use strict';
  
  console.log('=== User Reservation Schedule Initialization ===');
  console.log('FullCalendar:', typeof FullCalendar);
  
  // ライブラリチェック
  if (typeof FullCalendar === 'undefined') {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.innerHTML = '❌ FullCalendarが読み込まれていません';
    }
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

  document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
      console.error('Calendar element not found');
      return;
    }

    const dateStr = calendarEl.dataset.date;
    const statusEl = document.getElementById('status');
    
    if (statusEl) {
      statusEl.style.display = 'none';
    }
    
    // エラーがある場合はモーダルを開く
    const reservationModal = document.getElementById('reservationModal');
    const errorMessages = document.querySelector('.error-messages');
    if (errorMessages && reservationModal) {
      reservationModal.style.display = 'block';
      // フォームの値を復元
      const startTimeInput = document.getElementById('reservation_start_time');
      const endTimeInput = document.getElementById('reservation_end_time');
      if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
        const start = new Date(startTimeInput.value);
        const end = new Date(endTimeInput.value);
        const timeDisplay = document.getElementById('reservation_time_display');
        if (timeDisplay) {
          const startTimeStr = start.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});
          const endTimeStr = end.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});
          timeDisplay.textContent = startTimeStr + ' - ' + endTimeStr;
        }
      }
    }
    
    console.log('Creating calendar for:', dateStr);

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridDay',
      initialDate: dateStr,
      locale: 'ja',
      timeZone: 'Asia/Tokyo',
      
      headerToolbar: {
        left: '',
        center: 'title',
        right: ''
      },
      
      slotMinTime: '09:00:00',
      slotMaxTime: '18:00:00',
      slotDuration: '01:00:00',
      
      slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      },
      
      height: 'auto',
      selectable: true,
      selectMirror: true,
      editable: false,
      
      // イベントの順序をslot_indexで制御（先に予約した順）
      eventOrder: 'slot_index',
      
      // イベントのタイトルを表示（枠番号なし）
      eventContent: function(arg) {
        const title = arg.event.title || '予約';
        return {
          html: '<div class="fc-event-main-frame">' +
                '<div class="fc-event-title">' + title + '</div>' +
                '</div>'
        };
      },
      
      select: function(info) {
        handleSlotSelection(info, calendar);
      },
      
      events: function(info, successCallback, failureCallback) {
        loadEvents(info, successCallback, failureCallback);
      },
      
      eventClick: function(info) {
        // 一般ユーザーの場合、他のユーザーの予約はクリックできないようにする
        const props = info.event.extendedProps;
        const isOtherUser = props && props.is_other_user === true;
        const eventUserId = props ? props.user_id : null;
        const currentUserIdNum = window.currentUserId ? parseInt(window.currentUserId) : null;
        const eventUserIdNum = eventUserId ? parseInt(eventUserId) : null;
        const isMyReservation = currentUserIdNum && eventUserIdNum && eventUserIdNum === currentUserIdNum;
        
        // 管理者の場合は全ての予約を見れる
        const isAdmin = window.currentUserIsAdmin === true;
        
        // 一般ユーザーで他のユーザーの予約の場合は、モーダルを表示しない
        if (!isAdmin && (isOtherUser || !isMyReservation)) {
          console.log('他のユーザーの予約のため、詳細を表示しません');
          return;
        }
        
        showEventDetails(info.event);
      },
      
      datesSet: function(info) {
        handleDateChange(calendar, dateStr);
      },
      
      eventDidMount: function(info) {
        const slotIndex = info.event.extendedProps ? (info.event.extendedProps.slot_index || 0) : 0;
        info.el.parentElement.setAttribute('data-slot', slotIndex);
        
        // 他のユーザーの予約かどうかを確認
        const isOtherUser = info.event.extendedProps && info.event.extendedProps.is_other_user === true;
        
        // デバッグ用ログ
        if (isOtherUser) {
          console.log('他のユーザーの予約を検出:', info.event.title, info.event.extendedProps);
        }
        
        let bgColor, textColor;
        
        if (isOtherUser) {
          // 他のユーザーの予約は薄いグレー
          bgColor = '#e0e0e0';
          textColor = '#666666';
        } else {
          // 自分の予約はユーザーごとの色（より目立たせる）
          const userId = info.event.extendedProps ? info.event.extendedProps.user_id : null;
          const color = getUserColor(userId);
          bgColor = color.bg;
          textColor = getContrastTextColor(color.bg);
        }
        
        // 時間スロット全体の背景色を設定（先に実行）
        if (isOtherUser) {
          const startTime = info.event.start;
          const endTime = info.event.end;
          
          // カレンダー要素を取得
          const calendarEl = document.getElementById('calendar');
          if (calendarEl) {
            // カレンダー内のすべての時間スロットセルを取得
            const allSlots = calendarEl.querySelectorAll('.fc-timegrid-slot');
            
            allSlots.forEach(function(slot) {
              // 時間スロットのラベルから時間を取得
              const labelEl = slot.querySelector('.fc-timegrid-slot-label');
              if (labelEl) {
                const labelText = labelEl.textContent.trim();
                // "09:00" 形式の時間をパース
                const timeMatch = labelText.match(/(\d{2}):(\d{2})/);
                if (timeMatch) {
                  const slotHour = parseInt(timeMatch[1]);
                  const slotMinute = parseInt(timeMatch[2]);
                  
                  // イベントの開始日時を基準に時間スロットの日時を作成
                  const slotDateTime = new Date(startTime);
                  slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                  
                  // イベントの時間範囲内かチェック
                  if (slotDateTime >= startTime && slotDateTime < endTime) {
                    slot.style.setProperty('background-color', '#e0e0e0', 'important');
                  }
                }
              }
            });
          }
        }
        
        // 背景色とテキスト色を設定
        info.el.style.setProperty('background-color', bgColor, 'important');
        info.el.style.borderColor = isOtherUser ? '#d0d0d0' : bgColor;
        info.el.style.color = textColor;
        info.el.style.fontWeight = 'bold';
        info.el.style.padding = '4px 6px';
        info.el.style.borderRadius = '4px';
        
        // 自身の予約をより目立たせる（ボーダーを太く、影を追加）
        if (!isOtherUser) {
          info.el.style.borderWidth = '2px';
          info.el.style.borderStyle = 'solid';
          info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        } else {
          info.el.style.borderWidth = '1px';
          info.el.style.borderStyle = 'solid';
          info.el.style.boxShadow = 'none';
        }
        
        // fc-event-main-frameのスタイルを改善
        const mainFrameEl = info.el.querySelector('.fc-event-main-frame');
        if (mainFrameEl) {
          mainFrameEl.style.color = textColor;
          mainFrameEl.style.fontWeight = 'bold';
        }
        
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
      }
    });
    
    calendar.render();
    console.log('✅ Calendar rendered');
    
    window.userScheduleCalendar = calendar;
    
    // 日付ピッカー
    setupDatePicker();
  });

  /**
   * タイムスロット選択処理
   */
  function handleSlotSelection(info, calendar) {
    const start = new Date(info.startStr);
    const end = new Date(info.endStr);
    
    // 空き枠を確認
    checkAvailableSlots(start, end, function(available) {
      if (available) {
        openReservationForm(start, end);
      } else {
        alert('この時間帯は既に満員です。別の時間帯を選択してください。');
      }
      calendar.unselect();
    });
  }

  /**
   * 空き枠を確認
   */
  function checkAvailableSlots(start, end, callback) {
    const dateStr = start.toISOString().split('T')[0];
    const url = '/reservations/available_slots?date=' + dateStr;
    
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(slots) {
        // 選択された時間帯が空き枠に含まれているか確認
        const selectedSlot = slots.find(function(slot) {
          return slot.start === start.toISOString() && slot.end === end.toISOString();
        });
        
        if (selectedSlot && selectedSlot.available && selectedSlot.available_count > 0) {
          callback(true);
        } else {
          callback(false);
        }
      })
      .catch(function(error) {
        console.error('Error checking available slots:', error);
        callback(false);
      });
  }

  /**
   * 予約作成フォームを開く
   */
  function openReservationForm(start, end) {
    const startTimeInput = document.getElementById('reservation_start_time');
    const endTimeInput = document.getElementById('reservation_end_time');
    const timeDisplay = document.getElementById('reservation_time_display');
    
    if (startTimeInput && endTimeInput && timeDisplay) {
      startTimeInput.value = start.toISOString();
      endTimeInput.value = end.toISOString();
      
      const startTimeStr = start.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});
      const endTimeStr = end.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'});
      timeDisplay.textContent = startTimeStr + ' - ' + endTimeStr;
      
      document.getElementById('reservationModal').style.display = 'block';
    }
  }

  /**
   * イベント読み込み
   */
  function loadEvents(info, successCallback, failureCallback) {
    const url = '/admin/reservations/calendar?start=' + info.startStr + '&end=' + info.endStr;
    console.log('📅 Fetching events:', url);
    
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(data) {
        console.log('✅ Loaded', data.length, 'events');
        console.log('Events data:', data);
        
        const events = data.map(function(event) {
          // extendedPropsが存在しない場合は初期化
          if (!event.extendedProps) {
            event.extendedProps = {};
          }
          
          // statusが設定されていない場合は'confirmed'を設定
          if (!event.extendedProps.status) {
            event.extendedProps.status = 'confirmed';
          }
          
          event.classNames = ['status-' + event.extendedProps.status];
          
          // slot_indexが設定されていない場合は0を設定
          if (event.extendedProps.slot_index === undefined) {
            event.extendedProps.slot_index = 0;
          }
          
          // eventOrderで使用するため、slot_indexを直接プロパティに設定
          event.slot_index = event.extendedProps.slot_index;
          delete event.resourceId;
          return event;
        });
        
        successCallback(events);
      })
      .catch(function(error) {
        console.error('❌ Error:', error);
        const statusEl = document.getElementById('status');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = '❌ イベントの読み込みに失敗しました: ' + error.message;
        }
        failureCallback(error);
      });
  }

  /**
   * イベント詳細表示
   */
  function showEventDetails(event) {
    // 一般ユーザーの場合、他のユーザーの予約は表示しない（念のため二重チェック）
    const props = event.extendedProps;
    const isOtherUser = props && props.is_other_user === true;
    const eventUserId = props ? props.user_id : null;
    const currentUserIdNum = window.currentUserId ? parseInt(window.currentUserId) : null;
    const eventUserIdNum = eventUserId ? parseInt(eventUserId) : null;
    const isMyReservation = currentUserIdNum && eventUserIdNum && eventUserIdNum === currentUserIdNum;
    
    // 管理者の場合は全ての予約を見れる
    const isAdmin = window.currentUserIsAdmin === true;
    
    // 一般ユーザーで他のユーザーの予約の場合は、モーダルを表示しない
    if (!isAdmin && (isOtherUser || !isMyReservation)) {
      console.log('他のユーザーの予約のため、詳細を表示しません');
      return;
    }
    
    const statusLabels = {
      'confirmed': '確定',
      'pending': '保留中',
      'cancelled': 'キャンセル'
    };
    
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
    
    let html = '<p><strong>お客様名:</strong> ' + escapeHtml(event.title) + '</p>' +
               '<p><strong>開始:</strong> ' + startTime + '</p>' +
               '<p><strong>終了:</strong> ' + endTime + '</p>' +
               '<p><strong>メール:</strong> ' + (props.email ? escapeHtml(props.email) : 'なし') + '</p>' +
               '<p><strong>電話:</strong> ' + (props.phone ? escapeHtml(props.phone) : 'なし') + '</p>' +
               '<p><strong>ステータス:</strong> <span class="badge ' + props.status + '">' + 
               statusLabels[props.status] + '</span></p>';
    
    if (props.notes) {
      html += '<p><strong>備考:</strong> ' + escapeHtml(props.notes) + '</p>';
    }
    
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('reservationModal').style.display = 'block';
  }

  /**
   * 日付変更処理
   */
  function handleDateChange(calendar, originalDateStr) {
    const current = calendar.getDate().toISOString().split('T')[0];
    if (current !== originalDateStr) {
      window.location.href = '/reservations/new?date=' + current;
    }
  }

  /**
   * 日付ピッカー設定
   */
  function setupDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
      datePicker.addEventListener('change', function() {
        window.location.href = '/reservations/new?date=' + this.value;
      });
    }
  }

  /**
   * HTMLエスケープ
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * モーダルを閉じる
   */
  window.closeModal = function() {
    document.getElementById('reservationModal').style.display = 'none';
  };

  /**
   * モーダル外クリックで閉じる
   */
  document.addEventListener('click', function(event) {
    const reservationModal = document.getElementById('reservationModal');
    
    if (event.target === reservationModal) {
      closeModal();
    }
  });
})();

