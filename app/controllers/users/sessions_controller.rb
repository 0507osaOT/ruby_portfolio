# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  # ログイン後のリダイレクト先（管理者の場合は単日スケジュールへ、一般ユーザーは予約作成ページへ）
  def after_sign_in_path_for(resource)
    if resource.admin?
      admin_reservations_path  # 単日スケジュール（indexアクション）
    else
      new_reservation_path  # 予約作成ページ
    end
  end

  # ログアウト後のリダイレクト先
  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end
end

