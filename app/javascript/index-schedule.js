/* index-schedule.js - 単日スケジュール用JavaScript */

(function() {
  'use strict';
  
  console.log('=== FullCalendar Initialization ===');
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
        // 過去の時間スロットを選択できないようにする
        const now = new Date();
        const selectedStart = new Date(info.startStr);
        
        if (selectedStart < now) {
          alert('過去の時間は予約できません');
          calendar.unselect();
          return;
        }
        
        handleSlotSelection(info, calendar);
      },
      
      events: function(info, successCallback, failureCallback) {
        loadEvents(info, successCallback, failureCallback);
      },
      
      eventClick: function(info) {
        // 一般ユーザーの場合、他のユーザーの予約はクリックできないようにする
        const props = info.event.extendedProps;
        const isOtherUser = props && (
          props.is_other_user === true || 
          props.is_other_user === 'true'
        );
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
      
      // 過去の時間を選択できないようにする
      selectConstraint: function(info) {
        const now = new Date();
        const start = new Date(info.startStr);
        return start >= now;
      },
      
      // 過去の時間スロットをグレースケール化
      slotLabelDidMount: function(info) {
        const slotTime = new Date(info.date);
        const now = new Date();
        
        if (slotTime < now) {
          // ラベルをグレースケール化
          info.el.style.filter = 'grayscale(100%)';
          info.el.style.opacity = '0.5';
          
          // 対応するスロット全体もグレースケール化
          const slotLane = info.el.closest('.fc-timegrid-slot-lane');
          if (slotLane) {
            slotLane.style.filter = 'grayscale(100%)';
            slotLane.style.opacity = '0.5';
            slotLane.style.pointerEvents = 'none';
            slotLane.style.cursor = 'not-allowed';
          }
          
          // スロットセルもグレースケール化
          const slot = info.el.closest('.fc-timegrid-slot');
          if (slot) {
            slot.style.filter = 'grayscale(100%)';
            slot.style.opacity = '0.5';
            slot.style.pointerEvents = 'none';
            slot.style.cursor = 'not-allowed';
          }
        }
      },
      
      eventDidMount: function(info) {
        const slotIndex = info.event.extendedProps ? (info.event.extendedProps.slot_index || 0) : 0;
        info.el.parentElement.setAttribute('data-slot', slotIndex);
        
        // 過去の予約かどうかをチェック（過去の予約も通常通り表示）
        const eventStart = new Date(info.event.start);
        const now = new Date();
        const isPastEvent = eventStart < now;
        
        // 他のユーザーの予約かどうかを確認
        const isOtherUser = info.event.extendedProps && (
          info.event.extendedProps.is_other_user === true || 
          info.event.extendedProps.is_other_user === 'true'
        );
        
        // 自身の予約かどうかを確認
        const eventUserId = info.event.extendedProps ? info.event.extendedProps.user_id : null;
        const isMyReservation = window.currentUserId && eventUserId && eventUserId === window.currentUserId;
        
        // デバッグ用ログ（すべてのイベントで出力）
        console.log('eventDidMount 呼び出し:', {
          title: info.event.title,
          is_other_user: info.event.extendedProps ? info.event.extendedProps.is_other_user : 'undefined',
          user_id: eventUserId,
          current_user_id: window.currentUserId,
          is_my_reservation: isMyReservation,
          is_past_event: isPastEvent,
          extendedProps: info.event.extendedProps
        });
        
        let bgColor, textColor;
        
        if (isOtherUser) {
          // 他のユーザーの予約は薄いグレー
          bgColor = '#e0e0e0';
          textColor = '#666666';
          console.log('他のユーザーの予約として処理:', info.event.title);
        } else if (isMyReservation) {
          // 自身の予約はオレンジ色
          bgColor = '#ff9800'; // オレンジ
          textColor = '#ffffff';
          console.log('自身の予約として処理（オレンジ）:', info.event.title);
        } else {
          // 自分の予約はユーザーごとの色（より目立たせる）
          const userId = info.event.extendedProps ? info.event.extendedProps.user_id : null;
          const color = getUserColor(userId);
          bgColor = color.bg;
          textColor = getContrastTextColor(color.bg);
        }
        
        // 過去の予約の場合は少し透明度を下げる（グレースケールは適用しない）
        if (isPastEvent) {
          info.el.style.opacity = '0.8';
        }
        
        // 時間スロット全体の背景色を設定（先に実行）
        if (isOtherUser || isMyReservation) {
          const startTime = info.event.start;
          const endTime = info.event.end;
          
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
                  if (isMyReservation) {
                    // 自身の予約の場合はオレンジ色
                    slot.style.setProperty('background-color', '#ff9800', 'important');
                  } else {
                    // 他のユーザーの予約の場合は薄いグレー
                    slot.style.setProperty('background-color', '#e0e0e0', 'important');
                  }
                }
              }
            }
          });
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
    
    window.scheduleCalendar = calendar;
    
    // 日付ピッカー
    setupDatePicker();
  });

  /**
   * タイムスロット選択処理
   */
  function handleSlotSelection(info, calendar) {
    const start = new Date(info.startStr);
    const end = new Date(info.endStr);
    
    const message = '【予約作成】\n\n' +
                    '時間: ' + start.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'}) + 
                    ' - ' + end.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'}) + 
                    '\n\nこの時間帯で予約を作成しますか？';
    
    if (confirm(message)) {
      alert('予約作成機能は未実装です');
    }
    
    calendar.unselect();
  }

  /**
   * イベント読み込み
   */
  function loadEvents(info, successCallback, failureCallback) {
    // 管理者の場合は管理者API、一般ユーザーの場合は一般ユーザーAPI
    const isAdmin = window.location.pathname.includes('/admin');
    const url = isAdmin 
      ? '/admin/reservations/calendar?start=' + info.startStr + '&end=' + info.endStr
      : '/reservations/calendar?start=' + info.startStr + '&end=' + info.endStr;
    console.log('📅 Fetching events:', url);
    
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(data) {
        console.log('✅ Loaded', data.length, 'events');
        console.log('Events data:', JSON.stringify(data, null, 2));
        
        const events = data.map(function(event, index) {
          console.log(`Event ${index}:`, {
            id: event.id,
            title: event.title,
            extendedProps: event.extendedProps
          });
          
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
          
          // デバッグ用：is_other_userフラグを確認
          if (event.extendedProps.is_other_user) {
            console.log('他のユーザーの予約を検出（loadEvents）:', event.title, event.extendedProps);
          }
          
          delete event.resourceId;
          return event;
        });
        
        console.log('Processed events:', events);
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
    const isOtherUser = props && (
      props.is_other_user === true || 
      props.is_other_user === 'true'
    );
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
      // 管理者の場合は管理者ページ、一般ユーザーの場合は予約ページ
      const isAdmin = window.location.pathname.includes('/admin');
      if (isAdmin) {
        window.location.href = '/admin/reservations?date=' + current;
      } else {
        window.location.href = '/reservations/new?date=' + current;
      }
    }
  }

  /**
   * 日付ピッカー設定
   */
  function setupDatePicker() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) {
      datePicker.addEventListener('change', function() {
        // 管理者の場合は管理者ページ、一般ユーザーの場合は予約ページ
        const isAdmin = window.location.pathname.includes('/admin');
        if (isAdmin) {
          window.location.href = '/admin/reservations?date=' + this.value;
        } else {
          window.location.href = '/reservations/new?date=' + this.value;
        }
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
   * 設定モーダルを開く
   */
  window.openSettingsModal = function() {
    document.getElementById('settingsModal').style.display = 'block';
  };

  /**
   * 設定モーダルを閉じる
   */
  window.closeSettingsModal = function() {
    document.getElementById('settingsModal').style.display = 'none';
  };

  /**
   * モーダル外クリックで閉じる
   */
  document.addEventListener('click', function(event) {
    const reservationModal = document.getElementById('reservationModal');
    const settingsModal = document.getElementById('settingsModal');
    
    if (event.target === reservationModal) {
      closeModal();
    }
    if (event.target === settingsModal) {
      closeSettingsModal();
    }
  });
})();