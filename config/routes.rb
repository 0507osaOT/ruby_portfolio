Rails.application.routes.draw do
  # ユーザー用Devise
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    sessions: 'users/sessions'
  }
  
  # 管理者用Devise（登録は無効化）
  devise_for :admins, skip: [:registrations]
  
  # 管理者用ルート
  namespace :admin do
    resources :reservations do
      collection do
        get :calendar           # 単日カレンダー（既存）
        get :calendars          # 月次カレンダー（既存）
        get :calendar_events    # イベントAPI（既存）
        get :available_slots    # 空き枠API（既存）
        get :list               # 予約リスト（新規追加）← as を削除
      end
      
      member do
        # 個別の予約操作（必要に応じて追加）
        patch :confirm          # 予約確定
        patch :cancel           # 予約キャンセル
      end
    end
    
    # 管理者ダッシュボード（オプション）
    root 'reservations#index'
  end
     
  # ユーザー用ルート
  resources :reservations, only: [:index, :new, :create, :show, :update, :destroy] do
    collection do
      get :available_slots
      get :calendar  # カレンダー用イベントAPI
      get :calendars  # 月次カレンダーページ
      get :calendar_events  # カレンダーイベントAPI（月次用）
    end
  end
  
  # サイトのルートパス
  root 'admin/reservations#index'  # 管理者画面をトップに
end