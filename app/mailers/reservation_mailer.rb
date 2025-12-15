class ReservationMailer < ApplicationMailer
  # ApplicationMailerのfrom設定を継承（onboarding@resend.dev）

  # 予約確認メール(新規作成時)
  def confirmation_email(reservation)
    @reservation = reservation
    @user = reservation.user
    mail(
      to: @user.email,
      subject: '【予約確認】 ご予約が完了しました'
    )
  end

  # 予約変更通知メール(編集・更新時)
  def update_notification_email(reservation)
    @reservation = reservation
    @user = reservation.user
    mail(
      to: @user.email,
      subject: '【予約変更】 ご予約内容が変更されました！'
    )
  end

  # キャンセル通知メール(削除時)
  def cancellation_email(reservation, user_email)
    @reservation = reservation
    @user_email = user_email
    mail(
      to: @user_email,
      subject: '【予約キャンセル】 ご予約がキャンセルされました！'
    )
  end

  # リマインダーメール(予約日前日など)
  def reminder_email(reservation)
    @reservation = reservation
    @user = reservation.user
    mail(
      to: @user.email,
      subject: '【リマインダー】 明日のご予約について'
    )
  end
end

