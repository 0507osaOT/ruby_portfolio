# frozen_string_literal: true

class Admins::RegistrationsController < Devise::RegistrationsController
  before_action :configure_account_update_params, only: [:update]

  # PUT /resource
  def update
    self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
    
    # current_passwordをparamsから直接取得
    current_password = params[resource_name][:current_password] if params[resource_name]
    
    # current_passwordの検証
    if current_password.blank?
      resource.errors.add(:current_password, "を入力してください")
      clean_up_passwords resource
      set_minimum_password_length
      render :edit
      return
    end
    
    unless resource.valid_password?(current_password)
      resource.errors.add(:current_password, "が正しくありません")
      clean_up_passwords resource
      set_minimum_password_length
      render :edit
      return
    end
    
    # paramsから必要なパラメータを直接取得して更新
    update_params = {}
    if params[resource_name]
      update_params[:phone_number] = params[resource_name][:phone_number] if params[resource_name][:phone_number].present?
      update_params[:email] = params[resource_name][:email] if params[resource_name][:email].present?
      # パスワードが空でない場合のみ追加
      if params[resource_name][:password].present?
        update_params[:password] = params[resource_name][:password]
        update_params[:password_confirmation] = params[resource_name][:password_confirmation] if params[resource_name][:password_confirmation].present?
      end
    end
    
    # current_passwordが含まれていないことを確認（念のため）
    update_params.delete(:current_password)
    update_params.delete('current_password')
    
    resource_updated = resource.update(update_params)
    
    yield resource if block_given?
    if resource_updated
      set_flash_message! :notice, :updated
      bypass_sign_in resource, scope: resource_name
      redirect_to after_update_path_for(resource), notice: 'アカウント情報を更新しました。'
    else
      clean_up_passwords resource
      set_minimum_password_length
      render :edit
    end
  end

  protected

  # If you have extra params to permit, append them to the sanitizer.
  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:phone_number, :email])
    # current_passwordも明示的にpermitする
    devise_parameter_sanitizer.permit(:account_update, keys: [:current_password])
  end

  # 情報更新後のリダイレクト先
  def after_update_path_for(resource)
    edit_admin_registration_path
  end
end

