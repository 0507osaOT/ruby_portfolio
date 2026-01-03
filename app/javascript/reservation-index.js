// 予約一覧ページ（index.html.erb）用のJavaScript

// 編集モーダルを開く関数
window.openEditModal = function(reservationId, startTime, endTime, notes) {
  const startTimeObj = new Date(startTime);
  const endTimeObj = new Date(endTime);
  const form = document.getElementById('editForm');
  const modal = document.getElementById('editModal');
  const dateDisplay = document.getElementById('edit_reservation_date_display');
  const startHourPicker = document.getElementById('edit_start_hour_input');
  const startMinutePicker = document.getElementById('edit_start_minute_input');
  const endHourPicker = document.getElementById('edit_end_hour_input');
  const endMinutePicker = document.getElementById('edit_end_minute_input');
  const notesInput = document.getElementById('edit_notes_input');
  const startTimeInput = document.getElementById('edit_reservation_start_time');
  const endTimeInput = document.getElementById('edit_reservation_end_time');
  
  if (form && modal && dateDisplay && startHourPicker && startMinutePicker && endHourPicker && endMinutePicker && notesInput && startTimeInput && endTimeInput) {
    // 日付表示を設定
    const year = startTimeObj.getFullYear();
    const month = String(startTimeObj.getMonth() + 1).padStart(2, '0');
    const day = String(startTimeObj.getDate()).padStart(2, '0');
    dateDisplay.textContent = year + '年' + month + '月' + day + '日';
    
    // 時間を10分刻みに丸める
    const startHour = startTimeObj.getHours();
    const startMinute = Math.round(startTimeObj.getMinutes() / 10) * 10;
    const endHour = endTimeObj.getHours();
    const endMinute = Math.round(endTimeObj.getMinutes() / 10) * 10;
    
    // 時間ピッカーに値を設定
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
    
    // 備考を設定
    notesInput.value = notes || '';
    
    // hiddenフィールドに初期値を設定
    updateEditHiddenTimeFields();
    
    // フォームのactionを設定（PATCH /reservations/:id）
    form.action = '/reservations/' + reservationId;
    
    // モーダルを開く
    modal.style.display = 'block';
  }
};

// 編集モーダルを閉じる関数
window.closeEditModal = function() {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// 編集フォームのhiddenフィールドを更新
function updateEditHiddenTimeFields() {
  const startHourPicker = document.getElementById('edit_start_hour_input');
  const startMinutePicker = document.getElementById('edit_start_minute_input');
  const endHourPicker = document.getElementById('edit_end_hour_input');
  const endMinutePicker = document.getElementById('edit_end_minute_input');
  const startTimeInput = document.getElementById('edit_reservation_start_time');
  const endTimeInput = document.getElementById('edit_reservation_end_time');
  const dateDisplay = document.getElementById('edit_reservation_date_display');
  
  if (!startHourPicker || !startMinutePicker || !endHourPicker || !endMinutePicker || !startTimeInput || !endTimeInput || !dateDisplay) {
    return;
  }
  
  // 日付表示から日付を取得
  const dateText = dateDisplay.textContent;
  const dateMatch = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  
  if (!dateMatch) {
    console.error('日付の解析に失敗しました');
    return;
  }
  
  const year = parseInt(dateMatch[1]);
  const month = parseInt(dateMatch[2]) - 1;
  const day = parseInt(dateMatch[3]);
  
  // 時間と分を取得
  const startHour = parseInt(startHourPicker.value);
  const startMinute = parseInt(startMinutePicker.value);
  const endHour = parseInt(endHourPicker.value);
  const endMinute = parseInt(endMinutePicker.value);
  
  // Dateオブジェクトを作成
  const startTime = new Date(year, month, day, startHour, startMinute, 0);
  const endTime = new Date(year, month, day, endHour, endMinute, 0);
  
  // hiddenフィールドにISO形式で設定
  startTimeInput.value = startTime.toISOString();
  endTimeInput.value = endTime.toISOString();
}

// グローバルスコープに明示的に定義
window.openDeleteModal = function(reservationId, customerName, datetime) {
  const nameElement = document.getElementById('delete-reservation-name');
  const datetimeElement = document.getElementById('delete-reservation-datetime');
  const form = document.getElementById('deleteForm');
  const modal = document.getElementById('deleteModal');
  
  if (nameElement && datetimeElement && form && modal) {
    nameElement.textContent = customerName;
    datetimeElement.textContent = datetime;
    form.action = '/reservations/' + reservationId;
    
    // CSRFトークンを確実に設定（削除フォーム用）
    const csrfToken = document.querySelector('meta[name="csrf-token"]');
    if (csrfToken) {
      // 既存のCSRFトークンフィールドを削除
      const existingTokens = form.querySelectorAll('input[name="authenticity_token"]');
      existingTokens.forEach(function(token) {
        token.remove();
      });
      
      // 新しいCSRFトークンフィールドを追加
      const authenticityTokenInput = document.createElement('input');
      authenticityTokenInput.type = 'hidden';
      authenticityTokenInput.name = 'authenticity_token';
      authenticityTokenInput.value = csrfToken.getAttribute('content');
      form.insertBefore(authenticityTokenInput, form.firstChild);
    }
    
    modal.style.display = 'block';
  }
};

window.closeDeleteModal = function() {
  const modal = document.getElementById('deleteModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

// DOMContentLoaded後にイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
  // 削除フォーム送信時にCSRFトークンを更新
  const deleteForm = document.getElementById('deleteForm');
  if (deleteForm) {
    deleteForm.addEventListener('submit', function(e) {
      const csrfToken = document.querySelector('meta[name="csrf-token"]');
      if (csrfToken) {
        // 既存のCSRFトークンフィールドをすべて削除
        const existingTokens = deleteForm.querySelectorAll('input[name="authenticity_token"]');
        existingTokens.forEach(function(token) {
          token.remove();
        });
        
        // 新しいCSRFトークンフィールドを追加
        const authenticityTokenInput = document.createElement('input');
        authenticityTokenInput.type = 'hidden';
        authenticityTokenInput.name = 'authenticity_token';
        authenticityTokenInput.value = csrfToken.getAttribute('content');
        deleteForm.insertBefore(authenticityTokenInput, deleteForm.firstChild);
      }
    });
  }
  
  // 編集ボタンにイベントリスナーを追加
  const editButtons = document.querySelectorAll('.btn-edit');
  editButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const reservationId = this.getAttribute('data-reservation-id');
      const startTime = this.getAttribute('data-start-time');
      const endTime = this.getAttribute('data-end-time');
      const notes = this.getAttribute('data-notes');
      window.openEditModal(reservationId, startTime, endTime, notes);
    });
  });
  
  // 編集モーダルの時間ピッカーにイベントリスナーを追加
  const editStartHourPicker = document.getElementById('edit_start_hour_input');
  const editStartMinutePicker = document.getElementById('edit_start_minute_input');
  const editEndHourPicker = document.getElementById('edit_end_hour_input');
  const editEndMinutePicker = document.getElementById('edit_end_minute_input');
  
  if (editStartHourPicker) {
    editStartHourPicker.addEventListener('change', updateEditHiddenTimeFields);
  }
  if (editStartMinutePicker) {
    editStartMinutePicker.addEventListener('change', updateEditHiddenTimeFields);
  }
  if (editEndHourPicker) {
    editEndHourPicker.addEventListener('change', updateEditHiddenTimeFields);
  }
  if (editEndMinutePicker) {
    editEndMinutePicker.addEventListener('change', updateEditHiddenTimeFields);
  }
  
  // 編集フォーム送信前に最終確認
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      updateEditHiddenTimeFields();
      
      // バリデーション: 終了時間が開始時間より後であることを確認
      const startHourPicker = document.getElementById('edit_start_hour_input');
      const startMinutePicker = document.getElementById('edit_start_minute_input');
      const endHourPicker = document.getElementById('edit_end_hour_input');
      const endMinutePicker = document.getElementById('edit_end_minute_input');
      
      if (startHourPicker && startMinutePicker && endHourPicker && endMinutePicker) {
        const startHour = parseInt(startHourPicker.value);
        const startMinute = parseInt(startMinutePicker.value);
        const endHour = parseInt(endHourPicker.value);
        const endMinute = parseInt(endMinutePicker.value);
        
        const startTotal = startHour * 60 + startMinute;
        const endTotal = endHour * 60 + endMinute;
        
        if (startTotal >= endTotal) {
          alert('終了時間は開始時間より後である必要があります。');
          return false;
        }
      }
      
      // フォームデータを取得してreservationキーでネスト
      const formData = new FormData(editForm);
      const csrfToken = document.querySelector('meta[name="csrf-token"]');
      const reservationId = editForm.action.split('/').pop();
      
      // reservationキーでネストされたデータを作成
      const nestedData = {
        reservation: {
          start_time: formData.get('reservation[start_time]') || formData.get('start_time'),
          end_time: formData.get('reservation[end_time]') || formData.get('end_time'),
          notes: formData.get('reservation[notes]') || formData.get('notes')
        }
      };
      
      // FormDataを作成
      const submitData = new FormData();
      submitData.append('authenticity_token', csrfToken ? csrfToken.getAttribute('content') : '');
      submitData.append('_method', 'PATCH');
      submitData.append('reservation[start_time]', nestedData.reservation.start_time);
      submitData.append('reservation[end_time]', nestedData.reservation.end_time);
      submitData.append('reservation[notes]', nestedData.reservation.notes || '');
      
      // fetch APIで送信
      fetch('/reservations/' + reservationId, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken ? csrfToken.getAttribute('content') : '',
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: submitData,
        credentials: 'same-origin'
      })
      .then(function(response) {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          return response.text().then(function(html) {
            if (html) {
              window.location.reload();
            }
          });
        }
      })
      .catch(function(error) {
        console.error('Error:', error);
        alert('予約の更新に失敗しました。');
      });
    });
  }
  
  // 編集モーダルの閉じるボタン
  const closeEditButton = document.getElementById('close-edit-modal');
  if (closeEditButton) {
    closeEditButton.addEventListener('click', window.closeEditModal);
  }
  
  // 削除ボタンにイベントリスナーを追加
  const deleteButtons = document.querySelectorAll('.btn-delete');
  deleteButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const reservationId = this.getAttribute('data-reservation-id');
      const customerName = this.getAttribute('data-customer-name');
      const datetime = this.getAttribute('data-datetime');
      window.openDeleteModal(reservationId, customerName, datetime);
    });
  });
  
  const closeButton = document.getElementById('close-delete-modal');
  if (closeButton) {
    closeButton.addEventListener('click', window.closeDeleteModal);
  }
  
  // モーダル外をクリックしたときに閉じる
  window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    if (editModal && event.target === editModal) {
      window.closeEditModal();
    }
    if (deleteModal && event.target === deleteModal) {
      window.closeDeleteModal();
    }
  });
});

