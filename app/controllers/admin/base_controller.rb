# frozen_string_literal: true

class Admin::BaseController < ApplicationController
  # ログイン必須
  before_action :authenticate_user!

  # 管理者権限チェック
  before_action :require_admin!

  layout "admin"

  private

  # 管理者でない場合はアクセスを拒否
  def require_admin!
    unless current_user&.admin?
      flash[:alert] = "管理者権限が必要です。"
      if user_signed_in?
        redirect_to new_reservation_path
      else
        redirect_to new_user_session_path
      end
    end
  end
end
