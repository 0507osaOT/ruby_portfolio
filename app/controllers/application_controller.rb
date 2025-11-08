# app/controllers/application_controller.rb

class ApplicationController < ActionController::Base
  include Pundit::Authorization
  
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  
  # Deviseコントローラーで専用レイアウトを使用
  layout :layout_by_resource
  
  # 権限エラー時の処理
  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  
  private
  
  def layout_by_resource
    if devise_controller?
      "devise"
    else
      "application"
    end
  end
  
  # 権限がない場合のエラーハンドリング
  def user_not_authorized
    flash[:alert] = "この操作を実行する権限がありません。"
    if user_signed_in?
      if current_user.admin?
        redirect_to(request.referrer || admin_reservations_path)
      else
        redirect_to(request.referrer || new_reservation_path)
      end
    else
      redirect_to(request.referrer || new_user_session_path)
    end
  end
  
  # 現在のユーザーを取得（Pundit用）
  def pundit_user
    current_user
  end
end