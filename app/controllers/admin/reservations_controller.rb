class Admin::ReservationsController < Admin::BaseController
  before_action :authorize_reservation, except: [ :calendars, :calendar, :calendar_events, :available_slots ]
  before_action :set_reservation, only: [:show, :destroy]

  layout "admin", except: :calendars

  def index
    authorize :reservation, :index?, policy_class: AdminReservationPolicy
    @date = params[:date].present? ? Date.parse(params[:date]) : Date.today
    @reservations = Reservation.on_date(@date).order(:start_time, :id)
  rescue ArgumentError
    @date = Date.today
    @reservations = Reservation.on_date(@date).order(:start_time, :id)
  end

  # カレンダーページ
  def calendars
    authorize :reservation, :calendars?, policy_class: AdminReservationPolicy
    render layout: false
  end

  # FullCalendar用のイベント一覧（既存のメソッド）
  def calendar
    authorize :reservation, :calendar?, policy_class: AdminReservationPolicy
    start_date = params[:start]
    end_date = params[:end]

    reservations = Reservation.where(
      "start_time >= ? AND start_time <= ?",
      start_date,
      end_date
    ).order(:start_time, :created_at, :id)

    # 重なる予約を異なる枠に割り当て
    slot_assignments = Reservation.assign_slot_indices(reservations.to_a)

    render json: reservations.map { |r| r.to_fullcalendar_event(slot_assignments[r.id]) }
  end

  # カレンダーイベント用（新規追加）
  def calendar_events
    authorize :reservation, :calendar_events?, policy_class: AdminReservationPolicy
    # パラメータから日付範囲を取得（FullCalendarが自動的に送信）
    if params[:start].present? && params[:end].present?
      start_date = Time.parse(params[:start])
      end_date = Time.parse(params[:end])
    else
      # パラメータがない場合は当月のデータを返す
      start_date = Date.today.beginning_of_month.beginning_of_day
      end_date = Date.today.end_of_month.end_of_day
    end

    reservations = Reservation.where(
      "start_time >= ? AND start_time < ?",
      start_date,
      end_date
    ).order(:start_time, :created_at, :id)

    # 重なる予約を異なる枠に割り当て
    slot_assignments = Reservation.assign_slot_indices(reservations.to_a)

    events = reservations.map do |reservation|
      slot_index = slot_assignments[reservation.id] || 0

      {
        id: reservation.id,
        title: reservation.customer_name,
        start: reservation.start_time.iso8601,
        end: reservation.end_time.iso8601,
        className: "status-#{reservation.status || 'confirmed'}",
        extendedProps: {
          customer: reservation.customer_name,
          phone: reservation.customer_phone,
          email: reservation.customer_email,
          status: reservation.status || "confirmed",
          notes: reservation.notes,
          user_id: reservation.user_id,
          slot_index: slot_index
        }
      }
    end

    render json: events
  end

  def available_slots
    authorize :reservation, :available_slots?, policy_class: AdminReservationPolicy
    date = Date.parse(params[:date])
    duration = 60 # 固定1時間

    slots = generate_available_slots(date, duration)
    render json: slots
  end

  def list
    authorize :reservation, :list?, policy_class: AdminReservationPolicy
    @reservations = Reservation.all

    # 検索条件の適用
    if params[:reservation_date].present?
      date = Date.parse(params[:reservation_date])
      @reservations = @reservations.on_date(date)
    end

    if params[:reservation_time].present?
      time_str = params[:reservation_time]
      @reservations = @reservations.where("TIME(start_time) = ?", time_str)
    end

    if params[:name].present?
      @reservations = @reservations.where("customer_name LIKE ?", "%#{params[:name]}%")
    end

    if params[:phone].present?
      @reservations = @reservations.where("customer_phone LIKE ?", "%#{params[:phone]}%")
    end

    if params[:email].present?
      @reservations = @reservations.where("customer_email LIKE ?", "%#{params[:email]}%")
    end

    @reservations = @reservations.order(start_time: :desc)
                                 .page(params[:page]).per(20)
  end

  def show
    authorize @reservation, :show?, policy_class: AdminReservationPolicy
  end

  def destroy
    authorize @reservation, :destroy?, policy_class: AdminReservationPolicy
    @reservation.destroy
    redirect_to list_admin_reservations_path, notice: "予約を削除しました"
  end

  private

  def set_reservation
    @reservation = Reservation.find(params[:id])
  end

  def authorize_reservation
    authorize :reservation, policy_class: AdminReservationPolicy
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
