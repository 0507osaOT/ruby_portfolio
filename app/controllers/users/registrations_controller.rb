# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  before_action :configure_sign_up_params, only: [:create]
  before_action :configure_account_update_params, only: [:update]

  # GET /resource/sign_up
  # def new
  #   super
  # end

  # POST /resource
  # def create
  #   super
  # end

  # GET /resource/edit
  # def edit
  #   super
  # end

  # PUT /resource
  def update
    self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
    
    # パスワードが空の場合はパスワード関連のパラメータを削除
    account_update_params_hash = account_update_params.to_h
    if account_update_params_hash[:password].blank?
      account_update_params_hash.delete(:password)
      account_update_params_hash.delete(:password_confirmation)
    end
    
    # current_passwordの検証
    if account_update_params_hash[:current_password].blank?
      resource.errors.add(:current_password, "を入力してください")
      clean_up_passwords resource
      set_minimum_password_length
      render :edit
      return
    end
    
    unless resource.valid_password?(account_update_params_hash[:current_password])
      resource.errors.add(:current_password, "が正しくありません")
      clean_up_passwords resource
      set_minimum_password_length
      render :edit
      return
    end
    
    # current_passwordを削除（保存時に含めない）
    account_update_params_hash.delete(:current_password)
    
    resource_updated = resource.update(account_update_params_hash)
    
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

  # DELETE /resource
  # def destroy
  #   super
  # end

  # GET /resource/cancel
  # Forces the session data which is usually expired after sign
  # in to be expired now. This is useful if the user wants to
  # cancel oauth signing in/up in the middle of the process,
  # removing all OAuth session data.
  # def cancel
  #   super
  # end

  protected

  # If you have extra params to permit, append them to the sanitizer.
  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email])
  end

  # If you have extra params to permit, append them to the sanitizer.
  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email])
  end

  # The path used after sign up.
  def after_sign_up_path_for(resource)
    if resource.admin?
      admin_reservations_path
    else
      new_reservation_path
    end
  end

  # The path used after sign up for inactive accounts.
  def after_inactive_sign_up_path_for(resource)
    new_user_session_path
  end

  # 情報更新後のリダイレクト先
  def after_update_path_for(resource)
    edit_user_registration_path
  end
end

