class ReservationsController < ApplicationController
  before_action :authenticate_user!
  
  layout 'admin'
  
  def index
    authorize :reservation, :index?
    @reservations = policy_scope(Reservation).where(user_id: current_user.id)
                                             .order(start_time: :desc)
                                             .page(params[:page]).per(20)
  end

  def new
    authorize :reservation, :new?
    @date = params[:date].present? ? Date.parse(params[:date]) : Date.today
    @reservations = Reservation.on_date(@date).order(:start_time, :id)
  rescue ArgumentError
    @date = Date.today
    @reservations = Reservation.on_date(@date).order(:start_time, :id)
  end

  def create
    authorize :reservation, :create?
    
    @reservation = Reservation.new(reservation_params)
    @reservation.user = current_user
    @reservation.status = 'confirmed'
    
        # ログインユーザーの情報を自動設定
        if @reservation.customer_name.blank?
          @reservation.customer_name = current_user.name.presence || current_user.email.split('@').first if current_user.email.present?
        end
    if @reservation.customer_email.blank?
      @reservation.customer_email = current_user.email
    end
    
    if @reservation.save
      # リダイレクト先を決定
      return_to = params[:return_to]
      
      if return_to == 'calendars'
        redirect_to calendars_reservations_path, notice: '予約が正常に作成されました。'
      elsif return_to == 'new' && params[:date].present?
        redirect_to new_reservation_path(date: params[:date]), notice: '予約が正常に作成されました。'
      else
        redirect_to reservation_path(@reservation), notice: '予約が正常に作成されました。'
      end
    else
      @date = params[:date].present? ? Date.parse(params[:date]) : Date.today
      # エラー時はモーダルを開いた状態で表示するため、JavaScriptで処理
      flash.now[:alert] = '予約の作成に失敗しました。'
      
      # リダイレクト元に応じて適切なビューを表示
      return_to = params[:return_to]
      if return_to == 'calendars'
        # カレンダーページの場合、エラー情報を保持してリダイレクト
        # エラー情報をflashに保存（セッション経由で保持）
        flash[:alert] = @reservation.errors.full_messages.join(', ')
        # フォームの値をflashに保存
        flash[:reservation_params] = params[:reservation]
        redirect_to calendars_reservations_path
      else
        render :new, status: :unprocessable_entity
      end
    end
  rescue ArgumentError
    @date = Date.today
    flash.now[:alert] = '日付の形式が正しくありません。'
    render :new, status: :unprocessable_entity
  end

  def show
    @reservation = Reservation.find(params[:id])
    authorize @reservation, :show?
  end

  def update
    @reservation = Reservation.find(params[:id])
    authorize @reservation, :update?
    
    if @reservation.update(reservation_params)
      redirect_to reservations_path, notice: '予約を更新しました。'
    else
      redirect_to reservations_path, alert: '予約の更新に失敗しました。'
    end
  end

  def destroy
    @reservation = Reservation.find(params[:id])
    authorize @reservation, :destroy?
    
    if @reservation.destroy
      redirect_to reservations_path, notice: '予約を削除しました。'
    else
      redirect_to reservations_path, alert: '予約の削除に失敗しました。'
    end
  end

  def available_slots
    authorize :reservation, :create?
    date = Date.parse(params[:date])
    duration = 60 # 固定1時間
    
    slots = generate_available_slots(date, duration)
    render json: slots
  rescue ArgumentError
    render json: { error: 'Invalid date' }, status: :bad_request
  end

  # カレンダー用のイベント一覧（一般ユーザー用）
  def calendar
    authorize :reservation, :new?
    start_date = params[:start]
    end_date = params[:end]
    
    reservations = Reservation.where(
      'start_time >= ? AND start_time <= ?',
      start_date,
      end_date
    ).order(:start_time, :created_at, :id)
    
    # 重なる予約を異なる枠に割り当て
    slot_assignments = Reservation.assign_slot_indices(reservations.to_a)
    
    # 一般ユーザーの場合、他のユーザーの予約を「【予約　有り】」に変更
    is_regular_user = current_user.present? && !current_user.admin?
    
    events = reservations.map do |r|
      event = r.to_fullcalendar_event(slot_assignments[r.id])
      if is_regular_user && r.user_id.present? && r.user_id != current_user.id
        # タイトルとis_other_userフラグを設定
        event[:title] = '【予約　有り】'
        event[:extendedProps][:is_other_user] = true
        Rails.logger.debug "他のユーザーの予約を設定: reservation_id=#{r.id}, user_id=#{r.user_id}, current_user_id=#{current_user.id}"
      end
      # ハッシュを明示的にJSON互換の形式に変換（文字列キーに変換）
      {
        'id' => event[:id],
        'title' => event[:title],
        'start' => event[:start],
        'end' => event[:end],
        'resourceId' => event[:resourceId],
        'extendedProps' => {
          'email' => event[:extendedProps][:email],
          'phone' => event[:extendedProps][:phone],
          'notes' => event[:extendedProps][:notes],
          'status' => event[:extendedProps][:status],
          'slot_index' => event[:extendedProps][:slot_index],
          'user_id' => event[:extendedProps][:user_id],
          'is_other_user' => event[:extendedProps][:is_other_user]
        }
      }
    end
    
    render json: events
  end

  # カレンダーページ（月次表示）
  def calendars
    authorize :reservation, :new?
    # エラー時のフォーム値を復元
    if flash[:reservation_params]
      @reservation = Reservation.new(flash[:reservation_params])
      @reservation.valid? # エラーを設定
      # flash[:reservation_params]はJavaScriptで使用するため保持
      @reservation_params = flash[:reservation_params]
    end
    render layout: false
  end

  # カレンダーイベント用（月次表示用）
  def calendar_events
    authorize :reservation, :new?
    if params[:start].present? && params[:end].present?
      start_date = params[:start]
      end_date = params[:end]
    else
      start_date = Date.today.beginning_of_month
      end_date = Date.today.end_of_month
    end
    
    reservations = Reservation.where(
      'start_time >= ? AND start_time <= ?',
      start_date,
      end_date
    ).order(:start_time, :created_at, :id)
    
    # 重なる予約を異なる枠に割り当て
    slot_assignments = Reservation.assign_slot_indices(reservations.to_a)
    
    # 一般ユーザーの場合、他のユーザーの予約を「【予約　有り】」に変更
    is_regular_user = current_user.present? && !current_user.admin?
    
    events = reservations.map do |reservation|
      slot_index = slot_assignments[reservation.id] || 0
      
      # 一般ユーザーで他のユーザーの予約の場合
      if is_regular_user && reservation.user_id != current_user.id
        title = '【予約　有り】'
        is_other_user = true
      else
        title = reservation.customer_name
        is_other_user = false
      end
      
      {
        id: reservation.id,
        title: title,
        start: reservation.start_time.iso8601,
        end: reservation.end_time.iso8601,
        className: "status-#{reservation.status || 'confirmed'}",
        extendedProps: {
          customer: reservation.customer_name,
          phone: reservation.customer_phone,
          email: reservation.customer_email,
          status: reservation.status || 'confirmed',
          notes: reservation.notes,
          user_id: reservation.user_id,
          slot_index: slot_index,
          is_other_user: is_other_user
        }
      }
    end
    
    render json: events
  end

  private

  def reservation_params
    params.require(:reservation).permit(:start_time, :end_time, :customer_name, :customer_email, :customer_phone, :notes)
  end

  def generate_available_slots(date, duration_minutes)
    business_start = 9
    business_end = 18
    slots = []
    max_capacity = Reservation::MAX_CAPACITY
    
    (business_start...business_end).each do |hour|
      slot_start = Time.zone.local(date.year, date.month, date.day, hour, 0)
      slot_end = slot_start + duration_minutes.minutes
      
      # この時間帯の予約数を確認
      existing_count = Reservation.at_time_slot(slot_start, slot_end).count
      available_count = max_capacity - existing_count
      
      if available_count > 0
        slots << {
          start: slot_start.iso8601,
          end: slot_end.iso8601,
          available: true,
          available_count: available_count,
          total_capacity: max_capacity
        }
      end
    end
    
    slots
  end
end
