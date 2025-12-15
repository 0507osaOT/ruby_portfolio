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
  
  # ログアウト処理をオーバーライドしてキャッシュを無効化
  def destroy
    super
    # キャッシュを完全に無効化（ログアウト後のリダイレクト先でも有効）
    response.headers["Cache-Control"] = "no-cache, no-store, max-age=0, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "Fri, 01 Jan 1990 00:00:00 GMT"
  end
end

