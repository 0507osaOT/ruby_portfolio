class Admins::SessionsController < Devise::SessionsController
  # ログイン後のリダイレクト先
  def after_sign_in_path_for(resource)
    admin_reservations_path
  end

  # ログアウト後のリダイレクト先
  def after_sign_out_path_for(resource_or_scope)
    new_admin_session_path
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