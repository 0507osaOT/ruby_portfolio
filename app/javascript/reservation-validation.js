// 予約フォームの共通バリデーション処理

/**
 * 過去の日時での予約をチェック
 * @param {Date} selectedStartTime - 選択された開始日時
 * @param {Date} selectedEndTime - 選択された終了日時
 * @returns {boolean} - 過去の日時でない場合はtrue、過去の日時の場合はfalse
 */
function validateNotPastDateTime(selectedStartTime, selectedEndTime) {
  const now = new Date();
  
  if (selectedStartTime < now) {
    alert('過去の日時での予約はできません。');
    return false;
  }
  
  if (selectedEndTime < now) {
    alert('過去の日時での予約はできません。');
    return false;
  }
  
  return true;
}

/**
 * 日付表示から日付を取得
 * @param {string} dateDisplayText - 日付表示テキスト（例: "2024年1月1日"）
 * @returns {Object|null} - {year, month, day} または null
 */
function parseDateFromDisplay(dateDisplayText) {
  if (!dateDisplayText) return null;
  
  const dateMatch = dateDisplayText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!dateMatch) return null;
  
  return {
    year: parseInt(dateMatch[1]),
    month: parseInt(dateMatch[2]) - 1, // 月は0から始まる
    day: parseInt(dateMatch[3])
  };
}

/**
 * フォーム送信前のバリデーション
 * @param {string} dateDisplayId - 日付表示要素のID
 * @param {string} startHourPickerId - 開始時間（時）のselect要素のID
 * @param {string} startMinutePickerId - 開始時間（分）のselect要素のID
 * @param {string} endHourPickerId - 終了時間（時）のselect要素のID
 * @param {string} endMinutePickerId - 終了時間（分）のselect要素のID
 * @returns {boolean} - バリデーション成功時はtrue、失敗時はfalse
 */
function validateReservationForm(dateDisplayId, startHourPickerId, startMinutePickerId, endHourPickerId, endMinutePickerId) {
  const dateDisplay = document.getElementById(dateDisplayId);
  const startHourPicker = document.getElementById(startHourPickerId);
  const startMinutePicker = document.getElementById(startMinutePickerId);
  const endHourPicker = document.getElementById(endHourPickerId);
  const endMinutePicker = document.getElementById(endMinutePickerId);
  
  if (!startHourPicker || !startMinutePicker || !endHourPicker || !endMinutePicker) {
    return true; // 要素が見つからない場合はスキップ
  }
  
  const startHour = parseInt(startHourPicker.value);
  const startMinute = parseInt(startMinutePicker.value);
  const endHour = parseInt(endHourPicker.value);
  const endMinute = parseInt(endMinutePicker.value);
  
  // 終了時間が開始時間より後であることを確認
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  
  if (startTotal >= endTotal) {
    alert('終了時間は開始時間より後である必要があります。');
    return false;
  }
  
  // 過去の日時チェック
  if (dateDisplay && dateDisplay.textContent) {
    const dateInfo = parseDateFromDisplay(dateDisplay.textContent);
    
    if (dateInfo) {
      const selectedStartTime = new Date(dateInfo.year, dateInfo.month, dateInfo.day, startHour, startMinute, 0);
      const selectedEndTime = new Date(dateInfo.year, dateInfo.month, dateInfo.day, endHour, endMinute, 0);
      
      if (!validateNotPastDateTime(selectedStartTime, selectedEndTime)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 過去の日付かどうかをチェック
 * @param {Date} date - チェックする日付
 * @returns {boolean} - 過去の日付の場合はtrue
 */
function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
}

/**
 * 過去の時間かどうかをチェック
 * @param {Date} dateTime - チェックする日時
 * @returns {boolean} - 過去の日時の場合はtrue
 */
function isPastDateTime(dateTime) {
  const now = new Date();
  return dateTime < now;
}

// グローバルスコープに公開
window.ReservationValidation = {
  validateNotPastDateTime: validateNotPastDateTime,
  parseDateFromDisplay: parseDateFromDisplay,
  validateReservationForm: validateReservationForm,
  isPastDate: isPastDate,
  isPastDateTime: isPastDateTime
};

