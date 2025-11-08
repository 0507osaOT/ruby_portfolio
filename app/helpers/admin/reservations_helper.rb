# app/helpers/admin/reservations_helper.rb

module Admin::ReservationsHelper
  # ステータスを日本語に変換
  def status_text(status)
    case status
    when 'confirmed'
      '確定'
    when 'pending'
      '保留'
    when 'cancelled'
      'キャンセル'
    else
      '不明'
    end
  end

  # ステータスに応じたバッジのCSSクラスを返す
  def status_badge_class(status)
    case status
    when 'confirmed'
      'badge-success'
    when 'pending'
      'badge-warning'
    when 'cancelled'
      'badge-secondary'
    else
      'badge-light'
    end
  end
end