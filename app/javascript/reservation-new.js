// 単日スケジュールページ（new.html.erb）用のJavaScript

// 一般ユーザー用の予約作成機能
(function() {
  // 元のhandleSlotSelectionを保存
  const originalHandleSlotSelection = window.handleSlotSelection;
  
  // 新しいhandleSlotSelectionを定義
  window.handleSlotSelection = function(info, calendar) {
    const start = new Date(info.startStr);
    const end = new Date(info.endStr);
    const now = new Date();
    
    // 過去の時間スロットを選択できないようにする
    if (start < now) {
      alert('過去の時間は予約できません');
      calendar.unselect();
      return;
    }
    
    // 空き枠を確認
    const dateStr = start.toISOString().split('T')[0];
    const url = '/reservations/available_slots?date=' + dateStr;
    
    fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(slots) {
        const selectedSlot = slots.find(function(slot) {
          return slot.start === start.toISOString() && slot.end === end.toISOString();
        });
        
        if (selectedSlot && selectedSlot.available && selectedSlot.available_count > 0) {
          openReservationForm(start, end);
        } else {
          alert('この時間帯は既に満員です。別の時間帯を選択してください。');
        }
        calendar.unselect();
      })
      .catch(function(error) {
        console.error('Error checking available slots:', error);
        alert('空き枠の確認に失敗しました。');
        calendar.unselect();
      });
  };
  
  function openReservationForm(start, end) {
    // 過去の時間チェック
    const now = new Date();
    if (start < now) {
      alert('過去の時間は予約できません');
      return;
    }
    
    const startTimeInput = document.getElementById('reservation_start_time');
    const endTimeInput = document.getElementById('reservation_end_time');
    const startHourPicker = document.getElementById('start_hour_input');
    const startMinutePicker = document.getElementById('start_minute_input');
    const endHourPicker = document.getElementById('end_hour_input');
    const endMinutePicker = document.getElementById('end_minute_input');
    const dateDisplay = document.getElementById('reservation_date_display');
    
    if (startTimeInput && endTimeInput && startHourPicker && startMinutePicker && endHourPicker && endMinutePicker && dateDisplay) {
      // hiddenフィールドにISO形式で設定
      startTimeInput.value = start.toISOString();
      endTimeInput.value = end.toISOString();
      
      // 時間ピッカーに値を設定（10分刻みに丸める）
      const startHour = start.getHours();
      const startMinute = Math.round(start.getMinutes() / 10) * 10;
      const endHour = end.getHours();
      const endMinute = Math.round(end.getMinutes() / 10) * 10;
      
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
      
      // 日付表示を更新（既に表示されている場合はそのまま）
      if (!dateDisplay.textContent) {
        const year = start.getFullYear();
        const month = String(start.getMonth() + 1).padStart(2, '0');
        const day = String(start.getDate()).padStart(2, '0');
        dateDisplay.textContent = year + '年' + month + '月' + day + '日';
      }
      
      // 過去の時間を選択できないようにする（今日の場合）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(start);
      selectedDate.setHours(0, 0, 0, 0);
      const isToday = selectedDate.getTime() === today.getTime();
      
      if (isToday) {
        // 過去の時間を無効化
        Array.from(startHourPicker.options).forEach(function(option) {
          const hour = parseInt(option.value);
          if (hour < now.getHours()) {
            option.disabled = true;
          } else if (hour === now.getHours()) {
            // 現在時刻と同じ時間の場合、過去の分を無効化
            Array.from(startMinutePicker.options).forEach(function(minOption) {
              const minute = parseInt(minOption.value);
              if (minute < Math.ceil(now.getMinutes() / 10) * 10) {
                minOption.disabled = true;
              }
            });
          } else {
            option.disabled = false;
          }
        });
        
        Array.from(endHourPicker.options).forEach(function(option) {
          const hour = parseInt(option.value);
          if (hour < now.getHours()) {
            option.disabled = true;
          } else if (hour === now.getHours()) {
            Array.from(endMinutePicker.options).forEach(function(minOption) {
              const minute = parseInt(minOption.value);
              if (minute < Math.ceil(now.getMinutes() / 10) * 10) {
                minOption.disabled = true;
              }
            });
          } else {
            option.disabled = false;
          }
        });
      } else {
        // 明日以降の場合は全て有効化
        Array.from(startHourPicker.options).forEach(function(option) {
          option.disabled = false;
        });
        Array.from(startMinutePicker.options).forEach(function(option) {
          option.disabled = false;
        });
        Array.from(endHourPicker.options).forEach(function(option) {
          option.disabled = false;
        });
        Array.from(endMinutePicker.options).forEach(function(option) {
          option.disabled = false;
        });
      }
      
      document.getElementById('createReservationModal').style.display = 'block';
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
    
    if (!startHourPicker || !startMinutePicker || !endHourPicker || !endMinutePicker || !startTimeInput || !endTimeInput) {
      console.error('必要な要素が見つかりません');
      return;
    }
    
    // 日付を取得（dateDisplayから、または現在の日付）
    let year, month, day;
    
    if (dateDisplay && dateDisplay.textContent) {
      const dateText = dateDisplay.textContent;
      const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
      
      if (dateMatch) {
        year = parseInt(dateMatch[1]);
        month = parseInt(dateMatch[2]) - 1; // 月は0から始まる
        day = parseInt(dateMatch[3]);
      }
    }
    
    // dateDisplayから取得できない場合は、現在の日付を使用
    if (!year || !month || !day) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      day = now.getDate();
      console.warn('日付表示から日付を取得できなかったため、現在の日付を使用します');
    }
    
    // 時間と分を取得
    const startHour = parseInt(startHourPicker.value) || 9;
    const startMinute = parseInt(startMinutePicker.value) || 0;
    const endHour = parseInt(endHourPicker.value) || 10;
    const endMinute = parseInt(endMinutePicker.value) || 0;
    
    // Dateオブジェクトを作成
    const startTime = new Date(year, month, day, startHour, startMinute, 0);
    const endTime = new Date(year, month, day, endHour, endMinute, 0);
    
    // hiddenフィールドにISO形式で設定
    startTimeInput.value = startTime.toISOString();
    endTimeInput.value = endTime.toISOString();
  }
  
  window.closeCreateModal = function() {
    document.getElementById('createReservationModal').style.display = 'none';
  };
  
  // エラーがある場合はモーダルを開く
  document.addEventListener('DOMContentLoaded', function() {
    const errorMessages = document.querySelector('.error-messages');
    if (errorMessages) {
      document.getElementById('createReservationModal').style.display = 'block';
    }
    
    // 時間ピッカーにイベントリスナーを追加
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
})();

