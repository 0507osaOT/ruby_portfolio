class Admins::SessionsController < Devise::SessionsController
  # ログイン後のリダイレクト先
  def after_sign_in_path_for(resource)
    admin_reservations_path
  end

  # ログアウト後のリダイレクト先
  def after_sign_out_path_for(resource_or_scope)
    new_admin_session_path
  end
end